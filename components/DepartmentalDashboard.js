// components/DepartmentalDashboard.js
'use client';

import React, { useState, useEffect } from 'react';
import { CANDIDATES } from '../config/candidates';

// --- Estilos ---
const dashboardStyle = {
  padding: '20px',
  maxWidth: '1200px',
  margin: '40px auto',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '20px',
  color: '#343a40',
};

const selectStyle = {
  display: 'block',
  width: '100%',
  maxWidth: '400px',
  margin: '0 auto 30px auto',
  padding: '10px',
  fontSize: '16px',
  borderRadius: '5px',
  border: '1px solid #ced4da',
  backgroundColor: 'white',
};

const resultsContainerStyle = {
  display: 'grid',
  // Se ajusta el número de columnas según el espacio disponible
  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
  gap: '30px 20px', // Espacio vertical y horizontal
};

const candidateWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
};

const imageStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '3px solid #fff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
};

// ✅ Contenedor para el texto que asegura una altura fija
const textContainerStyle = {
  marginTop: '10px',
  height: '60px', // Altura fija para alinear todo
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between', // Distribuye el espacio
};

const nameStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#333',
  lineHeight: '1.2',
};

const percentageStyle = (color) => ({
  fontSize: '20px',
  fontWeight: 'bold',
  color: color || '#333',
});


// --- Componente ---
export default function DepartmentalDashboard({ allDepartments, departmentalData, nationalData }) {
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    if (allDepartments.length > 1) {
      setSelectedDept(allDepartments.find(dept => dept !== 'NIVEL NACIONAL') || '');
    }
  }, [allDepartments]);

  const calculatePercentage = (votes, total) => (total > 0 ? (votes / total) * 100 : 0);
  
  const departmentsOnly = allDepartments.filter(dept => dept !== 'NIVEL NACIONAL');

  const dataToShow = departmentalData[selectedDept];
  const totalVotes = dataToShow?.votos_totales;

  const candidateResults = dataToShow
    ? Object.keys(CANDIDATES)
        .map(id => ({
          id: id,
          ...CANDIDATES[id],
          percentage: calculatePercentage(dataToShow[`votos_${id}`], totalVotes),
        }))
        .sort((a, b) => b.percentage - a.percentage)
    : [];

  return (
    <div style={dashboardStyle}>
      <h2 style={headerStyle}>Análisis por Región</h2>

      <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={selectStyle}>
        {departmentsOnly.map(dept => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>
      
      {candidateResults.length > 0 ? (
        <div style={resultsContainerStyle}>
          {candidateResults.map(candidate => (
            <div key={candidate.id} style={candidateWrapperStyle}>
              <img src={candidate.image} alt={candidate.nombre} style={imageStyle} />
              {/* ✅ Contenedor de texto aplicado aquí */}
              <div style={textContainerStyle}>
                <div style={nameStyle}>{candidate.nombre}</div>
                <div style={percentageStyle(candidate.color)}>{candidate.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: '#6c757d', minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No hay votos registrados para esta selección aún.
        </p>
      )}
    </div>
  );
}