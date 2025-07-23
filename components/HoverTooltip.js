// components/HoverTooltip.js
'use client';
import { CANDIDATES } from '../config/candidates';
import { useRef, useLayoutEffect, useState } from 'react';

const tooltipStyle = {
  position: 'absolute',
  background: 'rgba(255, 255, 255, 0.95)',
  padding: '12px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  zIndex: 10,
  pointerEvents: 'none',
  transition: 'opacity 0.2s, transform 0.2s',
  maxWidth: '280px',
  opacity: 0,
  transform: 'scale(0.95)',
  fontFamily: 'sans-serif',
};

export default function HoverTooltip({ hoverInfo }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false });

  useLayoutEffect(() => {
    if (hoverInfo && tooltipRef.current) {
      const { x, y } = hoverInfo;
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = tooltipRef.current;

      let newX = x + 20;
      let newY = y + 20;

      if (newX + offsetWidth > innerWidth) {
        newX = x - offsetWidth - 20;
      }
      if (newY + offsetHeight > innerHeight) {
        newY = y - offsetHeight - 20;
      }

      setPosition({ x: newX, y: newY, visible: true });
    } else {
      setPosition(pos => ({ ...pos, visible: false }));
    }
  }, [hoverInfo]);

  if (!hoverInfo) return null;

  const { properties } = hoverInfo;
  const totalVotes = properties.votos_totales || 0;

  const candidateResults = Object.entries(CANDIDATES).map(([id, data]) => {
    const votes = properties[`votos_${id}`] || 0;
    const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0.0";
    return { id, data, percentage };
  });

  return (
    <div ref={tooltipRef} style={{
      ...tooltipStyle,
      left: position.x,
      top: position.y,
      opacity: position.visible ? 1 : 0,
      transform: position.visible ? 'scale(1)' : 'scale(0.95)',
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>{properties.nombre}</h3>
      
      {/* ✅ Contenedor con la alineación corregida */}
      <div>
        {candidateResults.map(({ id, data, percentage }) => (
          <div key={id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            marginBottom: '5px',
          }}>
            <span style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginRight: '15px',
              color: '#555',
            }}>
              {data.nombre}
            </span>
            <span style={{ fontWeight: 'bold', color: data.color }}>
              {percentage}%
            </span>
          </div>
        ))}
      </div>

      <hr style={{margin: '10px 0', border: '0', borderTop: '1px solid #eee'}} />
      
      <div style={{fontWeight: 'bold', display: 'flex', justifyContent: 'space-between'}}>
        <span>Votos Totales:</span>
        <span>{totalVotes}</span>
      </div>
    </div>
  );
}