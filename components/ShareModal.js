
// components/ShareModal.js
'use client';

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalContentStyle = {
  background: 'white', padding: '20px 30px 30px 30px', borderRadius: '8px',
  width: '90%', maxWidth: '400px', textAlign: 'center', position: 'relative',
  boxShadow: '0 5px 25px rgba(0,0,0,0.2)'
};
const closeButtonStyle = {
  background: 'transparent', border: 'none', position: 'absolute',
  top: '10px', right: '15px', fontSize: '24px', cursor: 'pointer',
  color: '#888',
};
const shareButtonStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '12px', margin: '10px 0',
    fontSize: '16px', cursor: 'pointer', borderRadius: '5px',
    border: 'none', color: 'white', textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'opacity 0.2s',
};

export default function ShareModal({ closeModal }) {
    const shareText = "¡Ya participé en el mapa electoral de #BoliviaDecide! Mira los resultados en tiempo real y suma tu voz:";
    
    // ✅ CORRECCIÓN: Se usa la variable de entorno para la URL.
    const shareUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;

    return (
        <div style={modalOverlayStyle} onClick={closeModal}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <button style={closeButtonStyle} onClick={closeModal}>&times;</button>
                
                <h2 style={{marginTop: '10px', color: '#333'}}>¡Gracias por Votar!</h2>
                <p style={{color: '#555'}}>Tu voz es importante. ¡Ayuda a que otros participen!</p>
                
                <div>
                    <a href={twitterUrl} target="_blank" rel="noopener noreferrer" style={{ ...shareButtonStyle, backgroundColor: '#1DA1F2' }} onMouseOver={e=>e.currentTarget.style.opacity=0.9} onMouseOut={e=>e.currentTarget.style.opacity=1}>Compartir en X (Twitter)</a>
                    <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={{ ...shareButtonStyle, backgroundColor: '#1877F2' }} onMouseOver={e=>e.currentTarget.style.opacity=0.9} onMouseOut={e=>e.currentTarget.style.opacity=1}>Compartir en Facebook</a>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ ...shareButtonStyle, backgroundColor: '#25D366' }} onMouseOver={e=>e.currentTarget.style.opacity=0.9} onMouseOut={e=>e.currentTarget.style.opacity=1}>Compartir en WhatsApp</a>
                </div>
            </div>
        </div>
    );
}
