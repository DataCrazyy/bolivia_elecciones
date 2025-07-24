// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// ⬇️ ¡MUY IMPORTANTE! ⬇️
// Pega aquí tu "Clave SECRETA" de reCAPTCHA.
const RECAPTCHA_SECRET_KEY = 'Pega-aqui-tu-CLAVE-SECRETA';

const CANDIDATE_IDS = [
  'samuel_doria_medina', 'jorge_quiroga', 'andronico_rodriguez', 
  'manfred_reyes_villa', 'rodrigo_paz_pereira', 'jhonny_fernandez',
  'eduardo_del_castillo', 'eva_copa_murga', 'fidel_yapu_zambrama',
  'paulo_c_rodriguez'
];

exports.registrarVoto = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      if (request.method !== "POST") {
        return response.status(403).send("Forbidden!");
      }
      
      const {municipioId, candidateId, voterToken, recaptchaToken} = request.body;
      if (!municipioId || !candidateId || !voterToken || !recaptchaToken) {
        return response.status(400).send("Faltan datos en la solicitud.");
      }

      const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
      
      const recaptchaResponse = await axios.post(verificationUrl);
      const { success, score } = recaptchaResponse.data;

      if (!success || score < 0.5) {
        functions.logger.warn("Verificación reCAPTCHA fallida:", {score});
        return response.status(403).send("Verificación fallida. Se ha detectado comportamiento de bot.");
      }
      
      const ip = request.headers["x-forwarded-for"] || request.socket.remoteAddress;
      const userAgent = request.headers["user-agent"] || "unknown";
      const fingerprint = `${ip}_${voterToken}`;

      const logRef = db.collection("log_votos_ip");
      const veinticuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const votoExistente = await logRef
          .where("fingerprint", "==", fingerprint)
          .where("timestamp", ">", veinticuatroHorasAtras)
          .get();

      if (!votoExistente.empty) {
        return response.status(429).send("Este navegador ya ha votado recientemente.");
      }

      const municipioRef = db.collection("votos_por_municipio").doc(String(municipioId));
      const newLogRef = db.collection("log_votos_ip").doc();

      await db.runTransaction(async (transaction) => {
        const municipioDoc = await transaction.get(municipioRef);
        if (!municipioDoc.exists) {
            const initialVotes = { votos_totales: 1 };
            CANDIDATE_IDS.forEach(id => { initialVotes[`votos_${id}`] = 0; });
            initialVotes[`votos_${candidateId}`] = 1;
            transaction.set(municipioRef, initialVotes);
        } else {
            transaction.update(municipioRef, {
                [`votos_${candidateId}`]: admin.firestore.FieldValue.increment(1),
                votos_totales: admin.firestore.FieldValue.increment(1),
            });
        }
        transaction.set(newLogRef, {
          fingerprint, voterToken, ip, userAgent, municipioId, candidateId,
          timestamp: new Date(),
        });
      });

      return response.status(200).send({success: true});

    } catch (error) {
      functions.logger.error("Error catastrófico en registrarVoto:", error);
      return response.status(500).send("Error interno del servidor.");
    }
  });
});
