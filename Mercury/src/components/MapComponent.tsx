'use client';

import React, { useEffect, useMemo, useCallback, useState } from 'react';
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
}

// Custom component to handle map centering
function MapController({ selectedSession }: { selectedSession: Session | null }) {
  const map = useMap();
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSession && selectedSession.session_id !== lastSessionId) {
      console.log('MapController: Selected session changed', selectedSession.session_id);
      setLastSessionId(selectedSession.session_id);
      
      // Try to center immediately if map is ready
      const centerMap = () => {
        let targetLat: number | undefined;
        let targetLng: number | undefined;
        
        // Always prioritize vehicle location (driver's actual position)
        if (selectedSession.current_latitude && selectedSession.current_longitude) {
          targetLat = selectedSession.current_latitude;
          targetLng = selectedSession.current_longitude;
          console.log('MapController: Using vehicle coordinates (driver location)', targetLat, targetLng);
        } else if (selectedSession.start_latitude && selectedSession.start_longitude) {
          targetLat = selectedSession.start_latitude;
          targetLng = selectedSession.start_longitude;
          console.log('MapController: Using pickup coordinates (fallback)', targetLat, targetLng);
        } else if (selectedSession.end_latitude && selectedSession.end_longitude) {
          targetLat = selectedSession.end_latitude;
          targetLng = selectedSession.end_longitude;
          console.log('MapController: Using delivery coordinates (fallback)', targetLat, targetLng);
        }
        
        if (targetLat && targetLng) {
          console.log('MapController: Centering map on driver location', targetLat, targetLng);
          map.setView(
            [targetLat, targetLng],
            16,
            { animate: true }
          );
        } else {
          console.log('MapController: No valid coordinates found for session', selectedSession.session_id);
        }
      };

      // Try immediately
      centerMap();
      
      // Also try after a delay to ensure map is fully loaded
      const timer = setTimeout(centerMap, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedSession, map, lastSessionId]);

  return null;
}

