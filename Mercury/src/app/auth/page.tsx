'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import Signup from '@/components/Signup';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    const result = await login(email, password);
    
    if (result.success) {
      // Redirect to dashboard will be handled by the auth context
      window.location.href = '/dashboard';
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleSignup = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    const result = await signup(username, email, password);
    
    if (result.success) {
      // Redirect to dashboard will be handled by the auth context
      window.location.href = '/dashboard';
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleSwitchToSignup = () => {
    setIsLogin(false);
    setError(null);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
    setError(null);
  };

  return (
    <>
      {isLogin ? (
        <Login
          onLogin={handleLogin}
          onSwitchToSignup={handleSwitchToSignup}
          loading={loading}
          error={error}
        />
      ) : (
        <Signup
          onSignup={handleSignup}
          onSwitchToLogin={handleSwitchToLogin}
          loading={loading}
          error={error}
        />
      )}
    </>
  );
} 