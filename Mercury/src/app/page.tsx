'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';

import { ApiService } from '@/utils/api';
import Sidebar from '@/components/Sidebar';
import Overview from '@/components/Overview';
import LiveMap from '@/components/LiveMap';
import Analytics from '@/components/Analytics';

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

interface Stats {
  total_sessions: number;
  total_orders: number;
  total_fleet: number;
  total_distance: number;
}

// Remove mock sessions - we'll use real data from API

// Remove mock stats - we'll use real data from API

export default function Dashboard() {
  const theme = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_sessions: 0,
    total_orders: 0,
    total_fleet: 0,
    total_distance: 0
  });
  const [chartData, setChartData] = useState({
    distanceData: [],
    sessionData: []
  });
  const [trends, setTrends] = useState({
    today: { total_sessions: 0, total_orders: 0, total_fleet: 0, total_distance: 0 },
    yesterday: { total_sessions: 0, total_orders: 0, total_fleet: 0, total_distance: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [healthStatus, setHealthStatus] = useState<'connected' | 'disconnected'>('connected');

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [trendsResponse, sessionsResponse, activeSessionsResponse, chartsResponse] = await Promise.all([
        ApiService.getTrends(),
        ApiService.getRecentSessions(),
        ApiService.getActiveSessions(),
        fetch('/api/charts').then(res => res.json())
      ]);
      
      // Update trends data
      if (trendsResponse.success && trendsResponse.data) {
        const trendsData = trendsResponse.data as any;
        setTrends(trendsData);
        setStats(trendsData.today || {
          total_sessions: 0,
          total_orders: 0,
          total_fleet: 0,
          total_distance: 0
        });
      } else {
        // Show empty stats when API is down
        setTrends({
          today: { total_sessions: 0, total_orders: 0, total_fleet: 0, total_distance: 0 },
          yesterday: { total_sessions: 0, total_orders: 0, total_fleet: 0, total_distance: 0 }
        });
        setStats({
          total_sessions: 0,
          total_orders: 0,
          total_fleet: 0,
          total_distance: 0
        });
      }
      
      // Update sessions data
      if (sessionsResponse.success && sessionsResponse.data) {
        setSessions(sessionsResponse.data as Session[]);
      } else {
        // Show empty sessions when API is down
        setSessions([]);
      }
      
      // Update active sessions data for LiveMap
      if (activeSessionsResponse.success && activeSessionsResponse.data) {
        setActiveSessions(activeSessionsResponse.data as Session[]);
      } else {
        // Show empty active sessions when API is down
        setActiveSessions([]);
      }
      
      // Update chart data
      if (chartsResponse) {
        setChartData(chartsResponse);
      } else {
        setChartData({ distanceData: [], sessionData: [] });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      // Show empty data when API fails
      setTrends({
        today: { total_sessions: 0, total_orders: 0, total_fleet: 0, total_distance: 0 },
        yesterday: { total_sessions: 0, total_orders: 0, total_fleet: 0, total_distance: 0 }
      });
      setStats({
        total_sessions: 0,
        total_orders: 0,
        total_fleet: 0,
        total_distance: 0
      });
      setSessions([]);
      setActiveSessions([]);
      setChartData({ distanceData: [], sessionData: [] });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const checkHealth = async () => {
    try {
      const response = await ApiService.getHealth();
      setHealthStatus(response.success ? 'connected' : 'disconnected');
    } catch (error) {
      setHealthStatus('disconnected');
    }
  };

  useEffect(() => {
    fetchData();
    checkHealth();
    
    // Refresh data every 3 seconds without loading state
    const interval = setInterval(() => fetchData(false), 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSessionClick = (session: any) => {
    // Handle session click - could open a dialog or navigate to details
    console.log('Session clicked:', session);
  };

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <Overview
            sessions={sessions as any}
            stats={stats as any}
            chartData={chartData}
            trends={trends}
            loading={loading}
            error={error}
            onSessionClick={handleSessionClick}
          />
        );
      case 'map':
        return (
          <LiveMap
            sessions={activeSessions as any}
            loading={loading}
            error={error}
            onSessionClick={handleSessionClick}
          />
        );
      case 'analytics':
        return (
          <Analytics
            sessions={sessions as any}
            stats={stats as any}
            loading={loading}
            error={error}
          />
        );
      default:
        return (
          <Overview
            sessions={sessions as any}
            stats={stats as any}
            chartData={chartData}
            trends={trends}
            loading={loading}
            error={error}
            onSessionClick={handleSessionClick}
          />
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <Sidebar
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
      />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            backgroundColor: 'white',
            borderBottom: `1px solid ${theme.palette.divider}`,
            zIndex: (theme) => theme.zIndex.drawer + 1 
          }}
        >
          <Toolbar sx={{ minHeight: '64px', px: 3 }}>
            <Box sx={{ flexGrow: 1 }} />
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: healthStatus === 'connected' ? '#4caf50' : '#f44336',
                  animation: healthStatus === 'connected' ? 'subtlePulse 3s ease-in-out infinite' : 'none',
                  '@keyframes subtlePulse': {
                    '0%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.7, transform: 'scale(1.1)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                  },
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: healthStatus === 'connected' ? '#4caf50' : '#f44336',
                  fontWeight: 400,
                  fontSize: '0.875rem',
                }}
              >
                {healthStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
}
