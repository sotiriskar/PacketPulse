'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  DirectionsCar,
  Timeline,
  Speed,
  Visibility,
  Refresh,
  LocalShipping,
} from '@mui/icons-material';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ApiService } from '@/utils/api';

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
}

interface Stats {
  total_sessions: number;
  active_sessions: number;
  total_distance_km: number;
  avg_speed_kmh: number;
  total_vehicles: number;
  vehicles_in_use: number;
  total_completed_trips: number;
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_sessions: 0,
    active_sessions: 0,
    total_distance_km: 0,
    avg_speed_kmh: 0,
    total_vehicles: 0,
    vehicles_in_use: 0,
    total_completed_trips: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionsResponse, statsResponse] = await Promise.all([
        ApiService.getSessions(),
        ApiService.getSessionStats(),
      ]);

      if (sessionsResponse.success && sessionsResponse.data) {
        // Ensure data is an array
        const sessionsData = Array.isArray(sessionsResponse.data) 
          ? sessionsResponse.data as Session[]
          : [];
        setSessions(sessionsData);
      } else {
        setSessions([]);
      }

      if (statsResponse.success && statsResponse.data) {
        // Ensure stats data is properly typed
        const statsData = statsResponse.data as Stats;
        setStats({
          total_sessions: statsData.total_sessions || 0,
          active_sessions: statsData.active_sessions || 0,
          total_distance_km: statsData.total_distance_km || 0,
          avg_speed_kmh: statsData.avg_speed_kmh || 0,
          total_vehicles: statsData.total_vehicles || 0,
          vehicles_in_use: statsData.vehicles_in_use || 0,
          total_completed_trips: statsData.total_completed_trips || 0,
        });
      } else {
        setStats({
          total_sessions: 0,
          active_sessions: 0,
          total_distance_km: 0,
          avg_speed_kmh: 0,
          total_vehicles: 0,
          vehicles_in_use: 0,
          total_completed_trips: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load dashboard data');
      // Set default values on error
      setSessions([]);
      setStats({
        total_sessions: 0,
        active_sessions: 0,
        total_distance_km: 0,
        avg_speed_kmh: 0,
        total_vehicles: 0,
        vehicles_in_use: 0,
        total_completed_trips: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

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

  const chartData = [
    { name: 'Active Sessions', value: stats.active_sessions || 0, color: '#2196f3' },
    { name: 'Completed Trips', value: stats.total_completed_trips || 0, color: '#4caf50' },
    { name: 'Available Vehicles', value: Math.max(0, (stats.total_vehicles || 0) - (stats.vehicles_in_use || 0)), color: '#ff9800' },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PacketPulse Dashboard
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton color="inherit" onClick={fetchData}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* KPI Cards */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 250, flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <DirectionsCar sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Sessions
                  </Typography>
                  <Typography variant="h4">
                    {stats.active_sessions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 250, flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocalShipping sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Vehicles
                  </Typography>
                  <Typography variant="h4">
                    {stats.total_vehicles}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 250, flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Timeline sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Distance
                  </Typography>
                  <Typography variant="h4">
                    {stats.total_distance_km.toFixed(1)} km
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 250, flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Speed sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Speed
                  </Typography>
                  <Typography variant="h4">
                    {stats.avg_speed_kmh.toFixed(1)} km/h
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Charts */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ flex: 1, minWidth: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fleet Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, minWidth: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Speed Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sessions.slice(0, 10).map(s => ({ 
                  vehicle: s.vehicle_id.slice(-4), 
                  speed: s.avg_speed_kmh 
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vehicle" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="speed" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Sessions Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active Sessions
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Session ID</TableCell>
                    <TableCell>Vehicle ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Distance to Destination</TableCell>
                    <TableCell>Avg Speed</TableCell>
                    <TableCell>Elapsed Time</TableCell>
                    <TableCell>ETA</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.session_id} hover>
                      <TableCell>{session.session_id}</TableCell>
                      <TableCell>{session.vehicle_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={session.order_status}
                          color={getStatusColor(session.order_status) as 'primary' | 'warning' | 'success' | 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{session.distance_to_destination_km.toFixed(2)} km</TableCell>
                      <TableCell>{session.avg_speed_kmh.toFixed(1)} km/h</TableCell>
                      <TableCell>{session.elapsed_time}</TableCell>
                      <TableCell>{session.eta}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleSessionClick(session)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>

      {/* Session Details Dialog */}
      <Dialog
        open={sessionDialogOpen}
        onClose={() => setSessionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Session Details - {selectedSession?.session_id}
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Vehicle ID:</strong> {selectedSession.vehicle_id}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Order ID:</strong> {selectedSession.order_id}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Status:</strong> 
                  <Chip
                    label={selectedSession.order_status}
                    color={getStatusColor(selectedSession.order_status) as 'primary' | 'warning' | 'success' | 'default'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Start Time:</strong> {new Date(selectedSession.start_time).toLocaleString()}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Last Update:</strong> {new Date(selectedSession.last_update_time).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Distance to Destination:</strong> {selectedSession.distance_to_destination_km.toFixed(2)} km
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Average Speed:</strong> {selectedSession.avg_speed_kmh.toFixed(1)} km/h
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Elapsed Time:</strong> {selectedSession.elapsed_time}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>ETA:</strong> {selectedSession.eta}
                </Typography>
              </Box>
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Location Map
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 300,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                  }}
                >
                  <Typography color="textSecondary">
                    Map component would show current location here
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
