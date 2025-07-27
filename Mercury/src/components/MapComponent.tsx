'use client';

import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Fab, Tooltip } from '@mui/material';
import { MyLocation } from '@mui/icons-material';

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

// Custom component to handle map centering and auto-follow
function MapController({ 
  selectedSession, 
  autoCenter, 
  onAutoCenterChange 
}: { 
  selectedSession: Session | null;
  autoCenter: boolean;
  onAutoCenterChange: (enabled: boolean) => void;
}) {
  const map = useMap();
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [lastCoords, setLastCoords] = useState<{lat: number, lng: number} | null>(null);

  console.log('MapController: Component rendered with props:', { 
    selectedSessionId: selectedSession?.session_id, 
    autoCenter, 
    hasMap: !!map 
  });

  // Function to center map on selected session
  const centerMap = useCallback(() => {
    if (!selectedSession) return;
    
    let targetLat: number | undefined;
    let targetLng: number | undefined;
    
    // Always prioritize vehicle location (driver's actual position)
    if (selectedSession.current_latitude && selectedSession.current_longitude) {
      targetLat = selectedSession.current_latitude;
      targetLng = selectedSession.current_longitude;
    } else if (selectedSession.start_latitude && selectedSession.start_longitude) {
      targetLat = selectedSession.start_latitude;
      targetLng = selectedSession.start_longitude;
    } else if (selectedSession.end_latitude && selectedSession.end_longitude) {
      targetLat = selectedSession.end_latitude;
      targetLng = selectedSession.end_longitude;
    }
    
    if (targetLat && targetLng) {
      map.setView([targetLat, targetLng], 16, { animate: true });
    }
  }, [selectedSession, map]);

  // Handle session change
  useEffect(() => {
    if (selectedSession && selectedSession.session_id !== lastSessionId) {
      setLastSessionId(selectedSession.session_id);
      centerMap();
    }
  }, [selectedSession, lastSessionId, centerMap]);

  // Handle auto-centering when vehicle moves
  useEffect(() => {
    console.log('Auto-center effect triggered:', { autoCenter, selectedSession: !!selectedSession });
    
    if (!autoCenter || !selectedSession) return;

    const currentLat = selectedSession.current_latitude;
    const currentLng = selectedSession.current_longitude;
    
    console.log('Vehicle coordinates:', { currentLat, currentLng });
    
    if (currentLat && currentLng) {
      const newCoords = { lat: currentLat, lng: currentLng };
      
      console.log('Centering map on vehicle:', newCoords);
      setLastCoords(newCoords);
      centerMap();
    }
  }, [selectedSession?.current_latitude, selectedSession?.current_longitude, autoCenter, centerMap]);

  // Continuous auto-centering when enabled
  useEffect(() => {
    if (!autoCenter || !selectedSession) return;

    const interval = setInterval(() => {
      const currentLat = selectedSession.current_latitude;
      const currentLng = selectedSession.current_longitude;
      
      if (currentLat && currentLng) {
        console.log('Continuous centering on vehicle:', { currentLat, currentLng });
        // Use the overridden setView to set the auto-centering flag
        map.setView([currentLat, currentLng], 16, { animate: false });
      }
    }, 2000); // Center every 2 seconds

    return () => clearInterval(interval);
  }, [autoCenter, selectedSession, map]);

  // Detect manual map movement and disable auto-centering
  useEffect(() => {
    let isInitialLoad = true;

    // Delay adding event listeners to avoid triggering on initial map setup
    const timer = setTimeout(() => {
      isInitialLoad = false;
    }, 1000); // Wait 1 second before enabling manual movement detection

    // Function to disable auto-center immediately
    const disableAutoCenter = () => {
      if (!isInitialLoad && autoCenter) {
        console.log('MapController: Manual interaction detected, disabling auto-center');
        onAutoCenterChange(false);
      }
    };

    // Listen for zoom control clicks specifically
    const handleZoomControlClick = () => {
      console.log('MapController: Zoom control clicked, disabling auto-center');
      if (!isInitialLoad && autoCenter) {
        console.log('MapController: Disabling auto-center due to zoom control click');
        onAutoCenterChange(false);
      }
    };
    
    // Attach zoom control listeners immediately and after delay
    const attachZoomListeners = () => {
      const zoomControls = map.getContainer().querySelectorAll('.leaflet-control-zoom-in, .leaflet-control-zoom-out');
      zoomControls.forEach(control => {
        // Remove existing listener first to avoid duplicates
        control.removeEventListener('click', handleZoomControlClick);
        control.addEventListener('click', handleZoomControlClick);
        console.log('MapController: Added click listener to zoom control');
      });
    };

    // Try immediately and after delay
    attachZoomListeners();
    setTimeout(attachZoomListeners, 500);
    setTimeout(attachZoomListeners, 1000);

    // Also listen for manual interactions (but be more careful)
    map.on('dragstart', disableAutoCenter);

    return () => {
      clearTimeout(timer);
      map.off('dragstart', disableAutoCenter);
      
      // Remove zoom control listeners
      const zoomControls = map.getContainer().querySelectorAll('.leaflet-control-zoom-in, .leaflet-control-zoom-out');
      zoomControls.forEach(control => {
        control.removeEventListener('click', handleZoomControlClick);
      });
    };
  }, [map, autoCenter, onAutoCenterChange]);

  return null;
}

