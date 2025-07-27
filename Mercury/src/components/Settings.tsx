'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Delete,
  Save,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsProps {
  loading?: boolean;
  error?: string | null;
}

export default function Settings({ loading = false, error = null }: SettingsProps) {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    password: false,
    delete: false,
  });
  const [messages, setMessages] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordFieldChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleProfileSave = async () => {
    setLoadingStates(prev => ({ ...prev, profile: true }));
    setMessages(null);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        setMessages({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        setMessages({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessages({ type: 'error', text: 'An error occurred while updating profile' });
    } finally {
      setLoadingStates(prev => ({ ...prev, profile: false }));
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessages({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessages({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    setLoadingStates(prev => ({ ...prev, password: true }));
    setMessages(null);

    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsChangingPassword(false);
      } else {
        setMessages({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (error) {
      setMessages({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setLoadingStates(prev => ({ ...prev, password: false }));
    }
  };

  const handleAccountDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setMessages({ type: 'error', text: 'Please type DELETE to confirm account deletion' });
      return;
    }

    setLoadingStates(prev => ({ ...prev, delete: true }));
    setMessages(null);

    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        await logout();
        window.location.href = '/';
      } else {
        setMessages({ type: 'error', text: data.message || 'Failed to delete account' });
      }
    } catch (error) {
      setMessages({ type: 'error', text: 'An error occurred while deleting account' });
    } finally {
      setLoadingStates(prev => ({ ...prev, delete: false }));
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setIsEditing(false);
    setMessages(null);
  };

  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsChangingPassword(false);
    setMessages(null);
  };

    return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      backgroundColor: '#f5f5f5', 
      height: '100%',
      maxWidth: '100%',
      overflow: 'auto'
    }}>
      {/* Header */}
      <Box sx={{ mb: 4, flexShrink: 0 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700, 
            color: '#1a1a1a',
            fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
            mb: 1
          }}
        >
          Account Settings
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#666',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Manage your profile, security, and account preferences
        </Typography>
      </Box>

      {messages && (
        <Alert 
          severity={messages.type} 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            flexShrink: 0,
            '& .MuiAlert-icon': {
              fontSize: '1.25rem'
            }
          }}
          onClose={() => setMessages(null)}
        >
          {messages.text}
        </Alert>
      )}

      {/* Main Content Container */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        {/* Profile and Password Cards Row */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 2, sm: 3 },
          alignItems: 'flex-start'
        }}>
          {/* Profile Settings */}
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            backgroundColor: 'white'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Profile Information
                </Typography>
                {!isEditing ? (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setIsEditing(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      borderColor: '#fe4e50',
                      color: '#fe4e50',
                      '&:hover': {
                        borderColor: '#d13a3c',
                        backgroundColor: 'rgba(254, 78, 80, 0.04)',
                      },
                    }}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleProfileSave}
                                    disabled={loadingStates.profile}
              startIcon={loadingStates.profile ? <CircularProgress size={16} sx={{ color: '#fe4e50' }} /> : <Save />}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                        backgroundColor: '#fe4e50',
                        '&:hover': {
                          backgroundColor: '#d13a3c',
                        },
                        '&:disabled': {
                          backgroundColor: '#ccc',
                        },
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleCancelEdit}
                      disabled={loadingStates.profile}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Username"
                  value={profileData.username}
                  onChange={(e) => handleProfileChange('username', e.target.value)}
                  disabled={!isEditing}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.24)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#fe4e50',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#fe4e50',
                    },
                  }}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  disabled={!isEditing}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.24)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#fe4e50',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#fe4e50',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            backgroundColor: 'white'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Password
                </Typography>
                {!isChangingPassword ? (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setIsChangingPassword(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      borderColor: '#fe4e50',
                      color: '#fe4e50',
                      '&:hover': {
                        borderColor: '#d13a3c',
                        backgroundColor: 'rgba(254, 78, 80, 0.04)',
                      },
                    }}
                  >
                    Change Password
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handlePasswordChange}
                                    disabled={loadingStates.password}
              startIcon={loadingStates.password ? <CircularProgress size={16} sx={{ color: '#fe4e50' }} /> : <Save />}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                        backgroundColor: '#fe4e50',
                        '&:hover': {
                          backgroundColor: '#d13a3c',
                        },
                        '&:disabled': {
                          backgroundColor: '#ccc',
                        },
                      }}
                    >
                      Update Password
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleCancelPassword}
                      disabled={loadingStates.password}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>

              {isChangingPassword && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Current Password"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.12)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.24)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fe4e50',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#fe4e50',
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('current')}
                            edge="end"
                            sx={{ color: '#666' }}
                          >
                            {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="New Password"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.12)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.24)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fe4e50',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#fe4e50',
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('new')}
                            edge="end"
                            sx={{ color: '#666' }}
                          >
                            {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Confirm New Password"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.12)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.24)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fe4e50',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#fe4e50',
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('confirm')}
                            edge="end"
                            sx={{ color: '#666' }}
                          >
                            {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Account Deletion */}
        <Card sx={{ 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f44336',
          backgroundColor: 'white'
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Warning sx={{ color: '#f44336', fontSize: '1.5rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#f44336' }}>
                Danger Zone
              </Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 3, color: '#666', lineHeight: 1.6 }}>
              Once you delete your account, there is no going back. This action will permanently remove all your data and cannot be undone. Please be certain.
            </Typography>

            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: '#f44336',
                color: '#f44336',
                '&:hover': {
                  borderColor: '#d32f2f',
                  backgroundColor: 'rgba(244, 67, 54, 0.04)',
                },
              }}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#f44336',
          fontWeight: 600,
          fontSize: '1.25rem',
          pb: 1
        }}>
          Delete Account
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ mb: 2, color: '#666', lineHeight: 1.6 }}>
            This action cannot be undone. This will permanently delete your account and remove all your data.
          </Typography>
          <Typography sx={{ mb: 3, fontWeight: 600, color: '#1a1a1a' }}>
            To confirm, type <strong>DELETE</strong> in the box below:
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.12)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.24)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#f44336',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#f44336',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccountDelete}
            color="error"
            variant="contained"
                          disabled={deleteConfirmText !== 'DELETE' || loadingStates.delete}
              startIcon={loadingStates.delete ? <CircularProgress size={16} sx={{ color: '#fe4e50' }} /> : <Delete />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              backgroundColor: '#f44336',
              '&:hover': {
                backgroundColor: '#d32f2f',
              },
              '&:disabled': {
                backgroundColor: '#ccc',
              },
            }}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 