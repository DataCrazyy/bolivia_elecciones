// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();
const db = admin.firestore();

// Lista de IDs de candidatos para la inicialización correcta
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
      
      // Ya no se recibe el recaptchaToken
      const {municipioId, candidateId, voterToken} = request.body;
      if (!municipioId || !candidateId || !voterToken) {
        return response.status(400).send("Faltan datos en la solicitud.");
      }
      
      const ip = request.headers["x-forwarded-for"] || request.socket.remoteAddress;
      const userAgent = request.headers["user-agent"] || "unknown";
      
      // La huella digital ahora se basa solo en el token único
      const logRef = db.collection("log_votos_ip");

      // VALIDACIÓN CLAVE: Buscar si el TOKEN único del navegador ya votó.
      const votoExistenteQuery = logRef.where("voterToken", "==", voterToken);
      const votoExistenteSnapshot = await votoExistenteQuery.get();

      if (!votoExistenteSnapshot.empty) {
        return response.status(429).send("Este navegador ya ha emitido un voto.");
      }

      // --- Si la validación pasa, se registra el voto ---
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
          voterToken, ip, userAgent, municipioId, candidateId,
          timestamp: new Date(),
        });
      });

      return response.status(200).send({success: true});

    } catch (error)
    {
      functions.logger.error("Error catastrófico en registrarVoto:", error);
      return response.status(500).send("Error interno del servidor.");
    }
  });
});