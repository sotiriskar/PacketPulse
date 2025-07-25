'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  North,
  South,
  LocalShipping,
  Speed,
  Timeline,
  Assessment,
  DirectionsCar,
  CheckCircle,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

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

interface Session {
  session_id: string;
  vehicle_id: string;
  order_id: string;
  status: string;
  latest_activity: string;
}

interface Stats {
  total_sessions: number;
  total_orders: number;
  total_fleet: number;
  total_distance: number;
}

interface OverviewProps {
  sessions: Session[];
  stats: Stats;
  chartData: {
    distanceData: any[];
    sessionData: any[];
  };
  trends: {
    today: Stats;
    yesterday: Stats;
  };
  loading: boolean;
  error: string | null;
  onSessionClick: (session: Session) => void;
}

// Remove mock data - we'll use real data from props and API

export default function Overview({ sessions, stats, chartData, trends, loading, error, onSessionClick }: OverviewProps) {
  const theme = useTheme();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Add CSS to prevent chart text flickering
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .recharts-text {
        transition: none !important;
        animation: none !important;
      }
      .recharts-cartesian-axis-tick-value {
        transition: none !important;
        animation: none !important;
      }
      .recharts-cartesian-axis-label {
        transition: none !important;
        animation: none !important;
      }
      .recharts-cartesian-axis-tick {
        transition: none !important;
        animation: none !important;
      }
      .recharts-cartesian-axis {
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Use real data from props
  const displaySessions = sessions;
  const displayStats = stats;

  // Format numbers with K notation
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(2).replace(/\.?0+$/, '') + 'K';
    }
    return num.toString();
  };

  // Calculate trend percentages
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const sessionsTrend = calculateTrend(displayStats.total_sessions, trends.yesterday.total_sessions);
  const ordersTrend = calculateTrend(displayStats.total_orders, trends.yesterday.total_orders);
  const fleetTrend = calculateTrend(displayStats.total_fleet, trends.yesterday.total_fleet);
  const distanceTrend = calculateTrend(displayStats.total_distance, trends.yesterday.total_distance);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_route':
        return 'primary';
      case 'started':
        return 'warning';
      case 'completed':
        return 'success'; // Keep green for completed
      default:
        return 'default';
    }
  };

  const getStatusChipStyle = (status: string) => {
    switch (status) {
      case 'en_route':
        return {
          backgroundColor: colorPalette.primary,
          color: 'white',
          '&:hover': {
            backgroundColor: colorPalette.primaryDark,
          }
        };
      case 'started':
        return {
          backgroundColor: colorPalette.primaryLight,
          color: 'white',
          '&:hover': {
            backgroundColor: colorPalette.primary,
          }
        };
      case 'completed':
        return {
          backgroundColor: '#4caf50', // Keep green for completed
          color: 'white',
          '&:hover': {
            backgroundColor: '#388e3c',
          }
        };
      default:
        return {
          backgroundColor: '#9e9e9e',
          color: 'white',
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_route':
        return 'En Route';
      case 'started':
        return 'Started';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* KPI Cards */}
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
              Sessions
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                {displayStats.total_sessions > 0 ? formatNumber(displayStats.total_sessions) : '-'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {sessionsTrend >= 0 ? (
                  <North sx={{ color: '#4caf50', fontSize: '0.75rem', mr: 0.5 }} />
                ) : (
                  <South sx={{ color: '#f44336', fontSize: '0.75rem', mr: 0.5 }} />
                )}
                <Typography variant="caption" sx={{ 
                  color: sessionsTrend >= 0 ? '#4caf50' : '#f44336', 
                  fontWeight: 500 
                }}>
                  {sessionsTrend >= 0 ? '+' : ''}{sessionsTrend}%
                </Typography>
              </Box>
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
              Orders
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                {displayStats.total_orders > 0 ? formatNumber(displayStats.total_orders) : '-'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {ordersTrend >= 0 ? (
                  <North sx={{ color: '#4caf50', fontSize: '0.75rem', mr: 0.5 }} />
                ) : (
                  <South sx={{ color: '#f44336', fontSize: '0.75rem', mr: 0.5 }} />
                )}
                <Typography variant="caption" sx={{ 
                  color: ordersTrend >= 0 ? '#4caf50' : '#f44336', 
                  fontWeight: 500 
                }}>
                  {ordersTrend >= 0 ? '+' : ''}{ordersTrend}%
                </Typography>
              </Box>
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
              Fleet
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                {displayStats.total_fleet > 0 ? formatNumber(displayStats.total_fleet) : '-'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {fleetTrend >= 0 ? (
                  <North sx={{ color: '#4caf50', fontSize: '0.75rem', mr: 0.5 }} />
                ) : (
                  <South sx={{ color: '#f44336', fontSize: '0.75rem', mr: 0.5 }} />
                )}
                <Typography variant="caption" sx={{ 
                  color: fleetTrend >= 0 ? '#4caf50' : '#f44336', 
                  fontWeight: 500 
                }}>
                  {fleetTrend >= 0 ? '+' : ''}{fleetTrend}%
                </Typography>
              </Box>
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
              Distance (km)
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                {displayStats.total_distance > 0 ? formatNumber(displayStats.total_distance) : '-'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {distanceTrend >= 0 ? (
                  <North sx={{ color: '#4caf50', fontSize: '0.75rem', mr: 0.5 }} />
                ) : (
                  <South sx={{ color: '#f44336', fontSize: '0.75rem', mr: 0.5 }} />
                )}
                <Typography variant="caption" sx={{ 
                  color: distanceTrend >= 0 ? '#4caf50' : '#f44336', 
                  fontWeight: 500 
                }}>
                  {distanceTrend >= 0 ? '+' : ''}{distanceTrend}%
                </Typography>
              </Box>
            </Box>
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
        <Card sx={{ backgroundColor: 'white', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
              Weekly Distance (km)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.distanceData} margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
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
                  domain={[0, 2000]} 
                  style={{ 
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    transition: 'none'
                  }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="distance" 
                  stroke={colorPalette.primary}
                  strokeWidth={2}
                  style={{ transition: 'none' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: 'white', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
              Weekly Sessions
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.sessionData} margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
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
                  domain={[0, 200]} 
                  style={{ 
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    transition: 'none'
                  }}
                />
                <Tooltip />
                <Bar 
                  dataKey="active" 
                  fill={colorPalette.primaryVeryDark}
                  style={{ transition: 'none' }}
                />
                <Bar 
                  dataKey="completed" 
                  fill={colorPalette.tertiary}
                  style={{ transition: 'none' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Sessions Table */}
      <Card sx={{ backgroundColor: 'white', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
            Recent Sessions
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
                              <TableHead>
                  <TableRow>
                    <TableCell>Session ID</TableCell>
                    <TableCell>Vehicle ID</TableCell>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Latest Activity</TableCell>
                  </TableRow>
                </TableHead>
              <TableBody>
                {displaySessions && displaySessions.length > 0 ? (
                  displaySessions.slice(0, 5).map((session) => (
                    <TableRow 
                      key={session.session_id}
                      hover
                      onClick={() => onSessionClick(session)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{session.session_id}</TableCell>
                      <TableCell>{session.vehicle_id}</TableCell>
                      <TableCell>{session.order_id}</TableCell>
                      <TableCell>
                                              <Chip
                        label={getStatusLabel(session.status)}
                        sx={getStatusChipStyle(session.status)}
                        size="small"
                      />
                      </TableCell>
                      <TableCell>{session.latest_activity}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No data available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
} 