// components/MapLegend.js
'use client';
import { CANDIDATES } from '../config/candidates';

// --- Estilos ---
const legendContainerStyle = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  zIndex: 1,
  overflow: 'hidden', // Clave para la animación
  transition: 'all 0.3s ease-in-out',
};

const buttonStyle = {
  background: '#fff',
  border: 'none',
  padding: '10px 15px',
  width: '100%',
  textAlign: 'left',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const contentStyle = (isExpanded) => ({
  maxHeight: isExpanded ? '300px' : '0px', // Animación de altura
  overflow: 'auto',
  transition: 'max-height 0.3s ease-in-out',
  padding: isExpanded ? '0 15px 15px 15px' : '0 15px',
});

const legendItemStyle = {
  display: 'flex',
  alignItems: 'center',
  marginTop: '10px',
  fontSize: '14px',
};

const colorBoxStyle = (color) => ({
  width: '18px',
  height: '18px',
  backgroundColor: color,
  marginRight: '10px',
  borderRadius: '4px',
  flexShrink: 0,
});

// --- Componente ---
export default function MapLegend({ isExpanded, setIsExpanded }) {
  return (
    <div style={legendContainerStyle}>
      <button style={buttonStyle} onClick={() => setIsExpanded(!isExpanded)}>
        <span>Candidatos</span>
        {/* La flecha cambia de dirección */}
        <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
      </button>
      <div style={contentStyle(isExpanded)}>
        {Object.values(CANDIDATES).map(candidate => (
          <div key={candidate.nombre} style={legendItemStyle}>
            <div style={colorBoxStyle(candidate.color)}></div>
            <span>{candidate.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  );
}