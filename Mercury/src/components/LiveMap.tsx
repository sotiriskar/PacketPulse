'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Fab,
  SwipeableDrawer,
} from '@mui/material';
import {
  DirectionsCar,
  Schedule,
  Route,
  Search,
  Close,
  LocationOn,
  LocalShipping,
  ShoppingCart,
  List as ListIcon,
} from '@mui/icons-material';
import dynamic from 'next/dynamic';

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

// Create a client-only map component
const MapComponent = dynamic(() => import('./MapComponent').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
      <CircularProgress />
    </Box>
  )
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

interface LiveMapProps {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  onSessionClick: (session: Session) => void;
}

export default function LiveMap({ sessions, loading, error, onSessionClick }: LiveMapProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterSession, setSelectedFilterSession] = useState<Session | null>(null);
  const [mobileSessionDrawerOpen, setMobileSessionDrawerOpen] = useState(false);

  // Memoized filtered sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(session =>
        session.vehicle_id?.toLowerCase().includes(term) ||
        session.session_id?.toLowerCase().includes(term) ||
        session.order_id?.toLowerCase().includes(term)
      );
    }
    
    if (selectedFilterSession) {
      filtered = filtered.filter(session => 
        session.session_id === selectedFilterSession.session_id
      );
    }
    
    return filtered;
  }, [sessions, searchTerm, selectedFilterSession]);

  // Auto-select the latest session only on initial load
  useEffect(() => {
    if (sessions.length > 0 && !selectedFilterSession) {
      setSelectedFilterSession(sessions[0]);
    }
  }, [sessions, selectedFilterSession]);

  const handleSessionClick = useCallback((session: Session) => {
    setSelectedSession(session);
    if (isMobile) {
      setMobileSessionDrawerOpen(false);
    }
  }, [isMobile]);

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

  const getStatusIcon = useCallback((status: string) => {
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
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      backgroundColor: '#f5f5f5', 
      height: '100%',
      maxWidth: '100%',
      overflow: 'auto'
    }}>
      {/* Main Content Area */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: { xs: 2, sm: 3 },
        mb: { xs: 2, sm: 3 }
      }}>
        {/* Map Section */}
        <Card sx={{ 
          backgroundColor: 'white',
          borderRadius: 3,
          flex: { lg: 1 },
          minHeight: { xs: '400px', sm: '500px', lg: '600px' },
          height: { xs: '400px', sm: '500px', lg: 'auto' }
        }}>
          <CardContent sx={{ 
            height: '100%',
            display: 'flex', 
            flexDirection: 'column',
            p: { xs: 2, sm: 3, md: 4 },
            '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } }
          }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                fontWeight: 500, 
                mb: 2 
              }}
            >
              Live Session Tracking
            </Typography>
            <Box
              sx={{
                flex: 1,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #e0e0e0',
                minHeight: 0,
                height: { xs: '300px', sm: '400px', lg: '100%' }
              }}
            >
              <MapComponent
                sessions={sessions}
                selectedSession={selectedFilterSession}
              />
              
              {/* Map legend */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 25,
                  right: 14,
                  backgroundColor: 'white',
                  borderRadius: 1,
                  p: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  <Box component="span" sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 20, 
                    height: 20, 
                    backgroundColor: colorPalette.primary, 
                    borderRadius: '50%',
                    border: '1px solid white',
                    mr: 0.5 
                  }}>
                    🛵
                  </Box>
                  Vehicle
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  <Box component="span" sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 20, 
                    height: 20, 
                    backgroundColor: colorPalette.secondary, 
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
                    backgroundColor: colorPalette.primaryVeryDark, 
                    borderRadius: '50%',
                    border: '1px solid white',
                    mr: 0.5 
                  }}>
                    📍
                  </Box>
                  Delivery
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Vehicle List - Sidebar on desktop, bottom panel on mobile */}
        <Card sx={{ 
          backgroundColor: 'white',
          borderRadius: 3,
          width: { xs: '100%', lg: '400px' },
          flexShrink: 0,
          minHeight: { xs: '300px', sm: '400px', lg: '600px' }
        }}>
          <CardContent sx={{ 
            height: '100%',
            display: 'flex', 
            flexDirection: 'column',
            p: { xs: 2, sm: 3, md: 4 },
            '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } }
          }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                fontWeight: 500, 
                mb: 2 
              }}
            >
              {selectedFilterSession ? 'Selected Session' : 'Active Sessions'}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                fullWidth
                size="small"
                options={sessions}
                getOptionLabel={(option) => 
                  `${option.session_id} - ${option.vehicle_id}`
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
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ fontSize: '1rem' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.session_id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        {option.session_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
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
            
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: '2px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#c1c1c1',
                borderRadius: '2px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#a8a8a8',
              },
            }}>
              {filteredSessions.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%',
                  color: 'text.secondary',
                  py: 4
                }}>
                  <Typography variant="body2">No sessions found</Typography>
                </Box>
              ) : (
                <Box>
                  {filteredSessions.map((session, index) => {
                    const key = session.session_id || `session-${index}`;
                    return (
                      <Card
                        key={key}
                        sx={{
                          mb: 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          },
                          '&:last-child': {
                            mb: 0
                          }
                        }}
                        onClick={() => handleSessionClick(session)}
                      >
                        <CardContent sx={{ 
                          py: 1.5, 
                          px: 2,
                          '&:last-child': { pb: 1.5 }
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" sx={{ 
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.875rem'
                              }}>
                                {session.vehicle_id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                fontSize: '0.75rem'
                              }}>
                                {session.session_id}
                              </Typography>
                            </Box>
                            <Chip
                              label={session.order_status === 'en_route' ? 'En Route' : 'Started'}
                              sx={{
                                backgroundColor: getStatusColor(session.order_status || 'started'),
                                color: 'white',
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                height: 24,
                                '& .MuiChip-label': {
                                  px: 1,
                                }
                              }}
                              size="small"
                            />
                          </Box>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {session.distance_to_destination_km ? `${session.distance_to_destination_km.toFixed(1)} km` : 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              ETA: {session.eta || 'N/A'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Mobile Session List FAB - Only show on mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="show sessions"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            backgroundColor: colorPalette.primary,
            '&:hover': {
              backgroundColor: colorPalette.primaryDark,
            },
            zIndex: 1000,
          }}
          onClick={() => setMobileSessionDrawerOpen(true)}
        >
          <ListIcon />
        </Fab>
      )}

      {/* Mobile Session Drawer */}
      {isMobile && (
        <SwipeableDrawer
          anchor="bottom"
          open={mobileSessionDrawerOpen}
          onClose={() => setMobileSessionDrawerOpen(false)}
          onOpen={() => setMobileSessionDrawerOpen(true)}
          sx={{
            '& .MuiDrawer-paper': {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80vh',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}>
              <Typography variant="h6">
                Active Sessions ({filteredSessions.length})
              </Typography>
              <IconButton
                onClick={() => setMobileSessionDrawerOpen(false)}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search sessions..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
              {filteredSessions.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  py: 4,
                  color: 'text.secondary'
                }}>
                  <Typography variant="body2">No sessions found</Typography>
                </Box>
              ) : (
                <List>
                  {filteredSessions.map((session, index) => {
                    const key = session.session_id || `session-${index}`;
                    return (
                      <ListItem key={key} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                          onClick={() => handleSessionClick(session)}
                          sx={{
                            borderRadius: 1,
                            border: '1px solid #e0e0e0',
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {session.vehicle_id}
                                </Typography>
                                <Chip
                                  label={session.order_status === 'en_route' ? 'En Route' : 'Started'}
                                  sx={{
                                    backgroundColor: getStatusColor(session.order_status || 'started'),
                                    color: 'white',
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    height: 20,
                                    '& .MuiChip-label': {
                                      px: 0.5,
                                    }
                                  }}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {session.session_id}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {session.distance_to_destination_km ? `${session.distance_to_destination_km.toFixed(1)} km` : 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ETA: {session.eta || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          </Box>
        </SwipeableDrawer>
      )}

      {/* Session Details Dialog */}
      <Dialog
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          }
        }}
      >
        {selectedSession && (
          <>
            <DialogTitle sx={{ 
              pb: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                Session Details - {selectedSession.session_id}
              </Box>
              <IconButton
                onClick={() => setSelectedSession(null)}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                gap: 2 
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Vehicle ID</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedSession.vehicle_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Order ID</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedSession.order_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedSession.order_status === 'en_route' ? 'En Route' : 'Started'}
                    icon={getStatusIcon(selectedSession.order_status || 'started')}
                    sx={{
                      backgroundColor: getStatusColor(selectedSession.order_status || 'started'),
                      color: 'white',
                      fontWeight: 500,
                      mt: 0.5
                    }}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Distance</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedSession.distance_to_destination_km ? `${selectedSession.distance_to_destination_km.toFixed(1)} km` : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Speed</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedSession.avg_speed_kmh ? `${selectedSession.avg_speed_kmh.toFixed(1)} km/h` : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ETA</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedSession.eta || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Start Time</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedSession.start_time ? new Date(selectedSession.start_time).toLocaleTimeString() : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Elapsed Time</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedSession.elapsed_time || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button 
                onClick={() => setSelectedSession(null)}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
} 