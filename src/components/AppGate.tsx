'use client';
import { ReactNode } from 'react';
import { useApp } from '@/context/AppContext';
import AuthScreen from './AuthScreen';
import SetupScreen from './SetupScreen';

export default function AppGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, hasWorkspace } = useApp();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthScreen />;
  if (!hasWorkspace) return <SetupScreen />;
  return <>{children}</>;
}
