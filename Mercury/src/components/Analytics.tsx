'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Star
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

// Enhanced mock data with more realistic patterns
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

  // Peak hour analysis data (24-hour cycle)
  const peakHourData = [
    { hour: '00:00', deliveries: 2, idle_vehicles: 18 },
    { hour: '02:00', deliveries: 1, idle_vehicles: 19 },
    { hour: '04:00', deliveries: 0, idle_vehicles: 20 },
    { hour: '06:00', deliveries: 3, idle_vehicles: 17 },
    { hour: '08:00', deliveries: 8, idle_vehicles: 12 },
    { hour: '10:00', deliveries: 12, idle_vehicles: 8 },
    { hour: '12:00', deliveries: 15, idle_vehicles: 5 },
    { hour: '14:00', deliveries: 14, idle_vehicles: 6 },
    { hour: '16:00', deliveries: 16, idle_vehicles: 4 },
    { hour: '18:00', deliveries: 13, idle_vehicles: 7 },
    { hour: '20:00', deliveries: 9, idle_vehicles: 11 },
    { hour: '22:00', deliveries: 4, idle_vehicles: 16 },
  ];

  // Idle time analysis data
  const idleTimeData = [
    { day: 'Mon', idle_hours: 4.2, utilization: 82.5 },
    { day: 'Tue', idle_hours: 3.8, utilization: 84.2 },
    { day: 'Wed', idle_hours: 5.1, utilization: 78.7 },
    { day: 'Thu', idle_hours: 3.5, utilization: 85.4 },
    { day: 'Fri', idle_hours: 4.8, utilization: 80.0 },
    { day: 'Sat', idle_hours: 6.2, utilization: 74.2 },
    { day: 'Sun', idle_hours: 7.5, utilization: 68.8 },
  ];

  // Peak activity periods data
  const peakActivityData = [
    { period: 'Early AM (6-9)', activity: 23, efficiency: 85 },
    { period: 'Morning (9-12)', activity: 41, efficiency: 92 },
    { period: 'Lunch (12-14)', activity: 38, efficiency: 88 },
    { period: 'Afternoon (14-17)', activity: 45, efficiency: 90 },
    { period: 'Evening (17-20)', activity: 32, efficiency: 87 },
    { period: 'Night (20-23)', activity: 18, efficiency: 82 },
    { period: 'Late Night (23-6)', activity: 8, efficiency: 75 },
  ];

  // Top performers data
  const topPerformers = [
    {
      id: 'VH001',
      name: 'Vehicle Alpha',
      driver: 'John Smith',
      completionRate: 98.5,
      avgSpeed: 48.2,
      totalDeliveries: 156,
      badges: ['Speed Demon', 'Perfect Record'],
      avatar: '🚛',
    },
    {
      id: 'VH003',
      name: 'Vehicle Beta',
      driver: 'Sarah Johnson',
      completionRate: 96.8,
      avgSpeed: 45.7,
      totalDeliveries: 142,
      badges: ['Efficiency Expert', 'Safety First'],
      avatar: '🚚',
    },
    {
      id: 'VH007',
      name: 'Vehicle Gamma',
      driver: 'Mike Chen',
      completionRate: 95.2,
      avgSpeed: 43.1,
      totalDeliveries: 128,
      badges: ['Consistent Performer'],
      avatar: '🚛',
    },
  ];

  // Fleet utilization data
  const fleetUtilizationData = [
    { name: 'Active', value: displayStats.vehicles_in_use, color: '#2196f3' },
    { name: 'Available', value: Math.max(0, displayStats.total_vehicles - displayStats.vehicles_in_use), color: '#4caf50' },
    { name: 'Maintenance', value: Math.floor(displayStats.total_vehicles * 0.1), color: '#ff9800' },
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

      {/* Key Metrics - Keep Completion Rate */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        <Card sx={{ 
          height: 165,
          backgroundColor: 'white',
          borderRadius: 3,
          position: 'relative'
        }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, ml: 1 }}>
              Completion Rate
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                {Math.round((displayStats.total_completed_trips / displayStats.total_sessions) * 100)}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 500 }}>
                +1.8% from last week
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ 
          height: 165,
          backgroundColor: 'white',
          borderRadius: 3,
          position: 'relative'
        }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, ml: 1 }}>
              Peak Hour Activity
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                16
              </Typography>
              <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 500 }}>
                4-5 PM (Peak)
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ 
          height: 165,
          backgroundColor: 'white',
          borderRadius: 3,
          position: 'relative'
        }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, ml: 1 }}>
              Avg Idle Time
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                4.8h
              </Typography>
              <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 500 }}>
                Per vehicle/day
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ 
          height: 165,
          backgroundColor: 'white',
          borderRadius: 3,
          position: 'relative'
        }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, ml: 1 }}>
              Fleet Utilization
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                {Math.round((displayStats.vehicles_in_use / displayStats.total_vehicles) * 100)}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 500 }}>
                +5.2% from last week
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Peak Hour Analysis */}
      <Card sx={{ backgroundColor: 'white', mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
            Peak Hour Analysis
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={peakHourData} margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid horizontal={true} vertical={false} stroke="#e0e0e0" />
              <XAxis 
                dataKey="hour" 
                style={{ 
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  transition: 'none'
                }}
              />
              <YAxis 
                style={{ 
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  transition: 'none'
                }}
              />
              <RechartsTooltip />
              <Area type="monotone" dataKey="deliveries" stackId="1" stroke="#2196f3" fill="#2196f3" fillOpacity={0.6} name="Deliveries" />
              <Area type="monotone" dataKey="idle_vehicles" stackId="2" stroke="#ff9800" fill="#ff9800" fillOpacity={0.6} name="Idle" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        {/* Idle Time Analysis */}
        <Card sx={{ backgroundColor: 'white', borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
              Idle Time Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={idleTimeData} margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid horizontal={true} vertical={false} stroke="#e0e0e0" />
                <XAxis 
                  dataKey="day" 
                  style={{ 
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    transition: 'none'
                  }}
                />
                <YAxis 
                  style={{ 
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    transition: 'none'
                  }}
                />
                <RechartsTooltip />
                <Bar dataKey="idle_hours" fill="#ff9800" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Activity Periods */}
        <Card sx={{ backgroundColor: 'white', borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
              Peak Activity Periods
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={peakActivityData} margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid horizontal={true} vertical={false} stroke="#e0e0e0" />
                <XAxis 
                  dataKey="period" 
                  style={{ 
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    transition: 'none'
                  }}
                />
                <YAxis 
                  style={{ 
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    transition: 'none'
                  }}
                />
                <RechartsTooltip />
                <Line type="monotone" dataKey="activity" stroke="#2196f3" strokeWidth={3} name="Activity" />
                <Line type="monotone" dataKey="efficiency" stroke="#4caf50" strokeWidth={2} name="Efficiency" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Top Performers */}
      <Card sx={{ backgroundColor: 'white', mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
            Top Performers
          </Typography>
          <List>
            {topPerformers.map((performer, index) => (
              <React.Fragment key={performer.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#2196f3' }}>
                      {performer.avatar}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {performer.name}
                        </Typography>
                        {index === 0 && <Star sx={{ color: '#ffd700', fontSize: 20 }} />}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Driver: {performer.driver} • {performer.totalDeliveries} deliveries
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip 
                            label={`${performer.completionRate}% completion`} 
                            size="small" 
                            color="success" 
                            variant="outlined"
                          />
                          <Chip 
                            label={`${performer.avgSpeed} km/h avg`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                          {performer.badges.map((badge, badgeIndex) => (
                            <Chip 
                              key={badgeIndex}
                              label={badge} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.7rem',
                                backgroundColor: index === 0 ? '#fff3cd' : '#e3f2fd',
                                color: index === 0 ? '#856404' : '#1976d2'
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < topPerformers.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Fleet Status */}
      <Card sx={{ backgroundColor: 'white', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
            Fleet Status
          </Typography>
                      <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
              gap: 15 
            }}>
              <Box sx={{ textAlign: 'center' }}>
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
              <Box sx={{ textAlign: 'center' }}>
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
              <Box sx={{ textAlign: 'center' }}>
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
    </Box>
  );
} 