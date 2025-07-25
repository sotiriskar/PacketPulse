'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Color palette based on #fe4e50
const colorPalette = {
  primary: '#fe4e50', // Main brand color
  primaryLight: '#ff6b6d', // Lighter shade
  primaryDark: '#d13a3c', // Darker shade
  primaryVeryDark: '#a82d2f', // Very dark for Active status
  secondary: '#ff8a80', // Complementary light
  tertiary: '#ffb3a7', // Very light shade
  accent: '#ff6b6d', // Medium light
  muted: '#ffcdd2', // Very light for backgrounds
};

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
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

// Custom marker icons
const createCustomIcon = (color: string, icon: string) => {
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
      ">
        <span style="color: white; font-size: 16px;">${icon}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const vehicleIcon = createCustomIcon(colorPalette.primary, '🛵');
const pickupIcon = createCustomIcon(colorPalette.secondary, '📦');
const deliveryIcon = createCustomIcon(colorPalette.accent, '🛍️');

// Custom component to handle map centering
function MapController({ selectedSession }: { selectedSession: Session | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedSession && selectedSession.current_latitude && selectedSession.current_longitude) {
      map.setView(
        [selectedSession.current_latitude, selectedSession.current_longitude],
        12 // Zoom level when centering on a vehicle (more zoomed out)
      );
    }
  }, [selectedSession, map]);

  return null;
}

export default function MapComponent({ sessions, selectedSession, onVehicleClick, onPickupClick, onDeliveryClick }: MapComponentProps) {
  // Get coordinates for a session
  const getSessionCoordinates = (session: Session) => {
    return {
      current: {
        lat: session.current_latitude || 0,
        lng: session.current_longitude || 0,
      },
      pickup: {
        lat: session.start_latitude || 0,
        lng: session.start_longitude || 0,
      },
      delivery: {
        lat: session.end_latitude || 0,
        lng: session.end_longitude || 0,
      },
    };
  };

  return (
    <MapContainer
      center={[40.7128, -74.0060]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <MapController selectedSession={selectedSession} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {/* Vehicle markers */}
      {sessions.map((session) => {
        const coords = getSessionCoordinates(session);
        return (
          <Marker
            key={`vehicle-${session.session_id}`}
            position={[coords.current.lat, coords.current.lng]}
            icon={vehicleIcon}
            eventHandlers={{
              click: () => onVehicleClick(session),
            }}
          >
            <Popup>
              <div>
                <strong>Vehicle: {session.vehicle_id}</strong><br />
                Session: {session.session_id}<br />
                Status: {session.status}
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      {/* Pickup markers */}
      {sessions.map((session) => {
        const coords = getSessionCoordinates(session);
        return (
          <Marker
            key={`pickup-${session.session_id}`}
            position={[coords.pickup.lat, coords.pickup.lng]}
            icon={pickupIcon}
            eventHandlers={{
              click: () => onPickupClick(session),
            }}
          >
            <Popup>
              <div>
                <strong>Pickup Location</strong><br />
                Session: {session.session_id}<br />
                Order: {session.order_id}
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      {/* Delivery markers */}
      {sessions.map((session) => {
        const coords = getSessionCoordinates(session);
        return (
          <Marker
            key={`delivery-${session.session_id}`}
            position={[coords.delivery.lat, coords.delivery.lng]}
            icon={deliveryIcon}
            eventHandlers={{
              click: () => onDeliveryClick(session),
            }}
          >
            <Popup>
              <div>
                <strong>Delivery Location</strong><br />
                Session: {session.session_id}<br />
                Order: {session.order_id}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
} 