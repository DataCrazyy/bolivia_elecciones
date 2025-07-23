// components/MapLoader.js
'use client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

export default function MapLoader() {
    const Map = useMemo(() => dynamic(() => import('./BoliviaMap'), {
        loading: () => <p>Cargando mapa...</p>,
        ssr: false
    }), []);
    return <Map />;
}