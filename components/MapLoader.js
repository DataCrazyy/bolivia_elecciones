
// components/MapLoader.js

'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const loaderStyle = {
    height: '80vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    color: '#666',
    fontSize: '18px',
    padding: '20px',
    textAlign: 'center',
    boxSizing: 'border-box'
};

export default function MapLoader({ geojson, voteData, fingerprintStatus, visitorId, setFingerprintStatus }) {
    
    const Map = useMemo(() => dynamic(() => import('./BoliviaMap'), {
        loading: () => <div style={loaderStyle}>Cargando componente de mapa...</div>,
        ssr: false
    }), []);

    if (!geojson || fingerprintStatus === 'checking') {
        return <div style={loaderStyle}>Verificando y cargando datos...</div>;
    }

    return <Map 
        geojson={geojson} 
        voteData={voteData} 
        fingerprintStatus={fingerprintStatus}
        visitorId={visitorId} 
        setFingerprintStatus={setFingerprintStatus}
    />;
}