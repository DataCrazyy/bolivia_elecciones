'use client';
import { CANDIDATES } from '../config/candidates';

const legendStyle = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'rgba(255, 255, 255, 0.9)',
  padding: '10px',
  borderRadius: '5px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  zIndex: 1
};

const legendItemStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '5px'
};

const colorBoxStyle = (color) => ({
  width: '15px',
  height: '15px',
  backgroundColor: color,
  marginRight: '8px',
  border: '1px solid #ccc'
});

export default function MapLegend() {
  return (
    <div style={legendStyle}>
      <h4 style={{ margin: '0 0 10px 0' }}>Leyenda</h4>
      {Object.values(CANDIDATES).map(candidate => (
        <div key={candidate.nombre} style={legendItemStyle}>
          <div style={colorBoxStyle(candidate.color)}></div>
          <span>{candidate.nombre}</span>
        </div>
      ))}
    </div>
  );
}