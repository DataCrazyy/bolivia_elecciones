// app/page.js
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import NationalResultsBar from '../components/NationalResultsBar';
import DepartmentalDashboard from '../components/DepartmentalDashboard';
import ShareModal from '../components/ShareModal';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { CANDIDATES } from '../config/candidates';

const GEOJSON_URL = '/municipios_optimizado.geojson';

const MapLoader = dynamic(() => import('../components/MapLoader'), { 
  ssr: false,
  loading: () => <div style={{height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Cargando mapa...</div>
});

// --- Estilos ---
const headerStyle = {
  paddingTop: '20px',
  paddingBottom: '20px',
  borderBottom: '1px solid #dee2e6',
  marginBottom: '20px',
  backgroundColor: '#f8f9fa',
  position: 'relative',
};

const tricolorBarStyle = {
  width: '100%',
  height: '6px',
  display: 'flex',
  position: 'absolute',
  top: 0,
  left: 0,
};

const titleStyle = { margin: 0, fontSize: '2.5rem', color: '#212529', textAlign: 'center' };
const sloganStyle = { margin: '5px 0 0 0', fontSize: '1.2rem', color: '#6c757d', fontWeight: 300, textAlign: 'center' };
const shareButtonStyle = {
  padding: '8px 16px', fontSize: '16px', cursor: 'pointer', borderRadius: '5px',
  border: '1px solid #007AFF', backgroundColor: '#fff', color: '#007AFF',
  transition: 'background-color 0.2s, color 0.2s',
  whiteSpace: 'nowrap'
};

export default function Home() {
  const [nationalResults, setNationalResults] = useState({ totalVotes: 0, data: {}, percentages: {} });
  const [departmentalData, setDepartmentalData] = useState({});
  const [allDepartments, setAllDepartments] = useState([]);
  const [municipioToDept, setMunicipioToDept] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    fetch(GEOJSON_URL)
      .then(resp => resp.json())
      .then(mapData => {
        const lookup = {};
        const depts = new Set();
        mapData.features.forEach(feature => {
          if (feature.properties.codigo_ine && feature.properties.nombre_dep) {
            lookup[feature.properties.codigo_ine] = feature.properties.nombre_dep;
            depts.add(feature.properties.nombre_dep);
          }
        });
        const sortedDepts = ['NIVEL NACIONAL', ...Array.from(depts).sort()];
        setMunicipioToDept(lookup);
        setAllDepartments(sortedDepts);

        unsub = onSnapshot(collection(db, "votos_por_municipio"), (snapshot) => {
          const natTotals = { grandTotal: 0 };
          const deptTotals = {};
          Object.keys(CANDIDATES).forEach(id => { natTotals[`votos_${id}`] = 0; });
          
          snapshot.forEach((doc) => {
            const voteEntry = doc.data();
            const municipioId = doc.id;
            const department = lookup[municipioId];
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
      });
    return () => unsub();
  }, []);

  return (
    <main>
      <header style={headerStyle}>
        <div style={tricolorBarStyle}>
          <div style={{ flex: 1, backgroundColor: '#d92121' }}></div>
          <div style={{ flex: 1, backgroundColor: '#f2c500' }}></div>
          <div style={{ flex: 1, backgroundColor: '#34C759' }}></div>
        </div>

        <div className="header-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="title-container">
            <h1 style={titleStyle}>Bolivia Decide</h1>
            {/* ✅ LÍNEA CORREGIDA PARA EL DEPLOY */}
            <p style={sloganStyle}>{`"Tu opinión cuenta. Y ahora, se muestra."`}</p>
          </div>
          <div className="share-button-container">
            <button 
              onClick={() => setShowShareModal(true)}
              style={shareButtonStyle}
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
        <MapLoader />
      </div>
      <DepartmentalDashboard 
        allDepartments={allDepartments} 
        departmentalData={departmentalData} 
        nationalData={nationalResults.data}
      />
      {showShareModal && <ShareModal closeModal={() => setShowShareModal(false)} />}

      <style jsx>{`
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 0 20px;
        }
        .title-container {
          flex-grow: 1;
        }
        
        @media (max-width: 640px) {
          .header-content {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>

      <footer>
        <p style={{textAlign: 'center', fontSize: '12px', color: '#888', padding: '20px'}}>
          <strong>Aviso de Privacidad:</strong> Al votar, se registra de forma anónima tu tipo de dispositivo y red para fines estadísticos y para asegurar la integridad de la encuesta. No se almacena información personal identificable.
        </p>
      </footer>
    </main>
  );
}