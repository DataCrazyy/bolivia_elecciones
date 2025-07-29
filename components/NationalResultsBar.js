'use client';
import { CANDIDATES } from '../config/candidates';

export default function NationalResultsBar({ nationalResults }) {
  const { totalVotes, percentages } = nationalResults;

  // 1. Si no hay votos, muestra una barra indicando que se esperan votos.
  if (totalVotes === 0) {
    return (
        <div style={{
            display: 'flex',
            width: '100%',
            height: '35px',
            borderRadius: '8px',
            overflow: 'hidden',
            margin: '20px 0',
            backgroundColor: '#e9ecef', // Fondo base
            color: '#6c757d',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
        }}>
            Esperando los primeros votos...
        </div>
    );
  }

  // Umbral para agrupar candidatos en "Otros"
  const THRESHOLD = 5; // Menos de 5% se considera "Otros"

  const allCandidates = Object.entries(percentages)
    .map(([id, percentage]) => ({ id, percentage: parseFloat(percentage) || 0 }))
    .sort((a, b) => b.percentage - a.percentage);

  const majorCandidates = allCandidates.filter(c => c.percentage >= THRESHOLD);
  const otherCandidates = allCandidates.filter(c => c.percentage < THRESHOLD);

  let othersPercentage = 0;
  if (otherCandidates.length > 0) {
    othersPercentage = otherCandidates.reduce((sum, current) => sum + current.percentage, 0);
  }

  const displaySegments = [...majorCandidates];
  if (othersPercentage > 0) {
    displaySegments.push({ id: 'otros', percentage: othersPercentage });
  }

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '35px',
      borderRadius: '8px',
      overflow: 'hidden',
      margin: '20px 0',
      border: '1px solid #ddd',
      // ✅ CORRECCIÓN: Se asegura un fondo blanco para evitar el modo oscuro.
      backgroundColor: '#ffffff' 
    }}>
      {displaySegments.map((segment) => {
        const isOther = segment.id === 'otros';
        const color = isOther ? '#6c757d' : CANDIDATES[segment.id]?.color;
        const name = isOther ? 'Otros' : CANDIDATES[segment.id]?.nombre.split(' ')[0];
        const percentage = segment.percentage;

        return (
          <div key={segment.id} style={{
            width: `${percentage}%`,
            backgroundColor: color || '#ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '13px',
            overflow: 'hidden',
            transition: 'width 0.5s ease-in-out',
            whiteSpace: 'nowrap',
            minWidth: 'fit-content',
            padding: '0 5px'
          }}>
            <span>
              { // Lógica de visualización mejorada
                percentage > 15
                  ? `${name} ${percentage.toFixed(1)}%`
                  : percentage > 5
                    ? `${percentage.toFixed(1)}%`
                    : ''
              }
            </span>
          </div>
        );
      })}
    </div>
  );
}
