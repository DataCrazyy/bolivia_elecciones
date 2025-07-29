// app/page.js

'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import NationalResultsBar from '../components/NationalResultsBar';
import DepartmentalDashboard from '../components/DepartmentalDashboard';
import ShareModal from '../components/ShareModal';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { CANDIDATES } from '../config/candidates';
import { Toaster, toast } from 'react-hot-toast';

const GEOJSON_URL = '/municipios_optimizado.geojson';

const MapLoader = dynamic(() => import('../components/MapLoader'), { 
  ssr: false,
  loading: () => <div style={{height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', color: '#666', fontSize: '18px'}}>Cargando mapa interactivo...</div>
});

// --- Estilos ---
const headerStyle = {
  padding: '20px 0',
  borderBottom: '1px solid #dee2e6',
  marginBottom: '20px',
  backgroundColor: '#f8f9fa',
  position: 'relative',
};

const headerContentStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '20px',
};

const tricolorBarStyle = {
  width: '100%',
  height: '6px',
  display: 'flex',
  position: 'absolute',
  top: 0,
  left: 0,
};

const titleContainerStyle = { flexGrow: 1, textAlign: 'center' };
const titleStyle = { margin: 0, fontSize: '2.5rem', color: '#212529' };
const sloganStyle = { margin: '5px 0 0 0', fontSize: '1.2rem', color: '#6c757d', fontWeight: 300 };
const shareButtonStyle = {
  padding: '8px 16px', fontSize: '16px', cursor: 'pointer', borderRadius: '5px',
  border: '1px solid #007AFF', backgroundColor: '#fff', color: '#007AFF',
  transition: 'background-color 0.2s, color 0.2s',
  whiteSpace: 'nowrap'
};

export default function Home() {
  const [voteData, setVoteData] = useState({});
  const [geojson, setGeojson] = useState(null);
  const [nationalResults, setNationalResults] = useState({ totalVotes: 0, data: {}, percentages: {} });
  const [departmentalData, setDepartmentalData] = useState({});
  const [allDepartments, setAllDepartments] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [fingerprintStatus, setFingerprintStatus] = useState('checking');
  const [visitorId, setVisitorId] = useState(null);

  const handleScriptLoad = async () => {
    if (localStorage.getItem('boliviaDecideVoted')) {
      setFingerprintStatus('denied');
      toast.error('Este dispositivo ya ha registrado un voto.');
      return;
    }

    toast.loading('Verificando dispositivo...', { id: 'fingerprint-toast' });
    
    try {
      const fp = await window.FingerprintJS.load();
      const result = await fp.get();
      const id = result.visitorId;
      setVisitorId(id);

      const logRef = collection(db, "log_votos");
      const q = query(logRef, where("fingerprint", "==", id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error('Este dispositivo ya ha registrado un voto.', { id: 'fingerprint-toast' });
        setFingerprintStatus('denied');
        localStorage.setItem('boliviaDecideVoted', 'true');
      } else {
        toast.success('Dispositivo verificado.', { id: 'fingerprint-toast' });
        setFingerprintStatus('allowed');
      }
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.warn("Advertencia: No se pudo verificar la huella digital. Se permitirá el voto.");
        toast.success('Dispositivo verificado.', { id: 'fingerprint-toast' });
        setFingerprintStatus('allowed');
      } else {
        console.error("Error al verificar la huella digital:", error);
        toast.error('No se pudo verificar el dispositivo.', { id: 'fingerprint-toast' });
        setFingerprintStatus('denied');
      }
    }
  };

  useEffect(() => {
    let unsubVotes = () => {};
    let municipioToDeptLookup = {};

    fetch(GEOJSON_URL)
      .then(resp => resp.json())
      .then(mapData => {
        setGeojson(mapData);
        
        const depts = new Set();
        mapData.features.forEach(feature => {
          if (feature.properties.codigo_ine && feature.properties.nombre_dep) {
            municipioToDeptLookup[feature.properties.codigo_ine] = feature.properties.nombre_dep;
            depts.add(feature.properties.nombre_dep);
          }
        });
        const sortedDepts = ['NIVEL NACIONAL', ...Array.from(depts).sort()];
        setAllDepartments(sortedDepts);

        unsubVotes = onSnapshot(collection(db, "votos_por_municipio"), (snapshot) => {
          const newVoteData = {};
          snapshot.forEach((doc) => { newVoteData[doc.id] = doc.data(); });
          setVoteData(newVoteData);

          const natTotals = { grandTotal: 0 };
          const deptTotals = {};
          Object.keys(CANDIDATES).forEach(id => { natTotals[`votos_${id}`] = 0; });

          snapshot.forEach((doc) => {
            const voteEntry = doc.data();
            const municipioId = doc.id;
            const department = municipioToDeptLookup[municipioId];
            if (department) {
              if (!deptTotals[department]) {
                deptTotals[department] = { votos_totales: 0 };
                Object.keys(CANDIDATES).forEach(id => { deptTotals[department][`votos_${id}`] = 0; });
              }
              deptTotals[department].votos_totales += voteEntry.votos_totales || 0;
              Object.keys(CANDIDATES).forEach(id => { deptTotals[department][`votos_${id}`] += voteEntry[`votos_${id}`] || 0; });
            }
            natTotals.grandTotal += voteEntry.votos_totales || 0;
            Object.keys(CANDIDATES).forEach(id => { natTotals[`votos_${id}`] += voteEntry[`votos_${id}`] || 0; });
          });
          
          const natPercentages = {};
          if (natTotals.grandTotal > 0) {
            Object.keys(CANDIDATES).forEach(id => {
              natPercentages[id] = ((natTotals[`votos_${id}`] / natTotals.grandTotal) * 100);
            });
          }
          setNationalResults({ totalVotes: natTotals.grandTotal, data: natTotals, percentages: natPercentages });
          setDepartmentalData(deptTotals);
        });
      })
      .catch(err => console.error("Error crítico al cargar GeoJSON:", err));

    return () => unsubVotes();
  }, []);

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js" 
        strategy="lazyOnload" 
        onLoad={handleScriptLoad}
      />
      <main>
        <Toaster position="top-center" reverseOrder={false} />
        
        <header style={headerStyle}>
          <div style={tricolorBarStyle}>
            <div style={{ flex: 1, backgroundColor: '#d92121' }}></div>
            <div style={{ flex: 1, backgroundColor: '#f2c500' }}></div>
            <div style={{ flex: 1, backgroundColor: '#34C759' }}></div>
          </div>
          <div className="header-content" style={headerContentStyle}>
            <div style={titleContainerStyle}>
              <h1 className="main-title" style={titleStyle}>Bolivia Decide</h1>
              <p className="slogan" style={sloganStyle}>{`"Tu opinión cuenta. Y ahora, se muestra."`}</p>
            </div>
            <div className="share-button-container">
              <button 
                onClick={() => setShowShareModal(true)}
                style={shareButtonStyle}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#007AFF'; e.currentTarget.style.color = '#fff';}}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#007AFF';}}
              >
                Compartir
              </button>
            </div>
          </div>
        </header>
        
        <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <NationalResultsBar nationalResults={nationalResults} />
        </div>
        
        <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden', margin: '20px auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '1200px' }}>
          <MapLoader 
            geojson={geojson} 
            voteData={voteData}
            fingerprintStatus={fingerprintStatus}
            visitorId={visitorId}
            setFingerprintStatus={setFingerprintStatus}
          />
        </div>
        
        <DepartmentalDashboard 
          allDepartments={allDepartments} 
          departmentalData={departmentalData} 
          nationalData={nationalResults.data}
        />

        {showShareModal && <ShareModal closeModal={() => setShowShareModal(false)} />}

        <footer>
          <p style={{textAlign: 'center', fontSize: '12px', color: '#888', padding: '20px'}}>
            <strong>Aviso de Privacidad:</strong> Al votar, se registra de forma anónima tu tipo de dispositivo y red para fines estadísticos y para asegurar la integridad de la encuesta. No se almacena información personal identificable.
          </p>
        </footer>
        
        <style jsx>{`
          @media (max-width: 640px) {
            .header-content {
              flex-direction: column;
              gap: 15px;
            }
            .main-title {
              font-size: 2rem !important;
            }
            .slogan {
              font-size: 1rem !important;
            }
            .share-button-container {
              width: 100%;
              display: flex;
              justify-content: center;
            }
            .share-button-container button {
              padding: 10px 20px;
              font-size: 1rem;
              width: 80%;
            }
          }
        `}</style>
      </main>
    </>
  );
}