'use client';

import React, { useState, useEffect } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
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
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { ApiService } from '../utils/api';

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



export default function Analytics({ sessions, stats, loading, error }: AnalyticsProps) {
  // State for time period and analytics data
  const [timePeriod, setTimePeriod] = useState('day');
  const [analyticsData, setAnalyticsData] = useState<{
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
  } | null>(null);

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
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
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
          setAnalyticsData(response.data as any);
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
    return Math.ceil(maxValue * 2);
  };

  // Peak hour analysis data (24-hour cycle) - will be replaced by real data
  const peakHourData = analyticsData ? analyticsData.peakHourData : [
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
          sx={{
            backgroundColor: 'white',
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: 2,
              px: 3,
              py: 1,
                          '&.Mui-selected': {
              backgroundColor: '#fe4e50',
              color: 'white',
              '&:hover': {
                backgroundColor: '#e63946',
              },
            },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            },
          }}
        >
          <ToggleButton value="day" aria-label="day">
            <Today sx={{ mr: 1, fontSize: 20 }} />
            Day
          </ToggleButton>
          <ToggleButton value="week" aria-label="week">
            <ViewWeek sx={{ mr: 1, fontSize: 20 }} />
            Week
          </ToggleButton>
          <ToggleButton value="month" aria-label="month">
            <CalendarMonth sx={{ mr: 1, fontSize: 20 }} />
            Month
          </ToggleButton>
          <ToggleButton value="year" aria-label="year">
            <CalendarViewDay sx={{ mr: 1, fontSize: 20 }} />
            Year
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

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
              {analyticsLoading ? (
                <CircularProgress size={40} />
              ) : (
                <>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                    {analyticsData && analyticsData.completionRate > 0 ? `${analyticsData.completionRate}%` : '0%'}
                  </Typography>
                </>
              )}
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
              {analyticsLoading ? (
                <CircularProgress size={40} />
              ) : (
                <>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                    {analyticsData && analyticsData.peakHourActivity.peakHour ? analyticsData.peakHourActivity.peakHour : 'N/A'}
                  </Typography>
                </>
              )}
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
                <CircularProgress size={40} />
              ) : (
                <>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                    {analyticsData && analyticsData.avgDurationMinutes > 0 ? `${analyticsData.avgDurationMinutes}m` : '0m'}
                  </Typography>
                </>
              )}
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
                <CircularProgress size={40} />
              ) : (
                <>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#424242', mb: 0.5 }}>
                    {analyticsData && analyticsData.avgDistanceKm > 0 ? `${analyticsData.avgDistanceKm}km` : '0km'}
                  </Typography>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Peak Hour Periods */}
      <Card sx={{ backgroundColor: 'white', mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
            Peak Hour Periods
          </Typography>
          {analyticsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={300}>
              <CircularProgress />
            </Box>
          ) : (
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
                    interval={2}
                    minTickGap={10}
                  />
                <YAxis 
                  style={{ 
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    transition: 'none'
                  }}
                  domain={[0, getNextLogicalCeiling(Math.max(...peakHourData.map(d => d.deliveries))) || 20]}
                />
                <RechartsTooltip />
                                  <Area type="monotone" dataKey="deliveries" stroke={colorPalette.primary} fill={colorPalette.primary} fillOpacity={0.6} name="Deliveries" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        {/* Duration Distribution */}
        <Card sx={{ backgroundColor: 'white', borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
              Duration Distribution
            </Typography>
            {analyticsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData ? analyticsData.durationDistribution : []} margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid horizontal={true} vertical={false} stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="duration" 
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
                    domain={[0, getNextLogicalCeiling(Math.max(...(analyticsData ? analyticsData.durationDistribution.map(d => d.count) : [0]))) || 20]}
                  />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill={colorPalette.primaryVeryDark} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Average Completion Time by Hour */}
        <Card sx={{ backgroundColor: 'white', borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
              Average Completion Time by {timePeriod === 'day' ? 'Hour' : timePeriod === 'week' ? 'Day' : timePeriod === 'month' ? 'Day of Month' : 'Month'}
            </Typography>
            <Box sx={{ 
              '& .recharts-cartesian-axis-tick': { 
                transition: 'none !important',
                animation: 'none !important'
              },
              '& .recharts-cartesian-axis': {
                transition: 'none !important'
              },
              '& .recharts-text': {
                transition: 'none !important',
                animation: 'none !important'
              }
            }}>
              {analyticsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <CircularProgress />
                </Box>
              ) : (
                              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={analyticsData ? analyticsData.completionTimeByPeriod : []} 
                  margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
                >
                  <CartesianGrid horizontal={true} vertical={false} stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="timeUnit" 
                    style={{ 
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      transition: 'none'
                    }}
                    tick={{ fontSize: 12 }}
                    interval={timePeriod === 'day' ? 2 : timePeriod === 'month' ? 2 : 0}
                    minTickGap={10}
                  />
                  <YAxis 
                    style={{ 
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      transition: 'none'
                    }}
                    domain={[0, getNextLogicalCeiling(Math.max(...(analyticsData ? analyticsData.completionTimeByPeriod.map((d: any) => d.avgTime) : [0]))) || 20]}
                  />
                  <RechartsTooltip />
                  <Bar 
                    dataKey="avgTime" 
                    fill={colorPalette.tertiary}
                    style={{ transition: 'none' }}
                  />
                </BarChart>
              </ResponsiveContainer>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Top Performers */}
      <Card sx={{ backgroundColor: 'white', mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
            Top Performers
          </Typography>
          <List>
            {analyticsData && analyticsData.topPerformers && analyticsData.topPerformers.length > 0 ? (
              analyticsData.topPerformers.map((performer, index) => (
                <React.Fragment key={performer.vehicleId}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#2196f3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {index === 0 ? <EmojiEvents sx={{ color: 'white', fontSize: 20 }} /> : index === 1 ? <WorkspacePremium sx={{ color: 'white', fontSize: 20 }} /> : index === 2 ? <MilitaryTech sx={{ color: 'white', fontSize: 20 }} /> : index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Vehicle ({performer.vehicleId})
                          </Typography>
                          {index === 0 && <Star sx={{ color: '#ffd700', fontSize: 20 }} />}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {performer.trips} trips • {performer.totalKm.toFixed(1)} km total
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip 
                              label={`${(performer.completion * 100).toFixed(0)}% completion`} 
                              size="small" 
                              sx={{ 
                                borderColor: colorPalette.primary,
                                color: colorPalette.primary
                              }}
                              variant="outlined"
                            />
                            <Chip 
                              label={`${(performer.totalKm / performer.trips).toFixed(1)} km/trip`} 
                              size="small" 
                              sx={{ 
                                borderColor: colorPalette.primary,
                                color: colorPalette.primary
                              }}
                              variant="outlined"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                            {index === 0 && (
                              <>
                                <Chip 
                                  label="Champion" 
                                  size="small" 
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    backgroundColor: '#fff3cd',
                                    color: '#856404'
                                  }}
                                />
                                <Chip 
                                  label="MVP" 
                                  size="small" 
                                  sx={{ 
                                    fontSize: '0.7rem',
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
                                    fontSize: '0.7rem',
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2'
                                  }}
                                />
                                <Chip 
                                  label="Consistent" 
                                  size="small" 
                                  sx={{ 
                                    fontSize: '0.7rem',
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
                                    fontSize: '0.7rem',
                                    backgroundColor: '#fff3e0',
                                    color: '#f57c00'
                                  }}
                                />
                                <Chip 
                                  label="Reliable" 
                                  size="small" 
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    backgroundColor: '#e0f2f1',
                                    color: '#00695c'
                                  }}
                                />
                              </>
                            )}
                          </Box>
                        </Box>
                      }
                    />
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
      <Card sx={{ backgroundColor: 'white', mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 2, ml: 1 }}>
            Fleet Status
          </Typography>
          <Box display="flex" justifyContent="space-evenly" alignItems="center" mt={2} gap={6}>
            <Box textAlign="center">
                              <Typography variant="h5" fontWeight="bold" color={colorPalette.primaryVeryDark}>
                  {analyticsData && analyticsData.fleetStatus.activeVehicles > 0 ? analyticsData.fleetStatus.activeVehicles : 0}
                </Typography>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight="bold" color={colorPalette.secondary}>
                {analyticsData && analyticsData.fleetStatus.availableVehicles > 0 ? analyticsData.fleetStatus.availableVehicles : 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight="bold" color={colorPalette.accent}>
                {analyticsData && analyticsData.fleetStatus.maintenanceVehicles > 0 ? analyticsData.fleetStatus.maintenanceVehicles : 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Maintenance
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 