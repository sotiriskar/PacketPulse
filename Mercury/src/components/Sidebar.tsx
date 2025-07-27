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
  MeetingRoom,
} from '@mui/icons-material';
import Image from 'next/image';

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onLogout: () => void;
}

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;

const menuItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Dashboard />,
    description: 'KPIs and metrics'
  },
  {
    id: 'map',
    label: 'Live Map',
    icon: <Map />,
    description: 'Real-time session tracking'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <Analytics />,
    description: 'Performance analytics'
  },
];

export default function Sidebar({ selectedTab, onTabChange, isCollapsed, onLogout }: SidebarProps) {
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
        p: 1,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        minHeight: 80
      }}>
        {isCollapsed ? (
          <Image
            src="/images/favicon.png"
            alt="PacketPulse"
            width={50}
            height={50}
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
        px: 1, 
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
                  height: 48,
                  px: isCollapsed ? 1 : 2,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  width: '100%',
                  overflow: 'hidden',
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
                    minWidth: isCollapsed ? 32 : 40,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& .MuiSvgIcon-root': {
                      fontSize: isCollapsed ? '1.25rem' : '1.5rem',
                    }
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText 
                    primary={item.label}
                    secondary={item.description}
                    sx={{
                      ml: 1,
                      overflow: 'hidden',
                      '& .MuiListItemText-primary': {
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.5,
                      },
                      '& .MuiListItemText-secondary': {
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        fontSize: '0.65rem',
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
        p: 1,
        flexShrink: 0
      }}>
        <Divider sx={{ mb: 2 }} />
        <List sx={{ px: 0 }}>
          <ListItem disablePadding>
            <Tooltip 
              title={isCollapsed ? "Settings" : ''} 
              placement="right"
              disableHoverListener={!isCollapsed}
            >
              <ListItemButton 
                onClick={() => onTabChange('settings')}
                selected={selectedTab === 'settings'}
                sx={{
                  borderRadius: 2,
                  height: 48,
                  px: isCollapsed ? 1 : 2,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  width: '100%',
                  overflow: 'hidden',
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
                <ListItemIcon sx={{
                  color: selectedTab === 'settings' ? 'inherit' : theme.palette.text.secondary,
                  minWidth: isCollapsed ? 32 : 40,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& .MuiSvgIcon-root': {
                    fontSize: isCollapsed ? '1.25rem' : '1.5rem',
                  }
                }}>
                  <Settings />
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText 
                    primary="Settings"
                    sx={{
                      ml: 1,
                      overflow: 'hidden',
                      '& .MuiListItemText-primary': {
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
          <ListItem disablePadding>
            <Tooltip 
              title={isCollapsed ? "Logout" : ''} 
              placement="right"
              disableHoverListener={!isCollapsed}
            >
              <ListItemButton 
                onClick={onLogout}
                sx={{
                  borderRadius: 2,
                  height: 48,
                  px: isCollapsed ? 1 : 2,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  color: theme.palette.text.secondary,
                  width: '100%',
                  overflow: 'hidden',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: isCollapsed ? 32 : 40,
                  margin: 0,
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& .MuiSvgIcon-root': {
                    fontSize: isCollapsed ? '1.25rem' : '1.5rem',
                  }
                }}>
                  <MeetingRoom />
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText 
                    primary="Logout"
                    sx={{
                      ml: 1,
                      overflow: 'hidden',
                      '& .MuiListItemText-primary': {
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
} 