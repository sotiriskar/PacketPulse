'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Color palette based on #fe4e50
const colorPalette = {
  primary: '#fe4e50',
  primaryLight: '#ff6b6d',
  primaryDark: '#d13a3c',
  primaryVeryDark: '#a82d2f',
  secondary: '#ff8a80',
  tertiary: '#ffb3a7',
  accent: '#ff6b6d',
  muted: '#ffcdd2',
};

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Session {
  session_id: string;
  vehicle_id: string;
  order_id: string;
  status: string;
  latest_activity: string;
  order_status?: string;
  start_time?: string;
  last_update_time?: string;
  distance_to_destination_km?: number;
  elapsed_time?: string;
  avg_speed_kmh?: number;
  eta?: string;
  current_latitude?: number;
  current_longitude?: number;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
}

interface MapComponentProps {
  sessions: Session[];
  selectedSession: Session | null;
  onVehicleClick: (session: Session) => void;
  onPickupClick: (session: Session) => void;
  onDeliveryClick: (session: Session) => void;
}

// Custom component to handle map centering
function MapController({ selectedSession }: { selectedSession: Session | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedSession?.current_latitude && selectedSession?.current_longitude) {
      map.setView(
        [selectedSession.current_latitude, selectedSession.current_longitude],
        14
      );
    }
  }, [selectedSession, map]);

  return null;
}

export default function MapComponent({ 
  sessions, 
  selectedSession, 
  onVehicleClick, 
  onPickupClick, 
  onDeliveryClick 
}: MapComponentProps) {
  
  // Create custom marker icons inside the component
  const createCustomIcon = useCallback((color: string, icon: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 36px; 
          height: 36px; 
          background-color: ${color}; 
          border-radius: 50%; 
          border: 2px solid white; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        ">
          <span style="color: white; font-size: 16px;">${icon}</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, []);

  // Memoized marker icons
  const vehicleIcon = useMemo(() => createCustomIcon(colorPalette.primary, '🛵'), [createCustomIcon]);
  const pickupIcon = useMemo(() => createCustomIcon(colorPalette.secondary, '📦'), [createCustomIcon]);
  const deliveryIcon = useMemo(() => createCustomIcon(colorPalette.accent, '🛍️'), [createCustomIcon]);
  
  // Memoized session coordinates
  const sessionCoordinates = useMemo(() => {
    return sessions.map(session => ({
      session,
      coordinates: {
        current: {
          lat: session.current_latitude || 0,
          lng: session.current_longitude || 0,
          hasValidCoords: !!(session.current_latitude && session.current_longitude)
        },
        pickup: {
          lat: session.start_latitude || 0,
          lng: session.start_longitude || 0,
          hasValidCoords: !!(session.start_latitude && session.start_longitude)
        },
        delivery: {
          lat: session.end_latitude || 0,
          lng: session.end_longitude || 0,
          hasValidCoords: !!(session.end_latitude && session.end_longitude)
        },
      }
    }));
  }, [sessions]);

  // Memoized center coordinates
  const centerCoordinates = useMemo(() => {
    if (selectedSession?.current_latitude && selectedSession?.current_longitude) {
      return [selectedSession.current_latitude, selectedSession.current_longitude];
    }
    
    // Calculate center from all valid vehicle coordinates
    const validCoords = sessionCoordinates
      .filter(item => item.coordinates.current.hasValidCoords)
      .map(item => [item.coordinates.current.lat, item.coordinates.current.lng]);
    
    if (validCoords.length > 0) {
      const avgLat = validCoords.reduce((sum, [lat]) => sum + lat, 0) / validCoords.length;
      const avgLng = validCoords.reduce((sum, [, lng]) => sum + lng, 0) / validCoords.length;
      return [avgLat, avgLng];
    }
    
    // Default to NYC if no valid coordinates
    return [40.7128, -74.0060];
  }, [selectedSession, sessionCoordinates]);

  // Memoized zoom level
  const zoomLevel = useMemo(() => {
    if (selectedSession) return 14;
    if (sessionCoordinates.length > 1) return 12;
    return 13;
  }, [selectedSession, sessionCoordinates.length]);

  return (
    <MapContainer
      center={centerCoordinates as [number, number]}
      zoom={zoomLevel}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      boxZoom={false}
      keyboard={false}
      dragging={true}
      touchZoom={true}
    >
      <MapController selectedSession={selectedSession} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={18}
        minZoom={3}
      />
      
      {/* Vehicle markers */}
      {sessionCoordinates.map(({ session, coordinates }) => {
        if (!coordinates.current.hasValidCoords) return null;
        
        return (
          <Marker
            key={`vehicle-${session.session_id}`}
            position={[coordinates.current.lat, coordinates.current.lng]}
            icon={vehicleIcon}
            eventHandlers={{
              click: () => onVehicleClick(session),
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong>Vehicle: {session.vehicle_id}</strong><br />
                Session: {session.session_id}<br />
                Status: {session.order_status || session.status}<br />
                {session.distance_to_destination_km && (
                  <>Distance: {session.distance_to_destination_km.toFixed(1)} km<br /></>
                )}
                {session.eta && (
                  <>ETA: {session.eta}</>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      {/* Pickup markers */}
      {sessionCoordinates.map(({ session, coordinates }) => {
        if (!coordinates.pickup.hasValidCoords) return null;
        
        return (
          <Marker
            key={`pickup-${session.session_id}`}
            position={[coordinates.pickup.lat, coordinates.pickup.lng]}
            icon={pickupIcon}
            eventHandlers={{
              click: () => onPickupClick(session),
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong>Pickup Location</strong><br />
                Session: {session.session_id}<br />
                Order: {session.order_id}<br />
                Vehicle: {session.vehicle_id}
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      {/* Delivery markers */}
      {sessionCoordinates.map(({ session, coordinates }) => {
        if (!coordinates.delivery.hasValidCoords) return null;
        
        return (
          <Marker
            key={`delivery-${session.session_id}`}
            position={[coordinates.delivery.lat, coordinates.delivery.lng]}
            icon={deliveryIcon}
            eventHandlers={{
              click: () => onDeliveryClick(session),
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong>Delivery Location</strong><br />
                Session: {session.session_id}<br />
                Order: {session.order_id}<br />
                Vehicle: {session.vehicle_id}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
} 