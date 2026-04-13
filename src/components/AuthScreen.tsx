'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const { login, register } = useApp();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Ingresá tu email');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      if (msg.includes('Invalid login credentials')) setError('Email o contraseña incorrectos');
      else if (msg.includes('already registered')) setError('Este email ya tiene una cuenta. Iniciá sesión.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="header">
        <h1 className="logo">gastly</h1>
        <p className="subtitle">La forma más rápida de trackear gastos</p>
      </div>

      <div className="tabs">
        <button className={`tab ${mode === 'login' ? 'tab--active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
          Iniciar sesión
        </button>
        <button className={`tab ${mode === 'register' ? 'tab--active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
          Registrarse
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label className="label">Contraseña</label>
          <input
            className="input"
            type="password"
            placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <style jsx>{`
        .wrap { min-height: 100dvh; max-width: 480px; margin: 0 auto; padding: 64px 24px 32px; background: var(--bg); display: flex; flex-direction: column; }
        .header { text-align: center; margin-bottom: 48px; }
        .logo { font-size: 40px; font-weight: 800; color: var(--primary); letter-spacing: -1.5px; margin: 0 0 8px; }
        .subtitle { color: var(--text-secondary); font-size: 14px; margin: 0; }
        .tabs { display: flex; background: var(--surface); border-radius: 12px; padding: 4px; margin-bottom: 24px; }
        .tab { flex: 1; padding: 10px; border: none; background: none; font-size: 14px; font-weight: 600; color: var(--text-secondary); border-radius: 9px; transition: all 0.15s; cursor: pointer; }
        .tab--active { background: var(--primary); color: white; }
        .form { display: flex; flex-direction: column; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .input { border: 1.5px solid var(--border); border-radius: 10px; padding: 13px 14px; font-size: 16px; color: var(--text); background: var(--surface); transition: border-color 0.15s; }
        .input:focus { border-color: var(--primary); outline: none; }
        .error { color: var(--danger); font-size: 13px; margin: 0; }
        .btn { background: var(--primary); color: white; border: none; border-radius: 12px; padding: 15px; font-size: 16px; font-weight: 700; margin-top: 4px; transition: opacity 0.15s; cursor: pointer; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
