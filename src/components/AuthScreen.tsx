'use client';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';

type Step = 'email' | 'pin' | 'confirm';
type Mode = 'login' | 'register';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

export default function AuthScreen() {
  const { login, register } = useApp();
  const [step, setStep]     = useState<Step>('email');
  const [mode, setMode]     = useState<Mode>('login');
  const [email, setEmail]   = useState('');
  const [pin, setPin]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const firstPinRef         = useRef('');

  // Auto-submit when PIN reaches 6 digits
  useEffect(() => {
    if (pin.length !== 6) return;
    if (step === 'pin') {
      if (mode === 'login') {
        handleLogin();
      } else {
        firstPinRef.current = pin;
        setPin('');
        setStep('confirm');
        setError('');
      }
    } else if (step === 'confirm') {
      if (pin !== firstPinRef.current) {
        setError('Los PINs no coinciden — intentá de nuevo');
        setPin('');
        setStep('pin');
      } else {
        handleRegister(pin);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function handleKey(k: string) {
    if (loading) return;
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return; }
    if (k === '' || pin.length >= 6) return;
    setPin(p => p + k);
  }

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), pin);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(msg.includes('Invalid login credentials') ? 'Email o PIN incorrecto' : (msg || 'Error al ingresar'));
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(finalPin: string) {
    setLoading(true);
    setError('');
    try {
      await register(email.trim(), finalPin);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(msg.includes('already registered') ? 'Este email ya tiene una cuenta' : (msg || 'Error al crear cuenta'));
      setPin('');
      setStep('pin');
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setStep('email');
    setPin('');
    setError('');
    firstPinRef.current = '';
  }

  function toggleMode() {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
  }

  const pinTitle =
    step === 'confirm'    ? 'Confirmá tu PIN' :
    mode  === 'login'     ? 'Ingresá tu PIN' :
                            'Elegí un PIN de 6 dígitos';

  return (
    <div className="wrap">
      <div className="header">
        <h1 className="logo">gastly</h1>
        <p className="subtitle">La forma más rápida de trackear gastos</p>
      </div>

      {step === 'email' ? (
        <div className="form">
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              inputMode="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter' && isValidEmail(email)) setStep('pin'); }}
              autoComplete="email"
              autoFocus
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button
            className="btn"
            onClick={() => setStep('pin')}
            disabled={!isValidEmail(email)}
          >
            {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => { toggleMode(); }}
            disabled={!isValidEmail(email)}
          >
            {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
          </button>
        </div>
      ) : (
        <div className="pin-wrap">
          <button className="back-btn" onClick={goBack}>← volver</button>

          <div className="pin-header">
            <p className="pin-title">{pinTitle}</p>
            <p className="pin-subtitle">{email}</p>
          </div>

          <div className="dots">
            {Array.from({length: 6}).map((_, i) => (
              <span key={i} className={`dot ${i < pin.length ? 'dot--filled' : ''}`} />
            ))}
          </div>

          {error && (
            <div className="error-block">
              <p className="error error--center">{error}</p>
              {mode === 'login' && (
                <button className="recovery-btn" onClick={() => { setMode('register'); setPin(''); setError(''); }}>
                  ¿No tenés cuenta? Crear cuenta →
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading">
              <div className="spinner" />
            </div>
          ) : (
            <div className="keypad">
              {KEYS.map((k, i) => (
                <button
                  key={i}
                  className={`key ${k === '' ? 'key--empty' : ''} ${k === '⌫' ? 'key--del' : ''}`}
                  onClick={() => handleKey(k)}
                  disabled={loading}
                >
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .wrap { min-height: 100dvh; max-width: 480px; margin: 0 auto; padding: 64px 24px 32px; background: var(--bg); display: flex; flex-direction: column; }
        .header { text-align: center; margin-bottom: 48px; }
        .logo { font-size: 40px; font-weight: 800; color: var(--primary); letter-spacing: -1.5px; margin: 0 0 8px; }
        .subtitle { color: var(--text-secondary); font-size: 14px; margin: 0; }
        /* email step */
        .form { display: flex; flex-direction: column; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .input { border: 1.5px solid var(--border); border-radius: 10px; padding: 13px 14px; font-size: 16px; color: var(--text); background: var(--surface); transition: border-color 0.15s; }
        .input:focus { border-color: var(--primary); outline: none; }
        .btn { background: var(--primary); color: white; border: none; border-radius: 12px; padding: 15px; font-size: 16px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn--secondary { background: var(--surface); color: var(--text); border: 1.5px solid var(--border); }
        .error-block { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .recovery-btn { background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; }
        /* pin step */
        .pin-wrap { display: flex; flex-direction: column; align-items: center; }
        .back-btn { background: none; border: none; color: var(--text-secondary); font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 4px; padding: 0; cursor: pointer; align-self: flex-start; margin-bottom: 32px; }
        .pin-header { text-align: center; margin-bottom: 0; }
        .pin-title { font-size: 20px; font-weight: 700; color: var(--text); margin: 0 0 4px; }
        .pin-subtitle { font-size: 13px; color: var(--text-secondary); margin: 0; }
        .dots { display: flex; gap: 14px; justify-content: center; margin: 28px 0 12px; }
        .dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border); transition: all 0.15s; }
        .dot--filled { background: var(--primary); border-color: var(--primary); transform: scale(1.1); }
        .error { color: var(--danger); font-size: 13px; margin: 0; }
        .error--center { text-align: center; margin: 4px 0 8px; }
        .loading { display: flex; justify-content: center; padding: 48px 0; }
        .spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        /* keypad */
        .keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; max-width: 280px; margin-top: 16px; }
        .key { aspect-ratio: 1; border-radius: 50%; border: none; background: var(--surface); font-size: 22px; font-weight: 600; color: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,0.08); cursor: pointer; transition: background 0.1s; display: flex; align-items: center; justify-content: center; }
        .key:active { background: var(--border); }
        .key--empty { background: none; box-shadow: none; pointer-events: none; }
        .key--del { font-size: 18px; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}
