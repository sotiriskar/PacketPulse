'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Refresh,
} from '@mui/icons-material';
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
  duration_seconds: number;
  total_distance_km: number;
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
  const [stats, setStats] = useState<Stats>({
    total_sessions: 0,
    total_orders: 0,
    total_fleet: 0,
    total_distance: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [healthStatus, setHealthStatus] = useState<'connected' | 'disconnected'>('connected');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch trends from API (includes today's stats)
      const trendsResponse = await ApiService.getTrends();
      if (trendsResponse.success && trendsResponse.data) {
        const trendsData = trendsResponse.data as any;
        setStats(trendsData.today || {
          total_sessions: 0,
          total_orders: 0,
          total_fleet: 0,
          total_distance: 0
        });
      } else {
        // Show empty stats when API is down
        setStats({
          total_sessions: 0,
          total_orders: 0,
          total_fleet: 0,
          total_distance: 0
        });
      }
      
      // Fetch recent sessions from API
      const sessionsResponse = await ApiService.getRecentSessions();
      if (sessionsResponse.success && sessionsResponse.data) {
        setSessions(sessionsResponse.data as Session[]);
      } else {
        // Show empty sessions when API is down
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      // Show empty data when API fails
      setStats({
        total_sessions: 0,
        total_orders: 0,
        total_fleet: 0,
        total_distance: 0
      });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

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
    // Disable auto-refresh for now since we're using mock data
    // const interval = setInterval(fetchData, 10000);
    // return () => clearInterval(interval);
  }, []);

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
            loading={loading}
            error={error}
            onSessionClick={handleSessionClick}
          />
        );
      case 'map':
        return (
          <LiveMap
            sessions={sessions as any}
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
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  ml: 2,
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
            </Box>
            
            <IconButton 
              onClick={fetchData}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Refresh />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
}
