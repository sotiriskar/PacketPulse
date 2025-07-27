'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Star,
  Today,
  ViewWeek,
  CalendarMonth,
  CalendarViewDay,
  EmojiEvents,
  WorkspacePremium,
  MilitaryTech,
} from '@mui/icons-material';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { ApiService } from '../utils/api';

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

interface AnalyticsData {
  completionRate: number;
  peakHourActivity: {
    peakHour: string;
    peakCount: number;
  };
  peakHourData: Array<{
    hour: string;
    deliveries: number;
  }>;
  avgDurationMinutes: number;
  avgDistanceKm: number;
  durationDistribution: Array<{
    duration: string;
    count: number;
  }>;
  completionTimeByPeriod: Array<{
    timeUnit: string;
    avgTime: number;
  }>;
  fleetStatus: {
    activeVehicles: number;
    availableVehicles: number;
    maintenanceVehicles: number;
  };
  period: string;
  topPerformers: Array<{
    vehicleId: string;
    trips: number;
    totalKm: number;
    completion: number;
    firstSeen: string;
    lastUpdated: string;
  }>;
}

interface AnalyticsProps {
  sessions: Session[];
  stats: Stats;
  loading: boolean;
  error: string | null;
}

export default function Analytics({ loading, error }: AnalyticsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [timePeriod, setTimePeriod] = useState('day');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Fetch analytics data when time period changes
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      
      try {
        const response = await ApiService.getAnalytics(timePeriod);
        if (response.success && response.data) {
          setAnalyticsData(response.data as AnalyticsData);
        } else {
          setAnalyticsError(response.message || 'Failed to fetch analytics data');
        }
      } catch (err) {
        setAnalyticsError('Failed to fetch analytics data');
        console.error('Error fetching analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timePeriod]);

  // Handle time period change
  const handleTimePeriodChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriod: string | null,
  ) => {
    if (newPeriod !== null) {
      setTimePeriod(newPeriod);
    }
  };

  // Helper function to calculate next logical ceiling
  const getNextLogicalCeiling = (maxValue: number) => {
    if (maxValue <= 0) return 10;
    return Math.ceil(maxValue * 1.2);
  };

  // Memoized chart data to prevent unnecessary re-renders
  const memoizedPeakHourData = useMemo(() => {
    return analyticsData ? analyticsData.peakHourData : [
      { hour: '00:00', deliveries: 2 },
      { hour: '02:00', deliveries: 1 },
      { hour: '04:00', deliveries: 0 },
      { hour: '06:00', deliveries: 3 },
      { hour: '08:00', deliveries: 8 },
      { hour: '10:00', deliveries: 12 },
      { hour: '12:00', deliveries: 15 },
      { hour: '14:00', deliveries: 14 },
      { hour: '16:00', deliveries: 16 },
      { hour: '18:00', deliveries: 13 },
      { hour: '20:00', deliveries: 9 },
      { hour: '22:00', deliveries: 4 },
    ];
  }, [analyticsData]);

  const memoizedDurationData = useMemo(() => {
    return analyticsData ? analyticsData.durationDistribution : [];
  }, [analyticsData]);

  const memoizedCompletionTimeData = useMemo(() => {
    return analyticsData ? analyticsData.completionTimeByPeriod : [];
  }, [analyticsData]);

  // Memoized chart components to prevent re-renders
  const peakHourChart = useMemo(() => (
    <AreaChart 
      key="peak-hour-chart"
      data={memoizedPeakHourData} 
      margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
    >
      <CartesianGrid horizontal={true} vertical={false} stroke="#e0e0e0" />
      <XAxis 
        dataKey="hour" 
        style={{ 
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'inherit'
        }}
        interval={2}
        minTickGap={10}
      />
      <YAxis 
        style={{ 
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'inherit'
        }}
        domain={[0, getNextLogicalCeiling(Math.max(...memoizedPeakHourData.map(d => d.deliveries))) || 20]}
      />
      <RechartsTooltip 
        contentStyle={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          fontSize: isMobile ? '12px' : '14px'
        }}
      />
      <Area type="monotone" dataKey="deliveries" stroke={colorPalette.primary} fill={colorPalette.primary} fillOpacity={0.6} name="Deliveries" />
    </AreaChart>
  ), [memoizedPeakHourData, isMobile]);

  const durationChart = useMemo(() => (
    <BarChart 
      key="duration-chart"
      data={memoizedDurationData} 
      margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
    >
      <CartesianGrid horizontal={true} vertical={false} stroke="#e0e0e0" />
      <XAxis 
        dataKey="duration" 
        style={{ 
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'inherit'
        }}
      />
      <YAxis 
        style={{ 
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'inherit'
        }}
        domain={[0, getNextLogicalCeiling(Math.max(...memoizedDurationData.map(d => d.count))) || 20]}
      />
      <RechartsTooltip 
        contentStyle={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          fontSize: isMobile ? '12px' : '14px'
        }}
      />
      <Bar dataKey="count" fill={colorPalette.primaryVeryDark} name="Sessions" />
    </BarChart>
  ), [memoizedDurationData, isMobile]);

  const completionTimeChart = useMemo(() => (
    <BarChart 
      key="completion-time-chart"
      data={memoizedCompletionTimeData} 
      margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
    >
      <CartesianGrid horizontal={true} vertical={false} stroke="#e0e0e0" />
      <XAxis 
        dataKey="timeUnit" 
        style={{ 
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'inherit'
        }}
        interval={timePeriod === 'day' ? 2 : timePeriod === 'month' ? 2 : 0}
        minTickGap={10}
      />
      <YAxis 
        style={{ 
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'inherit'
        }}
        domain={[0, getNextLogicalCeiling(Math.max(...memoizedCompletionTimeData.map((d) => d.avgTime))) || 20]}
      />
      <RechartsTooltip 
        contentStyle={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          fontSize: isMobile ? '12px' : '14px'
        }}
      />
      <Bar dataKey="avgTime" fill={colorPalette.tertiary} />
    </BarChart>
  ), [memoizedCompletionTimeData, timePeriod, isMobile]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#fe4e50' }} />
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
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {analyticsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {analyticsError}
        </Alert>
      )}

      {/* Time Period Filter */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={timePeriod}
          exclusive
          onChange={handleTimePeriodChange}
          aria-label="time period"
          size={isMobile ? "small" : "medium"}
          sx={{
            backgroundColor: 'white',
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: 2,
              px: { xs: 2, sm: 3 },
              py: { xs: 0.5, sm: 1 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              '&.Mui-selected': {
                backgroundColor: colorPalette.primary,
                color: 'white',
                '&:hover': {
                  backgroundColor: colorPalette.primaryDark,
                },
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            },
          }}
        >
          <ToggleButton value="day" aria-label="day">
            <Today sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: 16, sm: 20 } }} />
            {!isMobile && 'Day'}
          </ToggleButton>
          <ToggleButton value="week" aria-label="week">
            <ViewWeek sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: 16, sm: 20 } }} />
            {!isMobile && 'Week'}
          </ToggleButton>
          <ToggleButton value="month" aria-label="month">
            <CalendarMonth sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: 16, sm: 20 } }} />
            {!isMobile && 'Month'}
          </ToggleButton>
          <ToggleButton value="year" aria-label="year">
            <CalendarViewDay sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: 16, sm: 20 } }} />
            {!isMobile && 'Year'}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Key Metrics */}
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
              Completion Rate
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {analyticsLoading ? (
                <CircularProgress size={40} sx={{ color: '#fe4e50' }} />
              ) : (
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
                  {analyticsData && analyticsData.completionRate > 0 ? `${analyticsData.completionRate}%` : '0%'}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

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
              Peak Hour
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {analyticsLoading ? (
                <CircularProgress size={40} sx={{ color: '#fe4e50' }} />
              ) : (
                <Typography 
                  variant="h4" 
                  component="div" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#424242', 
                    mb: 0.5,
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
                  }}
                >
                  {analyticsData && analyticsData.peakHourActivity.peakHour ? analyticsData.peakHourActivity.peakHour : 'N/A'}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

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
              Avg Duration
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {analyticsLoading ? (
                <CircularProgress size={40} sx={{ color: '#fe4e50' }} />
              ) : (
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
                  {analyticsData && analyticsData.avgDurationMinutes > 0 ? `${analyticsData.avgDurationMinutes}m` : '0m'}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

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
              Avg Distance
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {analyticsLoading ? (
                <CircularProgress size={40} sx={{ color: '#fe4e50' }} />
              ) : (
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
                  {analyticsData && analyticsData.avgDistanceKm > 0 ? `${analyticsData.avgDistanceKm}km` : '0km'}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Peak Hour Periods */}
      <Card sx={{ backgroundColor: 'white', mb: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } } }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
              fontWeight: 500, 
              mb: 2 
            }}
          >
            Peak Hour Periods
          </Typography>
          {analyticsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={isMobile ? 250 : 300}>
              <CircularProgress sx={{ color: '#fe4e50' }} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              {peakHourChart}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
        gap: { xs: 1.5, sm: 2, md: 3 }, 
        mb: { xs: 2, sm: 3, md: 4 } 
      }}>
        {/* Duration Distribution */}
        <Card sx={{ backgroundColor: 'white', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } } }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                fontWeight: 500, 
                mb: 2 
              }}
            >
              Duration Distribution
            </Typography>
            {analyticsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={isMobile ? 250 : 300}>
                <CircularProgress sx={{ color: '#fe4e50' }} />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                {durationChart}
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Average Completion Time by Period */}
        <Card sx={{ backgroundColor: 'white', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } } }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                fontWeight: 500, 
                mb: 2 
              }}
            >
              Average Completion Time by {timePeriod === 'day' ? 'Hour' : timePeriod === 'week' ? 'Day' : timePeriod === 'month' ? 'Day of Month' : 'Month'}
            </Typography>
            {analyticsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={isMobile ? 250 : 300}>
                <CircularProgress sx={{ color: '#fe4e50' }} />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                {completionTimeChart}
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Top Performers */}
      <Card sx={{ backgroundColor: 'white', mb: { xs: 2, sm: 3, md: 4 }, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } } }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
              fontWeight: 500, 
              mb: 2 
            }}
          >
            Top Performers
          </Typography>
          <List>
            {analyticsData && analyticsData.topPerformers && analyticsData.topPerformers.length > 0 ? (
              analyticsData.topPerformers.map((performer, index) => (
                <React.Fragment key={performer.vehicleId}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#2196f3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 }
                      }}>
                        {index === 0 ? <EmojiEvents sx={{ color: 'white', fontSize: { xs: 16, sm: 20 } }} /> : 
                         index === 1 ? <WorkspacePremium sx={{ color: 'white', fontSize: { xs: 16, sm: 20 } }} /> : 
                         index === 2 ? <MilitaryTech sx={{ color: 'white', fontSize: { xs: 16, sm: 20 } }} /> : 
                         index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ flex: 1, ml: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          Vehicle ({performer.vehicleId})
                        </Typography>
                        {index === 0 && <Star sx={{ color: '#ffd700', fontSize: { xs: 16, sm: 20 } }} />}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 1 }}>
                        {performer.trips} trips • {performer.totalKm.toFixed(1)} km total
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`${(performer.completion * 100).toFixed(0)}% completion`} 
                          size="small" 
                          sx={{ 
                            borderColor: colorPalette.primary,
                            color: colorPalette.primary,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' }
                          }}
                          variant="outlined"
                        />
                        <Chip 
                          label={`${(performer.totalKm / performer.trips).toFixed(1)} km/trip`} 
                          size="small" 
                          sx={{ 
                            borderColor: colorPalette.primary,
                            color: colorPalette.primary,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' }
                          }}
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {index === 0 && (
                          <>
                            <Chip 
                              label="Champion" 
                              size="small" 
                              sx={{ 
                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                backgroundColor: '#fff3cd',
                                color: '#856404'
                              }}
                            />
                            <Chip 
                              label="MVP" 
                              size="small" 
                              sx={{ 
                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                backgroundColor: '#e8f5e8',
                                color: '#2e7d32'
                              }}
                            />
                          </>
                        )}
                        {index === 1 && (
                          <>
                            <Chip 
                              label="Runner Up" 
                              size="small" 
                              sx={{ 
                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2'
                              }}
                            />
                            <Chip 
                              label="Consistent" 
                              size="small" 
                              sx={{ 
                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                backgroundColor: '#f3e5f5',
                                color: '#7b1fa2'
                              }}
                            />
                          </>
                        )}
                        {index === 2 && (
                          <>
                            <Chip 
                              label="Bronze" 
                              size="small" 
                              sx={{ 
                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                backgroundColor: '#fff3e0',
                                color: '#f57c00'
                              }}
                            />
                            <Chip 
                              label="Reliable" 
                              size="small" 
                              sx={{ 
                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                backgroundColor: '#e0f2f1',
                                color: '#00695c'
                              }}
                            />
                          </>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                  {index < analyticsData.topPerformers.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No top performers data available.
              </Typography>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Fleet Status */}
      <Card sx={{ 
        backgroundColor: 'white', 
        mb: { xs: 2, sm: 3, md: 4 }, 
        borderRadius: 3,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        }
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } } }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
              fontWeight: 500, 
              mb: 2 
            }}
          >
            Fleet Status
          </Typography>
          <Box display="flex" justifyContent="space-evenly" alignItems="center" mt={2} gap={{ xs: 2, sm: 4, md: 6 }}>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight="bold" color={colorPalette.primaryVeryDark} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {analyticsData && analyticsData.fleetStatus.activeVehicles > 0 ? analyticsData.fleetStatus.activeVehicles : 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Active
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight="bold" color={colorPalette.secondary} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {analyticsData && analyticsData.fleetStatus.availableVehicles > 0 ? analyticsData.fleetStatus.availableVehicles : 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Available
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight="bold" color={colorPalette.accent} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {analyticsData && analyticsData.fleetStatus.maintenanceVehicles > 0 ? analyticsData.fleetStatus.maintenanceVehicles : 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Maintenance
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 