// Component for the recenter button that has access to the map
function RecenterButton({ 
  autoCenter, 
  setAutoCenter, 
  selectedSession 
}: { 
  autoCenter: boolean;
  setAutoCenter: (enabled: boolean) => void;
  selectedSession: Session | null;
}) {
  const map = useMap();

  console.log('RecenterButton render:', { autoCenter, hasSelectedSession: !!selectedSession });

  if (autoCenter || !selectedSession) {
    console.log('RecenterButton: Not rendering because autoCenter is', autoCenter, 'or no selectedSession');
    return null;
  }
  
  console.log('RecenterButton: Rendering button');

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        pointerEvents: 'auto',
        backgroundColor: 'white',
        borderRadius: '50%',
        padding: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <Tooltip title="Center on vehicle" placement="left">
        <Fab
          size="medium"
          color="primary"
          onClick={() => {
            console.log('Recenter button clicked');
            setAutoCenter(true);
            // Immediately center on the vehicle
            if (selectedSession.current_latitude && selectedSession.current_longitude) {
              console.log('Centering on vehicle:', selectedSession.current_latitude, selectedSession.current_longitude);
              map.setView(
                [selectedSession.current_latitude, selectedSession.current_longitude],
                16,
                { animate: true }
              );
            }
          }}
          sx={{
            backgroundColor: colorPalette.primary,
            '&:hover': {
              backgroundColor: colorPalette.primaryDark,
            },
            width: 48,
            height: 48,
          }}
        >
          <MyLocation sx={{ fontSize: 24 }} />
        </Fab>
      </Tooltip>
    </Box>
  );
}

export default function MapComponent({ 
  sessions, 
  selectedSession
}: MapComponentProps) {
  
  const [hasCentered, setHasCentered] = useState(false);
  const [autoCenter, setAutoCenter] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  
  console.log('MapComponent: Received sessions:', sessions.length);
  console.log('MapComponent: Selected session:', selectedSession?.session_id);
  console.log('MapComponent: Auto-center state:', autoCenter);
  console.log('MapComponent: Auto-center state type:', typeof autoCenter);
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
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Auto-center button - OUTSIDE MapContainer */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 1000,
          pointerEvents: 'auto',
        }}
      >
        <Tooltip title="Auto Center" placement="left">
          <Fab
            size="small"
            onClick={() => {
              console.log('Auto-center button clicked, enabling auto-center');
              setAutoCenter(true);
            }}
            sx={{
              backgroundColor: 'white',
              color: '#666',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
              },
              width: 32,
              height: 32,
              minHeight: 32,
              '& .MuiFab-label': {
                fontSize: '14px',
              },
            }}
          >
            <MyLocation sx={{ fontSize: 14 }} />
          </Fab>
        </Tooltip>
      </Box>

            {/* Recenter button - OUTSIDE MapContainer */}
      {!autoCenter && selectedSession && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
        >
          <Tooltip title="Re-center on vehicle" placement="left">
            <Fab
              size="small"
              onClick={() => {
                console.log('Recenter button clicked');
                setAutoCenter(true);
                // Force immediate centering
                if (mapRef.current && selectedSession.current_latitude && selectedSession.current_longitude) {
                  const map = mapRef.current;
                  map.setView(
                    [selectedSession.current_latitude, selectedSession.current_longitude],
                    16
                  );
                }
              }}
              sx={{
                backgroundColor: 'white',
                color: '#666',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
                },
                width: 32,
                height: 32,
                minHeight: 32,
                '& .MuiFab-label': {
                  fontSize: '14px',
                },
              }}
            >
              <MyLocation sx={{ fontSize: 14 }} />
            </Fab>
          </Tooltip>
        </Box>
      )}

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
        ref={mapRef}
      >
                <MapController 
          selectedSession={selectedSession} 
          autoCenter={autoCenter}
          onAutoCenterChange={setAutoCenter}
        />
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
    </Box>
  );
} 