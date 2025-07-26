'use client';

import React, { useMemo } from 'react';
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
  useMediaQuery,
} from '@mui/material';
import {
  North,
  South,
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
  primary: '#fe4e50',
  primaryLight: '#ff6b6d',
  primaryDark: '#d13a3c',
  primaryVeryDark: '#a82d2f',
  tertiary: '#ffb3a7',
  success: '#4caf50',
  successDark: '#388e3c',
  error: '#f44336',
  gray: '#9e9e9e',
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
    distanceData: Array<{ date: string; distance: number }>;
    sessionData: Array<{ date: string; sessions: number }>;
  };
  trends: {
    today: Stats;
    yesterday: Stats;
  };
  loading: boolean;
  error: string | null;
  onSessionClick: (session: Session) => void;
}

// KPI Card Component
const KPICard = ({ 
  title, 
  value, 
  trend, 
  unit = '' 
}: { 
  title: string; 
  value: number; 
  trend: number; 
  unit?: string; 
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  return (
    <Card sx={{ 
      height: { xs: 120, sm: 140, md: 165 },
      backgroundColor: 'white',
      borderRadius: 3,
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
      }
    }}>
      <CardContent sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        p: { xs: 1.5, sm: 2 },
        '&:last-child': { pb: { xs: 1.5, sm: 2 } }
      }}>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
            fontWeight: 500, 
            mb: 1 
          }}
        >
          {title}
        </Typography>
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography 
            variant="h3" 
            component="div" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#424242', 
              mb: 0.5,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}
          >
            {formatNumber(value)}{unit}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {trend >= 0 ? (
              <North sx={{ color: colorPalette.success, fontSize: '0.75rem', mr: 0.5 }} />
            ) : (
              <South sx={{ color: colorPalette.error, fontSize: '0.75rem', mr: 0.5 }} />
            )}
            <Typography 
              variant="caption" 
              sx={{ 
                color: trend >= 0 ? colorPalette.success : colorPalette.error, 
                fontWeight: 500,
                fontSize: { xs: '0.65rem', sm: '0.75rem' }
              }}
            >
              {trend >= 0 ? '+' : ''}{trend}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Chart Component
