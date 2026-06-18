'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

type Stage = 'loading' | 'invalid' | 'pin' | 'confirm' | 'saving' | 'done' | 'error';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('loading');
  const [pin, setPin]     = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Supabase recovery link puts tokens in the URL hash:
    // #access_token=...&refresh_token=...&type=recovery
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const type         = params.get('type');
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (type !== 'recovery' || !accessToken || !refreshToken) {
      setStage('invalid');
      return;
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) { setStage('invalid'); return; }
        // Clear the hash so tokens don't stay in browser history
        window.history.replaceState(null, '', window.location.pathname);
        setStage('pin');
      });
  }, []);

  useEffect(() => {
    if (pin.length !== 6) return;

    if (stage === 'pin') {
      setFirstPin(pin);
      setPin('');
      setStage('confirm');
    } else if (stage === 'confirm') {
      if (pin !== firstPin) {
        setErrorMsg('Los PINs no coinciden — intentá de nuevo');
        setPin('');
        setStage('pin');
        setFirstPin('');
      } else {
        saveNewPin(pin);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, stage]);

  async function saveNewPin(newPin: string) {
    setStage('saving');
    const { error } = await supabase.auth.updateUser({ password: newPin });
    if (error) {
      setErrorMsg(error.message || 'Error al guardar el PIN');
      setStage('error');
    } else {
      setStage('done');
      setTimeout(() => router.push('/cargar'), 2000);
    }
  }

  function handleKey(k: string) {
    if (stage !== 'pin' && stage !== 'confirm') return;
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setErrorMsg(''); return; }
    if (k === '' || pin.length >= 6) return;
    setPin(p => p + k);
  }

  const title =
    stage === 'confirm' ? 'Confirmá tu nuevo PIN' :
    stage === 'done'    ? 'PIN actualizado' :
    stage === 'saving'  ? 'Guardando...' :
    stage === 'error'   ? 'Ocurrió un error' :
    stage === 'invalid' ? 'Link inválido' :
                          'Elegí un nuevo PIN de 6 dígitos';

  return (
    <div className="wrap">
      <div className="header">
        <h1 className="logo">gastly</h1>
      </div>

      {stage === 'loading' && (
        <div className="center">
          <div className="spinner" />
        </div>
      )}

      {stage === 'invalid' && (
        <div className="center">
          <p className="msg-title">Link inválido o vencido</p>
          <p className="msg-body">El link de reseteo ya no es válido. Pedí uno nuevo desde la pantalla de inicio.</p>
          <button className="btn" onClick={() => router.push('/cargar')}>Ir al inicio</button>
        </div>
      )}

      {(stage === 'pin' || stage === 'confirm') && (
        <div className="pin-wrap">
          <div className="pin-header">
            <p className="pin-title">{title}</p>
            {stage === 'confirm' && <p className="pin-subtitle">Ingresalo de nuevo para confirmar</p>}
          </div>

          <div className="dots">
            {Array.from({length: 6}).map((_, i) => (
              <span key={i} className={`dot ${i < pin.length ? 'dot--filled' : ''}`} />
            ))}
          </div>

          {errorMsg && <p className="error">{errorMsg}</p>}

          <div className="keypad">
            {KEYS.map((k, i) => (
              <button
                key={i}
                className={`key ${k === '' ? 'key--empty' : ''} ${k === '⌫' ? 'key--del' : ''}`}
                onClick={() => handleKey(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === 'saving' && (
        <div className="center">
          <div className="spinner" />
          <p className="msg-body">Guardando tu nuevo PIN...</p>
        </div>
      )}

      {stage === 'done' && (
        <div className="center">
          <div className="success-icon">✓</div>
          <p className="msg-title">PIN actualizado</p>
          <p className="msg-body">Ya podés ingresar con tu nuevo PIN.</p>
        </div>
      )}

      {stage === 'error' && (
        <div className="center">
          <p className="msg-title">Ocurrió un error</p>
          <p className="msg-body">{errorMsg}</p>
          <button className="btn" onClick={() => router.push('/cargar')}>Ir al inicio</button>
        </div>
      )}

      <style jsx>{`
        .wrap { min-height: 100dvh; max-width: 480px; margin: 0 auto; padding: 64px 24px 32px; background: var(--bg); display: flex; flex-direction: column; }
        .header { text-align: center; margin-bottom: 48px; }
        .logo { font-size: 40px; font-weight: 800; color: var(--primary); letter-spacing: -1.5px; margin: 0; }
        .center { display: flex; flex-direction: column; align-items: center; gap: 16px; padding-top: 16px; }
        .spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .msg-title { font-size: 20px; font-weight: 700; color: var(--text); margin: 0; text-align: center; }
        .msg-body { font-size: 14px; color: var(--text-secondary); margin: 0; text-align: center; line-height: 1.5; }
        .btn { background: var(--primary); color: white; border: none; border-radius: 12px; padding: 15px 24px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 8px; }
        .success-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--primary-light); color: var(--primary); font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        /* pin */
        .pin-wrap { display: flex; flex-direction: column; align-items: center; }
        .pin-header { text-align: center; margin-bottom: 0; }
        .pin-title { font-size: 20px; font-weight: 700; color: var(--text); margin: 0 0 4px; }
        .pin-subtitle { font-size: 13px; color: var(--text-secondary); margin: 0; }
        .dots { display: flex; gap: 14px; justify-content: center; margin: 28px 0 12px; }
        .dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border); transition: all 0.15s; }
        .dot--filled { background: var(--primary); border-color: var(--primary); transform: scale(1.1); }
        .error { color: var(--danger); font-size: 13px; margin: 4px 0 8px; text-align: center; }
        .keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; max-width: 280px; margin-top: 16px; }
        .key { aspect-ratio: 1; border-radius: 50%; border: none; background: var(--surface); font-size: 22px; font-weight: 600; color: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,0.08); cursor: pointer; transition: background 0.1s; display: flex; align-items: center; justify-content: center; }
        .key:active { background: var(--border); }
        .key--empty { background: none; box-shadow: none; pointer-events: none; }
        .key--del { font-size: 18px; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}
