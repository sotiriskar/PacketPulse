'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  DirectionsCar,
  LocationOn,
  Schedule,
  Route,
  Search,
  Visibility,
  Close,
  MyLocation,
} from '@mui/icons-material';

interface Session {
  session_id: string;
  vehicle_id: string;
  order_id: string;
  order_status: string;
  start_time: string;
  last_update_time: string;
  distance_to_destination_km: number;
  elapsed_time: string;
  avg_speed_kmh: number;
  eta: string;
  latitude?: number;
  longitude?: number;
}

interface LiveMapProps {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  onSessionClick: (session: Session) => void;
}

// Mock data
const mockSessions: Session[] = [
  {
    session_id: 'SESS001',
    vehicle_id: 'VH001',
    order_id: 'ORD001',
    order_status: 'en_route',
    start_time: '2024-01-15T08:00:00Z',
    last_update_time: '2024-01-15T10:30:00Z',
    distance_to_destination_km: 12.5,
    elapsed_time: '2h 30m',
    avg_speed_kmh: 45.2,
    eta: '11:45 AM',
    latitude: 40.7128,
    longitude: -74.0060,
  },
  {
    session_id: 'SESS002',
    vehicle_id: 'VH002',
    order_id: 'ORD002',
    order_status: 'started',
    start_time: '2024-01-15T09:15:00Z',
    last_update_time: '2024-01-15T10:45:00Z',
    distance_to_destination_km: 8.3,
    elapsed_time: '1h 30m',
    avg_speed_kmh: 38.7,
    eta: '11:20 AM',
    latitude: 40.7589,
    longitude: -73.9851,
  },
  {
    session_id: 'SESS003',
    vehicle_id: 'VH003',
    order_id: 'ORD003',
    order_status: 'en_route',
    start_time: '2024-01-15T07:30:00Z',
    last_update_time: '2024-01-15T10:30:00Z',
    distance_to_destination_km: 15.2,
    elapsed_time: '3h 00m',
    avg_speed_kmh: 52.1,
    eta: '11:15 AM',
    latitude: 40.7505,
    longitude: -73.9934,
  },
  {
    session_id: 'SESS004',
    vehicle_id: 'VH004',
    order_id: 'ORD004',
    order_status: 'started',
    start_time: '2024-01-15T08:45:00Z',
    last_update_time: '2024-01-15T10:30:00Z',
    distance_to_destination_km: 6.8,
    elapsed_time: '1h 45m',
    avg_speed_kmh: 41.3,
    eta: '11:30 AM',
    latitude: 40.7484,
    longitude: -73.9857,
  },
  {
    session_id: 'SESS005',
    vehicle_id: 'VH005',
    order_id: 'ORD005',
    order_status: 'en_route',
    start_time: '2024-01-15T06:00:00Z',
    last_update_time: '2024-01-15T10:30:00Z',
    distance_to_destination_km: 22.1,
    elapsed_time: '4h 30m',
    avg_speed_kmh: 35.8,
    eta: '12:00 PM',
    latitude: 40.7614,
    longitude: -73.9776,
  },
];

export default function LiveMap({ sessions, loading, error, onSessionClick }: LiveMapProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  // Use mock data instead of props
  const displaySessions = mockSessions;

  useEffect(() => {
    const filtered = displaySessions.filter(session =>
      session.vehicle_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.order_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSessions(filtered);
  }, [displaySessions, searchTerm]);

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setSessionDialogOpen(true);
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

  // Mock coordinates for demonstration
  const getMockCoordinates = (sessionId: string) => {
    const hash = sessionId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return {
      latitude: 40.7128 + (hash % 100) / 1000,
      longitude: -74.0060 + (hash % 100) / 1000,
    };
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
              Live Vehicle Tracking
            </Typography>
            <Box
              sx={{
                height: 600,
                backgroundColor: '#f0f0f0',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #ccc',
                position: 'relative',
              }}
            >
              {/* Mock map with vehicle markers */}
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Background grid pattern */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                  }}
                />
                
                {/* Vehicle markers */}
                {mockSessions.map((session, index) => (
                  <Box
                    key={session.session_id}
                    sx={{
                      position: 'absolute',
                      left: `${20 + (index * 15) % 60}%`,
                      top: `${30 + (index * 20) % 50}%`,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: session.order_status === 'en_route' ? '#1976d2' : '#ff9800',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.2)',
                      },
                    }}
                  />
                ))}
                
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
                  }}
                >
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    <Box component="span" sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1976d2', mr: 0.5 }} />
                    En Route
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <Box component="span" sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff9800', mr: 0.5 }} />
                    Started
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Vehicle List */}
        <Card sx={{ backgroundColor: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Active Vehicles
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search vehicles..."
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
              {mockSessions.map((session) => (
                <Card
                  key={session.session_id}
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
                        {session.distance_to_destination_km.toFixed(1)} km
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ETA: {session.eta}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
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
                  <Typography variant="body1">{selectedSession.distance_to_destination_km.toFixed(1)} km</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Speed</Typography>
                  <Typography variant="body1">{selectedSession.avg_speed_kmh.toFixed(1)} km/h</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ETA</Typography>
                  <Typography variant="body1">{selectedSession.eta}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Start Time</Typography>
                  <Typography variant="body1">
                    {new Date(selectedSession.start_time).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Elapsed Time</Typography>
                  <Typography variant="body1">{selectedSession.elapsed_time}</Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedSession(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
} 