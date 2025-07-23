'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Speed,
  LocalShipping,
  Timeline,
  Assessment,
} from '@mui/icons-material';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

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

interface AnalyticsProps {
  sessions: Session[];
  stats: Stats;
  loading: boolean;
  error: string | null;
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
  },
];

const mockStats: Stats = {
  total_sessions: 156,
  active_sessions: 5,
  total_distance_km: 1247.8,
  avg_speed_kmh: 42.6,
  total_vehicles: 25,
  vehicles_in_use: 5,
  total_completed_trips: 151,
};

export default function Analytics({ sessions, stats, loading, error }: AnalyticsProps) {
  // Use mock data instead of props
  const displaySessions = mockSessions;
  const displayStats = mockStats;

  // Mock data for analytics charts
  const performanceData = [
    { time: '00:00', speed: 45, efficiency: 85 },
    { time: '04:00', speed: 52, efficiency: 88 },
    { time: '08:00', speed: 48, efficiency: 82 },
    { time: '12:00', speed: 55, efficiency: 90 },
    { time: '16:00', speed: 58, efficiency: 92 },
    { time: '20:00', speed: 50, efficiency: 87 },
    { time: '24:00', speed: 47, efficiency: 84 },
  ];

  const fleetUtilizationData = [
    { name: 'Active', value: displayStats.vehicles_in_use, color: '#2196f3' },
    { name: 'Available', value: Math.max(0, displayStats.total_vehicles - displayStats.vehicles_in_use), color: '#4caf50' },
    { name: 'Maintenance', value: Math.floor(displayStats.total_vehicles * 0.1), color: '#ff9800' },
  ];

  const speedDistributionData = displaySessions.slice(0, 10).map(s => ({
    vehicle: s.vehicle_id.slice(-4),
    speed: s.avg_speed_kmh,
    distance: s.distance_to_destination_km,
  }));

  const efficiencyMetrics = [
    {
      title: 'Fleet Utilization',
      value: `${((displayStats.vehicles_in_use / displayStats.total_vehicles) * 100).toFixed(1)}%`,
      trend: '+5.2%',
      trendUp: true,
      icon: <LocalShipping />,
      color: 'primary.main',
    },
    {
      title: 'Average Speed',
      value: `${displayStats.avg_speed_kmh.toFixed(1)} km/h`,
      trend: '+2.1%',
      trendUp: true,
      icon: <Speed />,
      color: 'success.main',
    },
    {
      title: 'Trip Completion Rate',
      value: `${((displayStats.total_completed_trips / displayStats.total_sessions) * 100).toFixed(1)}%`,
      trend: '+1.8%',
      trendUp: true,
      icon: <Timeline />,
      color: 'warning.main',
    },
    {
      title: 'Distance Efficiency',
      value: `${(displayStats.total_distance_km / displayStats.total_sessions).toFixed(1)} km/trip`,
      trend: '-0.5%',
      trendUp: false,
      icon: <Assessment />,
      color: 'error.main',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Performance Metrics */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        <Card sx={{ backgroundColor: 'white' }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Fleet Utilization
            </Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {Math.round((displayStats.vehicles_in_use / displayStats.total_vehicles) * 100)}%
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              +5.2% from last week
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: 'white' }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Average Speed
            </Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {displayStats.avg_speed_kmh.toFixed(1)} km/h
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              +2.1% from last week
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: 'white' }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Completion Rate
            </Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {Math.round((displayStats.total_completed_trips / displayStats.total_sessions) * 100)}%
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              +1.8% from last week
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: 'white' }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Total Distance
            </Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {displayStats.total_distance_km.toFixed(0)} km
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              +12.3% from last week
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Charts */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        <Card sx={{ backgroundColor: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Speed Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={speedDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicle" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="speed" fill="#2196f3" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Distance vs Speed Correlation
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={speedDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicle" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="speed" stackId="1" stroke="#2196f3" fill="#2196f3" fillOpacity={0.6} />
                <Area type="monotone" dataKey="distance" stackId="2" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Fleet Utilization Details */}
      <Card sx={{ backgroundColor: 'white' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Fleet Status Overview
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
            gap: 3 
          }}>
            <Box>
              <Typography variant="subtitle2" color="primary.main">
                In Use
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {displayStats.vehicles_in_use}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active vehicles
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="success.main">
                Available
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {displayStats.total_vehicles - displayStats.vehicles_in_use}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ready for dispatch
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="warning.main">
                Maintenance
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                2
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Under service
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Key Insights
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                🚀 Performance Highlights
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fleet utilization has improved by 5.2% this month, with average speeds increasing by 2.1%. 
                Trip completion rates remain strong at {((displayStats.total_completed_trips / displayStats.total_sessions) * 100).toFixed(1)}%.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                ⚠️ Areas for Improvement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Distance efficiency has decreased slightly by 0.5%. Consider optimizing routes and 
                reducing idle time to improve overall fleet performance.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                📈 Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Implement predictive maintenance schedules and optimize route planning algorithms 
                to further improve fleet efficiency and reduce operational costs.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 