const ChartCard = ({ 
  title, 
  children, 
  height = 300 
}: { 
  title: string; 
  children: React.ReactElement; 
  height?: number; 
}) => (
  <Card sx={{ 
    backgroundColor: 'white', 
    borderRadius: 3,
    height: 'fit-content'
  }}>
    <CardContent sx={{ 
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
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export default function Overview({ 
  sessions, 
  stats, 
  chartData, 
  trends, 
  loading, 
  error, 
  onSessionClick 
}: OverviewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Memoized calculations
  const trendsData = useMemo(() => {
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      sessions: calculateTrend(stats.total_sessions, trends.yesterday.total_sessions),
      orders: calculateTrend(stats.total_orders, trends.yesterday.total_orders),
      fleet: calculateTrend(stats.total_fleet, trends.yesterday.total_fleet),
      distance: calculateTrend(stats.total_distance, trends.yesterday.total_distance),
    };
  }, [stats, trends.yesterday]);

  // Memoized chart data to prevent unnecessary re-renders
  const memoizedDistanceData = useMemo(() => {
    return chartData.distanceData || [];
  }, [JSON.stringify(chartData.distanceData)]);

  const memoizedSessionData = useMemo(() => {
    return chartData.sessionData || [];
  }, [JSON.stringify(chartData.sessionData)]);

  // Memoized chart components to prevent re-renders
  const distanceChart = useMemo(() => (
    <LineChart 
      key="weekly-distance-chart"
      data={memoizedDistanceData} 
      margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
    >
      <CartesianGrid horizontal={true} vertical={false} stroke="#e0e0e0" />
      <XAxis 
        dataKey="day" 
        style={{ 
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'inherit'
        }}
      />
      <YAxis 
        domain={[0, 'dataMax + 100']} 
        style={{ 
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'inherit'
        }}
      />
      <Tooltip 
        contentStyle={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          fontSize: isMobile ? '12px' : '14px'
        }}
      />
      <Line 
        type="monotone" 
        dataKey="distance" 
        stroke={colorPalette.primary}
        strokeWidth={2}
        dot={{ fill: colorPalette.primary, strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: colorPalette.primary, strokeWidth: 2 }}
      />
    </LineChart>
  ), [memoizedDistanceData, isMobile]);

  const sessionsChart = useMemo(() => (
    <BarChart 
      key="weekly-sessions-chart"
      data={memoizedSessionData} 
      margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
    >
      <CartesianGrid horizontal={true} vertical={false} stroke="#e0e0e0" />
      <XAxis 
        dataKey="day" 
        style={{ 
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'inherit'
        }}
      />
      <YAxis 
        domain={[0, 'dataMax + 10']} 
        style={{ 
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'inherit'
        }}
      />
      <Tooltip 
        contentStyle={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          fontSize: isMobile ? '12px' : '14px'
        }}
      />
      <Bar 
        dataKey="active" 
        fill={colorPalette.primaryVeryDark}
        radius={[4, 4, 0, 0]}
      />
      <Bar 
        dataKey="completed" 
        fill={colorPalette.tertiary}
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  ), [memoizedSessionData, isMobile]);

  const statusConfig = useMemo(() => ({
    en_route: { label: 'En Route', color: colorPalette.primary },
    started: { label: 'Started', color: colorPalette.primaryLight },
    completed: { label: 'Completed', color: colorPalette.success },
    default: { label: 'Unknown', color: colorPalette.gray },
  }), []);

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.default;
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography color="error" variant="body1">{error}</Typography>
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
      {/* KPI Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: 'repeat(2, 1fr)', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)' 
        }, 
        gap: { xs: 1.5, sm: 2, md: 3 }, 
        mb: { xs: 2, sm: 3, md: 4 } 
      }}>
        <KPICard 
          title="Sessions" 
          value={stats.total_sessions} 
          trend={trendsData.sessions} 
        />
        <KPICard 
          title="Orders" 
          value={stats.total_orders} 
          trend={trendsData.orders} 
        />
        <KPICard 
          title="Fleet" 
          value={stats.total_fleet} 
          trend={trendsData.fleet} 
        />
        <KPICard 
          title="Distance" 
          value={stats.total_distance} 
          trend={trendsData.distance} 
          unit=" km"
        />
      </Box>

      {/* Charts */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          md: 'repeat(2, 1fr)' 
        }, 
        gap: { xs: 1.5, sm: 2, md: 3 }, 
        mb: { xs: 2, sm: 3, md: 4 } 
      }}>
        <ChartCard title="Weekly Distance (km)" height={isMobile ? 250 : 300}>
          {distanceChart}
        </ChartCard>

        <ChartCard title="Weekly Sessions" height={isMobile ? 250 : 300}>
          {sessionsChart}
        </ChartCard>
      </Box>

      {/* Recent Sessions Table */}
      <Card sx={{ 
        backgroundColor: 'white', 
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <CardContent sx={{ 
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
            Recent Sessions
          </Typography>
          <Box sx={{ 
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: colorPalette.primary,
              borderRadius: '3px',
            },
          }}>
            <TableContainer component={Paper} elevation={0} sx={{ minWidth: isMobile ? 600 : 'auto' }}>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      whiteSpace: 'nowrap'
                    }}>
                      Session ID
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      whiteSpace: 'nowrap'
                    }}>
                      Vehicle ID
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      whiteSpace: 'nowrap'
                    }}>
                      Order ID
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      whiteSpace: 'nowrap'
                    }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      whiteSpace: 'nowrap'
                    }}>
                      Latest Activity
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions && sessions.length > 0 ? (
                    sessions.slice(0, 5).map((session) => {
                      const statusConfig = getStatusConfig(session.status);
                      return (
                        <TableRow 
                          key={session.session_id}
                          hover
                          onClick={() => onSessionClick(session)}
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease-in-out',
                            '&:hover': {
                              backgroundColor: 'rgba(254, 78, 80, 0.04)',
                            }
                          }}
                        >
                          <TableCell sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            fontFamily: 'monospace'
                          }}>
                            {session.session_id}
                          </TableCell>
                          <TableCell sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            fontFamily: 'monospace'
                          }}>
                            {session.vehicle_id}
                          </TableCell>
                          <TableCell sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            fontFamily: 'monospace'
                          }}>
                            {session.order_id}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusConfig.label}
                              sx={{
                                backgroundColor: statusConfig.color,
                                color: 'white',
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                height: { xs: 20, sm: 24 },
                                '&:hover': {
                                  backgroundColor: statusConfig.color,
                                  opacity: 0.9,
                                }
                              }}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            color: 'text.secondary'
                          }}>
                            {session.latest_activity}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No sessions available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 