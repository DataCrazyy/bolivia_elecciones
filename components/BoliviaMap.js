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
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore'; 
import { CANDIDATES } from '../config/candidates';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const markerStyle = {
  width: '20px', height: '20px', backgroundColor: '#007AFF',
  borderRadius: '50%', border: '2px solid white',
  boxShadow: '0 0 5px rgba(0,0,0,0.5)',
  cursor: 'pointer'
};

const locationBannerStyle = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '8px',
    zIndex: 10,
    fontSize: '14px',
    maxWidth: '250px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
};

export default function BoliviaMap({ geojson, voteData, user }) {
  const [viewState, setViewState] = useState({ longitude: -64.5, latitude: -16.5, zoom: 4.5 });
  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedMunicipio, setSelectedMunicipio] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showVoteShareModal, setShowVoteShareModal] = useState(false);
  const [locationAllowed, setLocationAllowed] = useState(true);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [lockedMunicipio, setLockedMunicipio] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  // This ref ensures the check only runs once per user session.
  const userCheckRef = useRef(null);

  useEffect(() => {
    const checkVoteAndGetLocation = async (currentUser) => {
      toast.loading('Verificando estado de votación...', { id: 'vote-check' });
      
      const logRef = doc(db, "log_votos", currentUser.uid);
      const docSnap = await getDoc(logRef);

      if (docSnap.exists()) {
        setHasVoted(true);
        toast.success('Ya has votado. Modo de solo lectura.', { id: 'vote-check' });
      } else {
        setHasVoted(false);
        toast.success('¡Listo para votar!', { id: 'vote-check' });

        toast('📍 Obteniendo tu ubicación...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationAllowed(true);
            const coords = [position.coords.longitude, position.coords.latitude];
            setUserLocation(coords);
            setViewState(prev => ({ ...prev, longitude: coords[0], latitude: coords[1], zoom: 9 }));
            
            let found = false;
            for (const feature of geojson.features) {
              if (feature.geometry && turf.booleanPointInPolygon(turf.point(coords), feature.geometry)) {
                const municipioData = { codigo_ine: feature.properties.codigo_ine, nombre_municipio: feature.properties.nombre };
                toast.success(`Ubicación encontrada: ${feature.properties.nombre}.`);
                setSelectedMunicipio(municipioData);
                setLockedMunicipio(municipioData);
                found = true;
                break;
              }
            }
            if (!found) toast.error("No se pudo identificar tu municipio. Por favor, haz clic en el mapa para votar.");
          },
          () => {
            setLocationAllowed(false);
            toast.error("Permiso de ubicación denegado.");
          }
        );
      }
    };

    // ✅ DEFINITIVE FIX: This logic ensures the check runs exactly once when a new user logs in.
    if (user && geojson && user.uid !== userCheckRef.current) {
      userCheckRef.current = user.uid; // Mark this user as checked.
      checkVoteAndGetLocation(user);
    } else if (!user) {
      // If the user logs out, reset everything for the next login.
      userCheckRef.current = null;
      setLockedMunicipio(null);
      setSelectedMunicipio(null);
      setHasVoted(false);
    }
  }, [user, geojson]);

  const municipiosPaintStyle = useMemo(() => {
    if (Object.keys(voteData).length === 0) {
        return { 'fill-color': '#d3d3d3', 'fill-opacity': 0.5 };
    }
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
        if (maxVotes <= 0) winner = 'default';
        const color = CANDIDATES[winner]?.color || '#d3d3d3';
        paintExpression.push(String(municipioId), color);
    }
    paintExpression.push('#d3d3d3');
    return { 'fill-color': paintExpression, 'fill-opacity': 0.7, 'fill-outline-color': '#ffffff' };
  }, [voteData]);

  const handleVote = async (candidateId) => {
    if (!user || hasVoted) {
        toast.error('No puedes votar en este momento.');
        return;
    }
    if (!lockedMunicipio) {
        toast.error('Por favor, selecciona tu municipio en el mapa primero.');
        return;
    }
    
    const loadingToast = toast.loading('Registrando tu voto...');
    const municipioRef = doc(db, "votos_por_municipio", String(lockedMunicipio.codigo_ine));
    const logRef = doc(db, "log_votos", user.uid);

    try {
        await setDoc(logRef, {
            userId: user.uid,
            userEmail: user.email,
            municipioId: lockedMunicipio.codigo_ine,
            candidateId,
            timestamp: new Date(),
        });

        const docSnap = await getDoc(municipioRef);
        if (docSnap.exists()) {
            await updateDoc(municipioRef, {
                [`votos_${candidateId}`]: increment(1),
                votos_totales: increment(1),
                lastVote: candidateId
            });
        } else {
            const initialVotes = { votos_totales: 1, lastVote: candidateId };
            Object.keys(CANDIDATES).forEach(id => { initialVotes[`votos_${id}`] = 0; });
            initialVotes[`votos_${candidateId}`] = 1;
            await setDoc(municipioRef, initialVotes);
        }
        
        setHasVoted(true);
        toast.success('✅ ¡Gracias! Tu voto ha sido registrado.', { id: loadingToast });
        setSelectedMunicipio(null);
        setShowVoteShareModal(true);
        setViewState({ longitude: -64.5, latitude: -16.5, zoom: 4.5 });

    } catch (error) {
        console.error("Error al registrar el voto:", error);
        toast.error(`❌ Error: ${error.message}`, { id: loadingToast });
        setSelectedMunicipio(null);
    }
  };

  const onClick = (event) => {
    if (!user || hasVoted) return;

    if (!locationAllowed) {
        toast.error("Para votar, debes habilitar el permiso de ubicación y recargar la página.");
        return;
    }
    const feature = event.features && event.features[0];
    if (!feature) return;

    const clickedMunicipio = { codigo_ine: feature.properties.codigo_ine, nombre_municipio: feature.properties.nombre };

    if (lockedMunicipio) {
        if (lockedMunicipio.codigo_ine === clickedMunicipio.codigo_ine) {
            setSelectedMunicipio(clickedMunicipio);
        } else {
            toast.error(`Solo puedes votar en tu municipio identificado: ${lockedMunicipio.nombre_municipio}`);
        }
    } else {
        setIsLegendExpanded(false);
        setLockedMunicipio(clickedMunicipio);
        setSelectedMunicipio(clickedMunicipio);
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
    <div style={{ width: '100%', height: '80vh', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
        {!locationAllowed && user && !hasVoted && (
            <div style={locationBannerStyle}>
                <strong>Permiso de Ubicación Denegado.</strong> Para poder votar, por favor habilita el acceso a la ubicación en tu navegador y recarga la página.
            </div>
        )}
        <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{ width: '100%', height: '100%' }}
            mapStyle={MAP_STYLE}
            interactiveLayerIds={['municipios-data']}
            onClick={onClick}
            onMouseMove={onHover}
            minZoom={4.5}
        >
            <NavigationControl position="top-left" />
            <Source id="municipios" type="geojson" data={geojson}>
                <Layer id="municipios-data" type="fill" paint={municipiosPaintStyle} />
                <Layer id="municipios-outline" type="line" paint={{ 'line-color': '#000', 'line-width': 0.5, 'line-opacity': 0.3 }} />
            </Source>
            {userLocation && (
                <Marker longitude={userLocation[0]} latitude={userLocation[1]}>
                    <div style={markerStyle} title="Tu ubicación aproximada"></div>
                </Marker>
            )}
        </Map>
        <MapLegend isExpanded={isLegendExpanded} setIsExpanded={setIsLegendExpanded} />
        <HoverTooltip hoverInfo={hoverInfo} />
        <VotingModal municipio={selectedMunicipio} handleVote={handleVote} closeModal={() => setSelectedMunicipio(null)} />
        {showVoteShareModal && <ShareModal closeModal={() => setShowVoteShareModal(false)} />}
    </div>
  );
}
