// components/BoliviaMap.js
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import VotingModal from './VotingModal';
import MapLegend from './MapLegend';
import HoverTooltip from './HoverTooltip';
import ShareModal from './ShareModal';
import * as turf from '@turf/turf';
import toast from 'react-hot-toast';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, increment, collection, onSnapshot, setDoc } from 'firebase/firestore'; 
import { CANDIDATES } from '../config/candidates';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const GEOJSON_URL = '/municipios_optimizado.geojson';
const markerStyle = {
  width: '20px', height: '20px', backgroundColor: '#007AFF',
  borderRadius: '50%', border: '2px solid white',
  boxShadow: '0 0 5px rgba(0,0,0,0.5)'
};

export default function BoliviaMap() {
    // ✅ 1. CAMBIA ESTE VALOR para el zoom inicial
    const [viewState, setViewState] = useState({ longitude: -64.5, latitude: -16.5, zoom: 4.5 });
    
    const [hoverInfo, setHoverInfo] = useState(null);
    const [selectedMunicipio, setSelectedMunicipio] = useState(null);
    const [voteData, setVoteData] = useState({});
    const [geojson, setGeojson] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [locationAllowed, setLocationAllowed] = useState(true);
    const effectRan = useRef(false);
    const [isLegendExpanded, setIsLegendExpanded] = useState(false);

    useEffect(() => {
        if (effectRan.current && process.env.NODE_ENV === 'development') return;
        const hasVoted = localStorage.getItem('boliviaDecideVoted');
        
        fetch(GEOJSON_URL)
            .then(resp => resp.json())
            .then(mapData => {
                setGeojson(mapData);
                if (!hasVoted) {
                    toast('📍 Obteniendo tu ubicación...');
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const coords = [position.coords.longitude, position.coords.latitude];
                            setUserLocation(coords);
                            setViewState({ longitude: coords[0], latitude: coords[1], zoom: 9 });
                            let found = false;
                            for (const feature of mapData.features) {
                                if (feature.geometry && turf.booleanPointInPolygon(turf.point(coords), feature.geometry)) {
                                    setSelectedMunicipio({ codigo_ine: feature.properties.codigo_ine, nombre_municipio: feature.properties.nombre });
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) toast.error("No se pudo identificar tu municipio. Por favor, haz clic en el mapa para votar.");
                        },
                        () => {
                            setLocationAllowed(false);
                            toast.error("Permiso de ubicación denegado. La votación está deshabilitada.");
                        }
                    );
                }
            });
        
        return () => { effectRan.current = true; };
    }, []);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "votos_por_municipio"), (snapshot) => {
            const newVoteData = {};
            snapshot.forEach((doc) => { newVoteData[doc.id] = doc.data(); });
            setVoteData(newVoteData);
        });
        return () => unsub();
    }, []);

    const municipiosPaintStyle = useMemo(() => {
        if (Object.keys(voteData).length === 0) return { 'fill-color': '#d3d3d3', 'fill-opacity': 0.5 };
        const paintExpression = ['match', ['get', 'codigo_ine']];
        for (const [municipioId, data] of Object.entries(voteData)) {
            let winner = 'default';
            let maxVotes = -1; 
            for (const candidateId of Object.keys(CANDIDATES)) {
                const votes = data[`votos_${candidateId}`] || 0;
                if (votes > maxVotes) {
                    maxVotes = votes;
                    winner = candidateId;
                }
            }
            if (maxVotes === 0) { winner = 'default'; }
            const color = CANDIDATES[winner]?.color || '#d3d3d3';
            paintExpression.push(String(municipioId), color);
        }
        paintExpression.push('#d3d3d3');
        return { 'fill-color': paintExpression, 'fill-opacity': 0.7 };
    }, [voteData]);

    const handleVote = async (candidateId) => {
        if (localStorage.getItem('boliviaDecideVoted')) return;
        if (!selectedMunicipio) return;
        
        const loadingToast = toast.loading('Registrando tu voto...');
        const municipioRef = doc(db, "votos_por_municipio", String(selectedMunicipio.codigo_ine));
        let voterToken = localStorage.getItem('voterToken');
        if (!voterToken) {
            voterToken = crypto.randomUUID();
            localStorage.setItem('voterToken', voterToken);
        }

        try {
            const docSnap = await getDoc(municipioRef);
            if (docSnap.exists()) {
                await updateDoc(municipioRef, {
                    [`votos_${candidateId}`]: increment(1),
                    votos_totales: increment(1)
                });
            } else {
                const initialVotes = { votos_totales: 1 };
                Object.keys(CANDIDATES).forEach(id => { initialVotes[`votos_${id}`] = 0; });
                initialVotes[`votos_${candidateId}`] = 1;
                await setDoc(municipioRef, initialVotes);
            }
            const logRef = doc(db, "log_votos", voterToken);
            await setDoc(logRef, {
                voterToken, userAgent: navigator.userAgent,
                municipioId: selectedMunicipio.codigo_ine,
                candidateId, timestamp: new Date(),
            });

            localStorage.setItem('boliviaDecideVoted', 'true');
            toast.success('✅ ¡Gracias! Tu voto ha sido registrado.', { id: loadingToast });
            setSelectedMunicipio(null);
            setShowShareModal(true);
            // ✅ Y asegúrate de que este valor coincida con el de arriba
            setViewState({ longitude: -64.5, latitude: -16.5, zoom: 4.5 });

        } catch (error) {
            console.error("Error al registrar el voto:", error);
            toast.error(`❌ Error: ${error.message}`, { id: loadingToast });
            setSelectedMunicipio(null);
        }
    };

    const onClick = (event) => {
        if (localStorage.getItem('boliviaDecideVoted')) return;
        if (!locationAllowed) {
            toast.error("Para votar, debes habilitar el permiso de ubicación y recargar la página.");
            return;
        }
        const feature = event.features && event.features[0];
        if (feature) {
            setIsLegendExpanded(false);
            setSelectedMunicipio({ codigo_ine: feature.properties.codigo_ine, nombre_municipio: feature.properties.nombre });
        }
    };
    
    const onHover = (event) => {
        const feature = event.features && event.features[0];
        if (feature) {
            const municipioId = feature.properties.codigo_ine;
            const data = voteData[municipioId] || {};
            setHoverInfo({
                x: event.point.x, y: event.point.y,
                properties: { ...feature.properties, ...data }
            });
        } else {
            setHoverInfo(null);
        }
    };

    return (
        <div style={{ width: '100%', height: '80vh', position: 'relative' }}>
             <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle={MAP_STYLE}
                interactiveLayerIds={['municipios-data']}
                onClick={onClick}
                onMouseMove={onHover}
                // ✅ 2. CAMBIA ESTE VALOR para el límite de alejamiento manual
                minZoom={4.5}
                // ✅ 3. Se ha quitado la restricción de bordes
            >
                <NavigationControl position="top-left" />
                {geojson && (
                    <Source id="municipios" type="geojson" data={geojson}>
                        <Layer id="municipios-data" type="fill" paint={municipiosPaintStyle} />
                        <Layer id="municipios-outline" type="line" paint={{ 'line-color': '#000', 'line-width': 0.5 }} />
                    </Source>
                )}
                {userLocation && (
                    <Marker longitude={userLocation[0]} latitude={userLocation[1]}>
                        <div style={markerStyle}></div>
                    </Marker>
                )}
            </Map>
            <MapLegend isExpanded={isLegendExpanded} setIsExpanded={setIsLegendExpanded} />
            <HoverTooltip hoverInfo={hoverInfo} />
            <VotingModal municipio={selectedMunicipio} handleVote={handleVote} closeModal={() => setSelectedMunicipio(null)} />
            {showShareModal && <ShareModal closeModal={() => setShowShareModal(false)} />}
        </div>
    );
}