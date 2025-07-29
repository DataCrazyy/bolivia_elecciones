
// components/MapLegend.js
'use client';
import { CANDIDATES } from '../config/candidates';

const legendContainerStyle = {
    position: 'absolute',
    bottom: '20px',
    right: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: 1,
    transition: 'all 0.3s ease-in-out',
    fontFamily: 'sans-serif',
    fontSize: '14px',
};
const legendTitleStyle = {
    margin: '0 0 10px 0',
    fontWeight: 'bold',
    textAlign: 'center',
};
const legendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px',
};
const colorBoxStyle = {
    width: '18px',
    height: '18px',
    marginRight: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    flexShrink: 0,
};
const toggleButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#007AFF',
    padding: '5px 0 0 0',
    width: '100%',
    textAlign: 'center',
    marginTop: '5px'
};

export default function MapLegend({ isExpanded, setIsExpanded }) {
    // ✅ CORRECCIÓN: Se filtran los candidatos reales para no mostrar 'default' ni 'tie'
    const candidatesToShow = Object.entries(CANDIDATES).filter(([id]) => id !== 'default' && id !== 'tie');

    return (
        <div style={{...legendContainerStyle, maxWidth: isExpanded ? '200px' : '120px'}}>
            <h4 style={legendTitleStyle}>Leyenda</h4>
            <div style={{ maxHeight: isExpanded ? '300px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease-in-out' }}>
                {candidatesToShow.map(([id, data]) => (
                    <div key={id} style={legendItemStyle}>
                        <div style={{ ...colorBoxStyle, backgroundColor: data.color }}></div>
                        <span>{data.nombre}</span>
                    </div>
                ))}
                {/* ✅ CORRECCIÓN: Se eliminaron las leyendas de "Empate" y "Sin votos" */}
            </div>
            <button style={toggleButtonStyle} onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Ocultar' : 'Mostrar'}
            </button>
        </div>
    );
}