export default function MapComponent({ 
  sessions, 
  selectedSession
}: MapComponentProps) {
  
  const [hasCentered, setHasCentered] = useState(false);
  
  console.log('MapComponent: Received sessions:', sessions.length);
  console.log('MapComponent: Selected session:', selectedSession?.session_id);
  if (selectedSession) {
    console.log('MapComponent: Selected session coords - Vehicle:', selectedSession.current_latitude, selectedSession.current_longitude);
    console.log('MapComponent: Selected session coords - Pickup:', selectedSession.start_latitude, selectedSession.start_longitude);
    console.log('MapComponent: Selected session coords - Delivery:', selectedSession.end_latitude, selectedSession.end_longitude);
  }
  
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
  const deliveryIcon = useMemo(() => createCustomIcon(colorPalette.accent, '📍'), [createCustomIcon]);
  
  // Memoized session coordinates - only show selected session or all if none selected
  const sessionCoordinates = useMemo(() => {
    const sessionsToShow = selectedSession 
      ? sessions.filter(session => session.session_id === selectedSession.session_id)
      : sessions;
      
    return sessionsToShow.map(session => ({
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
  }, [sessions, selectedSession]);

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
    
    // Default to Athens if no valid coordinates
    return [37.9838, 23.7275];
  }, [selectedSession, sessionCoordinates]);

  // Memoized zoom level
  const zoomLevel = useMemo(() => {
    if (selectedSession) return 8;
    if (sessionCoordinates.length > 1) return 12;
    if (sessionCoordinates.length === 1) return 13;
    // Zoom out for Athens when no sessions
    return 10;
  }, [selectedSession, sessionCoordinates.length]);

  // Helper function to get status color
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'started':
        return colorPalette.primaryLight;
      case 'en_route':
        return colorPalette.primary;
      case 'completed':
        return colorPalette.primaryDark;
      default:
        return colorPalette.muted;
    }
  }, []);

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
      ref={(map) => {
        // Only center on initial load when there's a selected session
        if (map && selectedSession && !hasCentered) {
          console.log('MapContainer ref: Initial centering for selected session', selectedSession.session_id);
          setHasCentered(true);
          
          setTimeout(() => {
            let targetLat: number | undefined;
            let targetLng: number | undefined;
            
            // Always prioritize vehicle location (driver's actual position)
            if (selectedSession.current_latitude && selectedSession.current_longitude) {
              targetLat = selectedSession.current_latitude;
              targetLng = selectedSession.current_longitude;
              console.log('MapContainer ref: Using vehicle coordinates (driver location)', targetLat, targetLng);
            } else if (selectedSession.start_latitude && selectedSession.start_longitude) {
              targetLat = selectedSession.start_latitude;
              targetLng = selectedSession.start_longitude;
              console.log('MapContainer ref: Using pickup coordinates (fallback)', targetLat, targetLng);
            } else if (selectedSession.end_latitude && selectedSession.end_longitude) {
              targetLat = selectedSession.end_latitude;
              targetLng = selectedSession.end_longitude;
              console.log('MapContainer ref: Using delivery coordinates (fallback)', targetLat, targetLng);
            }
            
            if (targetLat && targetLng) {
              console.log('MapContainer ref: Centering map on driver location', targetLat, targetLng);
              map.setView([targetLat, targetLng], 16, { animate: true });
            }
          }, 100);
        }
      }}
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
          >
            <Popup>
              <div style={{ 
                minWidth: '280px',
                fontFamily: 'Roboto, sans-serif',
                padding: '8px 0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <span style={{ fontSize: '20px' }}>🛵</span>
                  <div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '16px',
                      color: '#333'
                    }}>
                      Vehicle Location
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      {session.vehicle_id}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Session ID</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>{session.session_id}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Order ID</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>{session.order_id}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Status</div>
                    <div style={{ 
                      display: 'inline-block',
                      backgroundColor: getStatusColor(session.order_status || 'started'),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {session.order_status === 'en_route' ? 'En Route' : 'Started'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Distance</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {session.distance_to_destination_km ? `${session.distance_to_destination_km.toFixed(1)} km` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Speed</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {session.avg_speed_kmh ? `${session.avg_speed_kmh.toFixed(1)} km/h` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>ETA</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {session.eta || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #e0e0e0',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <div>Coordinates: {coordinates.current.lat.toFixed(6)}, {coordinates.current.lng.toFixed(6)}</div>
                </div>
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
          >
            <Popup>
              <div style={{ 
                minWidth: '280px',
                fontFamily: 'Roboto, sans-serif',
                padding: '8px 0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <span style={{ fontSize: '20px' }}>📦</span>
                  <div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '16px',
                      color: '#333'
                    }}>
                      Pickup Location
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      {session.vehicle_id}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Session ID</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>{session.session_id}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Order ID</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>{session.order_id}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Status</div>
                    <div style={{ 
                      display: 'inline-block',
                      backgroundColor: getStatusColor(session.order_status || 'started'),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {session.order_status === 'en_route' ? 'En Route' : 'Started'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Distance</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {session.distance_to_destination_km ? `${session.distance_to_destination_km.toFixed(1)} km` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>ETA</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {session.eta || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Start Time</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {session.start_time ? new Date(session.start_time).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #e0e0e0',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <div>Coordinates: {coordinates.pickup.lat.toFixed(6)}, {coordinates.pickup.lng.toFixed(6)}</div>
                </div>
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
          >
            <Popup>
              <div style={{ 
                minWidth: '280px',
                fontFamily: 'Roboto, sans-serif',
                padding: '8px 0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <span style={{ fontSize: '20px' }}>📍</span>
                  <div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '16px',
                      color: '#333'
                    }}>
                      Delivery Location
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      {session.vehicle_id}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Session ID</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>{session.session_id}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Order ID</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>{session.order_id}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Status</div>
                    <div style={{ 
                      display: 'inline-block',
                      backgroundColor: getStatusColor(session.order_status || 'started'),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {session.order_status === 'en_route' ? 'En Route' : 'Started'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Distance</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {session.distance_to_destination_km ? `${session.distance_to_destination_km.toFixed(1)} km` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>ETA</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {session.eta || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '2px' }}>Elapsed Time</div>
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {session.elapsed_time || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #e0e0e0',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <div>Coordinates: {coordinates.delivery.lat.toFixed(6)}, {coordinates.delivery.lng.toFixed(6)}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
} 