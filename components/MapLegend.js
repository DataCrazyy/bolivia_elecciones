// components/MapLegend.js
import { CANDIDATES } from '../config/candidates';
import React from 'react';

const legendStyle = {
  position: 'absolute',
  bottom: '20px',
  left: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  padding: '10px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  zIndex: 999,
};

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '8px',
  fontSize: '14px',
  color: '#333', // Color de texto base
};

const colorBoxStyle = (color) => ({
  width: '20px',
  height: '20px',
  borderRadius: '4px',
  backgroundColor: color,
  marginRight: '10px',
});

const MapLegend = () => {
  return (
    <div style={legendStyle}>
      <div><strong>Leyenda de Candidatos:</strong></div>
      {Object.entries(CANDIDATES).map(([key, candidate]) => (
        <div key={key} style={itemStyle}>
          <div style={colorBoxStyle(candidate.color)}></div>
          <span>{candidate.nombre}</span>
        </div>
      ))}
      <div style={{ ...itemStyle, color: '#888' }}>
        <div style={colorBoxStyle('#d3d3d3')}></div>
        <span>Sin votos / Empate</span>
      </div>
    </div>
  );
};

export default MapLegend;