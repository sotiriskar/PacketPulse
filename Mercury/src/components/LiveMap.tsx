'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  DirectionsCar,
  Schedule,
  Route,
  Search
} from '@mui/icons-material';
import dynamic from 'next/dynamic';

// Create a client-only map component
const MapComponent = dynamic(() => import('./MapComponent').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});

interface Session {
  session_id: string;
  vehicle_id: string;
  order_id: string;
  status: string;
  latest_activity: string;
  // Optional fields for backward compatibility
  order_status?: string;
  start_time?: string;
  last_update_time?: string;
  distance_to_destination_km?: number;
  elapsed_time?: string;
  avg_speed_kmh?: number;
  eta?: string;
  // Current vehicle coordinates
  current_latitude?: number;
  current_longitude?: number;
  // Start coordinates (pickup)
  start_latitude?: number;
  start_longitude?: number;
  // End coordinates (delivery)
  end_latitude?: number;
  end_longitude?: number;
}

interface LiveMapProps {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  onSessionClick: (session: Session) => void;
}



export default function LiveMap({ sessions, loading, error, onSessionClick }: LiveMapProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedFilterSession, setSelectedFilterSession] = useState<Session | null>(null);
  const [coordinateDialogOpen, setCoordinateDialogOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    type: 'pickup' | 'delivery' | 'vehicle';
    session: Session;
    latitude: number;
    longitude: number;
  } | null>(null);

  // Use real data from props
  const displaySessions = sessions;
  


  // Auto-select the latest session only on initial load
  useEffect(() => {
    if (displaySessions.length > 0 && !selectedFilterSession) {
      const latestSession = displaySessions[0]; // Assuming sessions are ordered by latest_activity DESC
      setSelectedFilterSession(latestSession);
    }
  }, [displaySessions, selectedFilterSession]);

  // Filter sessions based on search term and selected filter
  useEffect(() => {
    let filtered = displaySessions;
    
    // First filter by search term
    if (searchTerm) {
      filtered = filtered.filter(session =>
        (session.vehicle_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (session.session_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (session.order_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    
    // Then filter by selected session if any
    if (selectedFilterSession) {
      filtered = filtered.filter(session => 
        session.session_id === selectedFilterSession.session_id
      );
    }
    
    setFilteredSessions(filtered);
  }, [displaySessions, searchTerm, selectedFilterSession]);

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setSessionDialogOpen(true);
  };

  const handlePickupClick = (session: Session) => {
    console.log('Pickup clicked:', session);
    console.log('Start coordinates:', session.start_latitude, session.start_longitude);
    
    if (!session.start_latitude || !session.start_longitude) {
      console.warn('No pickup coordinates available for session:', session.session_id);
      return;
    }
    
    setSelectedCoordinates({
      type: 'pickup',
      session,
      latitude: session.start_latitude,
      longitude: session.start_longitude
    });
    setCoordinateDialogOpen(true);
  };

  const handleDeliveryClick = (session: Session) => {
    console.log('Delivery clicked:', session);
    console.log('End coordinates:', session.end_latitude, session.end_longitude);
    
    if (!session.end_latitude || !session.end_longitude) {
      console.warn('No delivery coordinates available for session:', session.session_id);
      return;
    }
    
    setSelectedCoordinates({
      type: 'delivery',
      session,
      latitude: session.end_latitude,
      longitude: session.end_longitude
    });
    setCoordinateDialogOpen(true);
  };

  const handleVehicleClick = (session: Session) => {
    console.log('Vehicle clicked:', session);
    console.log('Current coordinates:', session.current_latitude, session.current_longitude);
    
    if (!session.current_latitude || !session.current_longitude) {
      console.warn('No current coordinates available for session:', session.session_id);
      return;
    }
    
    setSelectedCoordinates({
      type: 'vehicle',
      session,
      latitude: session.current_latitude,
      longitude: session.current_longitude
    });
    setCoordinateDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started':
        return 'primary';
      case 'en_route':
        return 'warning';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'started':
        return <DirectionsCar />;
      case 'en_route':
        return <Route />;
      case 'completed':
        return <Schedule />;
      default:
        return <DirectionsCar />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' }, gap: 3 }}>
        {/* Map Section */}
        <Card sx={{ backgroundColor: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Live Session Tracking
            </Typography>
            <Box
              sx={{
                height: 600,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #e0e0e0',
              }}
            >
              <MapComponent
                sessions={filteredSessions}
                selectedSession={selectedFilterSession}
                onVehicleClick={handleVehicleClick}
                onPickupClick={handlePickupClick}
                onDeliveryClick={handleDeliveryClick}
              />
              
              {/* Map legend */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  backgroundColor: 'white',
                  borderRadius: 1,
                  p: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  <Box component="span" sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1976d2', mr: 0.5 }} />
                  Vehicle
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  <Box component="span" sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 20, 
                    height: 20, 
                    backgroundColor: '#4caf50', 
                    borderRadius: '50%',
                    border: '1px solid white',
                    mr: 0.5 
                  }}>
                    📦
                  </Box>
                  Pickup
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  <Box component="span" sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 20, 
                    height: 20, 
                    backgroundColor: '#f44336', 
                    borderRadius: '50%',
                    border: '1px solid white',
                    mr: 0.5 
                  }}>
                    🛍️
                  </Box>
                  Delivery
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Vehicle List */}
        <Card sx={{ backgroundColor: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {selectedFilterSession ? 'Selected Session' : 'Active Sessions'}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                fullWidth
                size="small"
                options={displaySessions}
                getOptionLabel={(option) => 
                  `${option.session_id} - ${option.vehicle_id} - ${option.order_id}`
                }
                value={selectedFilterSession}
                onChange={(event, newValue) => {
                  setSelectedFilterSession(newValue);
                  if (newValue) {
                    setSearchTerm('');
                  }
                }}
                onInputChange={(event, newInputValue) => {
                  setSearchTerm(newInputValue);
                  if (!newInputValue) {
                    setSelectedFilterSession(null);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search sessions..."
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.session_id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.session_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Vehicle: {option.vehicle_id} | Order: {option.order_id}
                      </Typography>
                    </Box>
                  </Box>
                )}
                clearOnBlur={false}
                clearOnEscape
                selectOnFocus
              />
            </Box>
            
            <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
              {filteredSessions.map((session, index) => {
                // Ensure we have a valid key
                const key = session.session_id || `session-${index}`;
                return (
                  <Card
                    key={key}
                    sx={{
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                    onClick={() => setSelectedSession(session)}
                  >
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2">
                          {session.vehicle_id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.session_id}
                        </Typography>
                      </Box>
                      <Chip
                        label={session.order_status === 'en_route' ? 'En Route' : 'Started'}
                        color={session.order_status === 'en_route' ? 'primary' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        {session.distance_to_destination_km ? `${session.distance_to_destination_km.toFixed(1)} km` : 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ETA: {session.eta || 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Session Details Dialog */}
      <Dialog
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedSession && (
          <>
            <DialogTitle>
              Session Details - {selectedSession.session_id}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Vehicle ID</Typography>
                  <Typography variant="body1">{selectedSession.vehicle_id}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Order ID</Typography>
                  <Typography variant="body1">{selectedSession.order_id}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedSession.order_status === 'en_route' ? 'En Route' : 'Started'}
                    color={selectedSession.order_status === 'en_route' ? 'primary' : 'warning'}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Distance</Typography>
                  <Typography variant="body1">{selectedSession.distance_to_destination_km ? `${selectedSession.distance_to_destination_km.toFixed(1)} km` : 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Speed</Typography>
                  <Typography variant="body1">{selectedSession.avg_speed_kmh ? `${selectedSession.avg_speed_kmh.toFixed(1)} km/h` : 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ETA</Typography>
                  <Typography variant="body1">{selectedSession.eta || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Start Time</Typography>
                  <Typography variant="body1">
                    {selectedSession.start_time ? new Date(selectedSession.start_time).toLocaleTimeString() : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Elapsed Time</Typography>
                  <Typography variant="body1">{selectedSession.elapsed_time || 'N/A'}</Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedSession(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Coordinate Details Dialog */}
      <Dialog
        open={coordinateDialogOpen}
        onClose={() => setCoordinateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedCoordinates && (
          <>
            <DialogTitle>
              {selectedCoordinates.type === 'pickup' ? 'Pickup' : selectedCoordinates.type === 'delivery' ? 'Delivery' : 'Vehicle'} Location - {selectedCoordinates.session.session_id}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Session ID</Typography>
                  <Typography variant="body1">{selectedCoordinates.session.session_id}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Vehicle ID</Typography>
                  <Typography variant="body1">{selectedCoordinates.session.vehicle_id}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Order ID</Typography>
                  <Typography variant="body1">{selectedCoordinates.session.order_id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Location Type</Typography>
                  <Chip
                    label={selectedCoordinates.type === 'pickup' ? 'Pickup' : selectedCoordinates.type === 'delivery' ? 'Delivery' : 'Vehicle'}
                    color={selectedCoordinates.type === 'pickup' ? 'success' : selectedCoordinates.type === 'delivery' ? 'error' : 'primary'}
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Latitude</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {selectedCoordinates.latitude.toFixed(6)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Longitude</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {selectedCoordinates.longitude.toFixed(6)}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCoordinateDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Debug: Show dialog state */}
      <Box sx={{ position: 'fixed', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', p: 1, borderRadius: 1, fontSize: '12px', zIndex: 9999 }}>
        Dialog Open: {coordinateDialogOpen ? 'Yes' : 'No'}
        <br />
        Selected: {selectedCoordinates ? `${selectedCoordinates.type} - ${selectedCoordinates.session.session_id}` : 'None'}
      </Box>
    </Box>
  );
} 