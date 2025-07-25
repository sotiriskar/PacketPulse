'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from './auth/page';

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (isAuthenticated && !loading) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, loading]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #fe4e50 0%, #ff6b6d 100%)',
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading...</div>
      </div>
    );
  }

  // If not authenticated, show auth page
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // This should not be reached, but just in case
  return null;
}
