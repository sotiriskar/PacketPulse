'use client';

import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  Map,
  Analytics,
  Settings,
  Notifications,
} from '@mui/icons-material';
import Image from 'next/image';

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

const DRAWER_WIDTH = 280;

const menuItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Dashboard />,
    description: 'Dashboard overview and KPIs'
  },
  {
    id: 'map',
    label: 'Live Map',
    icon: <Map />,
    description: 'Real-time vehicle tracking'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <Analytics />,
    description: 'Performance analytics'
  },
];

export default function Sidebar({ selectedTab, onTabChange }: SidebarProps) {
  const theme = useTheme();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          src="/images/logo.png"
          alt="PacketPulse Logo"
          width={210}
          height={50}
          style={{ objectFit: 'contain' }}
        />
      </Box>
      
      <Divider />
      
      <List sx={{ px: 2, py: 1, mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => onTabChange(item.id)}
              selected={selectedTab === item.id}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: '#fe4e50',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#d13a3c',
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: selectedTab === item.id ? 'inherit' : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                secondary={item.description}
                secondaryTypographyProps={{
                  sx: {
                    fontSize: '0.75rem',
                    color: selectedTab === item.id ? 'inherit' : theme.palette.text.secondary,
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <Notifications />
              </ListItemIcon>
              <ListItemText primary="Notifications" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
} 