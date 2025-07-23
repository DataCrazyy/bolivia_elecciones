// components/VotingModal.js
'use client';
import { CANDIDATES } from '../config/candidates';
import Image from 'next/image'; // ✅ Importamos el componente Image

// --- Estilos ---
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalContentStyle = {
  background: 'white', padding: '25px', borderRadius: '12px',
  width: '90%', maxWidth: '750px', textAlign: 'center', position: 'relative',
  boxShadow: '0 5px 25px rgba(0,0,0,0.2)'
};
const closeButtonStyle = {
  background: 'transparent', border: 'none', position: 'absolute',
  top: '15px', right: '20px', fontSize: '28px', cursor: 'pointer',
  color: '#aaa', lineHeight: 1
};
const ballotContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: '20px',
  marginTop: '20px',
  maxHeight: '60vh',
  overflowY: 'auto',
  padding: '10px'
};
const candidateCardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '15px 10px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  backgroundColor: '#f9f9f9',
};
const candidateImageStyle = {
  borderRadius: '50%',
  objectFit: 'cover',
  border: '3px solid #eee',
  margin: '0 auto'
};
const candidateNameStyle = {
  fontWeight: 'bold',
  marginTop: '10px',
  fontSize: '15px',
  color: '#333'
};
const candidatePartyStyle = {
  fontSize: '12px',
  color: '#666',
  marginTop: '4px'
};

// --- Componente ---
export default function VotingModal({ municipio, handleVote, closeModal }) {
  if (!municipio) return null;

  return (
    <div style={modalOverlayStyle} onClick={closeModal}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={closeModal}>&times;</button>
        
        <h2 style={{ margin: '0 0 5px 0', color: '#212529' }}>Elecciones Presidenciales 2025</h2>
        <p style={{ margin: 0, color: '#6c757d' }}>
          Tu voto se registrará desde: <strong>{municipio.nombre_municipio}</strong>
        </p>
        <p style={{ marginTop: '15px', color: '#333' }}>Selecciona tu candidato a la Presidencia:</p>

        <div style={ballotContainerStyle}>
          {Object.entries(CANDIDATES).map(([id, data]) => (
            <div
              key={id}
              style={candidateCardStyle}
              onClick={() => handleVote(id)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0px 4px 15px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* ✅ Reemplazamos <img> por <Image> para optimización */}
              <Image 
                src={data.image} 
                alt={data.nombre} 
                width={80} 
                height={80} 
                style={candidateImageStyle} 
              />
              <div style={candidateNameStyle}>{data.nombre}</div>
              <div style={candidatePartyStyle}>{data.partido}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}