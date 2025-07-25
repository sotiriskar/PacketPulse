'use client';

import React, { useState, useEffect } from 'react';
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
  useMediaQuery,
  IconButton,
  Tooltip,
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
  isCollapsed: boolean;
}

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;

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

export default function Sidebar({ selectedTab, onTabChange, isCollapsed }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const currentWidth = isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: currentWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          height: '100vh',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Box sx={{ 
        p: isCollapsed ? 1 : 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative'
      }}>
        {isCollapsed ? (
          <Image
            src="/images/favicon.png"
            alt="PacketPulse"
            width={70}
            height={70}
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <Image
            src="/images/logo.png"
            alt="PacketPulse Logo"
            width={210}
            height={50}
            style={{ objectFit: 'contain' }}
          />
        )}
        

      </Box>
      
      <Divider />
      
      <List sx={{ 
        px: isCollapsed ? 1 : 2, 
        py: 1, 
        mt: 2,
        flexGrow: 1,
        overflow: 'auto'
      }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <Tooltip 
              title={isCollapsed ? item.label : ''} 
              placement="right"
              disableHoverListener={!isCollapsed}
            >
              <ListItemButton
                onClick={() => onTabChange(item.id)}
                selected={selectedTab === item.id}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
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
                    minWidth: isCollapsed ? 'auto' : 40,
                    margin: 0,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && (
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
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ 
        mt: 'auto', 
        p: isCollapsed ? 1 : 2,
        flexShrink: 0
      }}>
        <Divider sx={{ mb: 2 }} />
        <List>
          <ListItem disablePadding>
            <Tooltip 
              title={isCollapsed ? "Notifications" : ''} 
              placement="right"
              disableHoverListener={!isCollapsed}
            >
              <ListItemButton sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
              }}>
                <ListItemIcon sx={{
                  minWidth: isCollapsed ? 'auto' : 40,
                  margin: 0,
                }}>
                  <Notifications />
                </ListItemIcon>
                {!isCollapsed && <ListItemText primary="Notifications" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
          <ListItem disablePadding>
            <Tooltip 
              title={isCollapsed ? "Settings" : ''} 
              placement="right"
              disableHoverListener={!isCollapsed}
            >
              <ListItemButton sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
              }}>
                <ListItemIcon sx={{
                  minWidth: isCollapsed ? 'auto' : 40,
                  margin: 0,
                }}>
                  <Settings />
                </ListItemIcon>
                {!isCollapsed && <ListItemText primary="Settings" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
} 