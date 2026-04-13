'use client';
import { ReactNode } from 'react';
import { useApp } from '@/context/AppContext';
import AuthScreen from './AuthScreen';
import SetupScreen from './SetupScreen';

export default function AppGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, hasWorkspace } = useApp();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E8E8E8', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthScreen />;
  if (!hasWorkspace) return <SetupScreen />;
  return <>{children}</>;
}
