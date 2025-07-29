'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CANDIDATES } from '../config/candidates';

// --- Estilos ---
const containerStyle = {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
    fontFamily: 'sans-serif',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '30px',
};

const selectStyle = {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    minWidth: '300px',
    marginBottom: '20px',
};

const resultsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '25px',
    justifyContent: 'center',
};

const candidateCardStyle = {
    textAlign: 'center',
};

const imageWrapperStyle = {
    position: 'relative',
    width: '100px',
    height: '100px',
    margin: '0 auto 10px auto',
};

const candidateImageStyle = {
    borderRadius: '50%',
    objectFit: 'cover',
};

const percentageStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '5px',
};

const nameStyle = {
    fontSize: '15px',
    color: '#333',
    fontWeight: '500',
};

const partyStyle = {
    fontSize: '12px',
    color: '#777',
};

// --- Componente ---
export default function DepartmentalDashboard({ allDepartments, departmentalData, nationalData }) {
    const [selectedDept, setSelectedDept] = useState('NIVEL NACIONAL');
    const [displayData, setDisplayData] = useState([]);

    useEffect(() => {
        const dataToProcess = selectedDept === 'NIVEL NACIONAL'
            ? nationalData
            : departmentalData[selectedDept];

        if (!dataToProcess) {
            setDisplayData([]);
            return;
        }

        const totalVotes = dataToProcess.votos_totales || dataToProcess.grandTotal || 0;

        const candidateResults = Object.entries(CANDIDATES).map(([id, details]) => {
            const votes = dataToProcess[`votos_${id}`] || 0;
            const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
            return {
                id,
                ...details,
                percentage,
            };
        });

        setDisplayData(candidateResults);
    // ✅ CORRECCIÓN: Se añade `selectedDept` a la lista de dependencias.
    }, [departmentalData, nationalData, selectedDept]);

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2 style={{ fontSize: '2rem', color: '#212529', marginBottom: '10px' }}>Análisis por Región</h2>
                <select 
                    value={selectedDept} 
                    onChange={(e) => setSelectedDept(e.target.value)}
                    style={selectStyle}
                >
                    {allDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            <div style={resultsGridStyle}>
                {displayData.map(candidate => (
                    <div key={candidate.id} style={candidateCardStyle}>
                        <div style={imageWrapperStyle}>
                            <Image
                                src={candidate.image || '/candidates/placeholder.png'}
                                alt={candidate.nombre}
                                layout="fill"
                                style={candidateImageStyle}
                            />
                        </div>
                        <div style={{ ...percentageStyle, color: candidate.color }}>
                            {candidate.percentage}%
                        </div>
                        <div style={nameStyle}>{candidate.nombre}</div>
                        <div style={partyStyle}>{candidate.partido}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
