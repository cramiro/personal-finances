'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

type Mode = 'create' | 'join';

export default function SetupScreen() {
  const { setupWorkspace, joinWorkspace } = useApp();
  const [mode, setMode] = useState<Mode>('create');

  // Create fields
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');

  // Join fields
  const [code, setCode] = useState('');
  const [joinName, setJoinName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Falta el nombre del workspace');
    if (!displayName.trim()) return setError('Falta tu nombre corto');
    setLoading(true);
    try {
      await setupWorkspace(name.trim(), displayName.trim(), currency);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!code.trim()) return setError('Ingresá el código del workspace');
    if (!joinName.trim()) return setError('Falta tu nombre corto');
    setLoading(true);
    try {
      await joinWorkspace(code.trim(), joinName.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="header">
        <h1 className="logo">gastly</h1>
        <p className="subtitle">Un último paso antes de empezar</p>
      </div>

      <div className="tabs">
        <button className={`tab ${mode === 'create' ? 'tab--active' : ''}`} onClick={() => { setMode('create'); setError(''); }}>
          Crear workspace
        </button>
        <button className={`tab ${mode === 'join' ? 'tab--active' : ''}`} onClick={() => { setMode('join'); setError(''); }}>
          Unirme a uno
        </button>
      </div>

      {mode === 'create' ? (
        <form onSubmit={handleCreate} className="form">
          <div className="field">
            <label className="label">Nombre del workspace</label>
            <input className="input" placeholder="ej: Casa Cande & Rami" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Tu nombre corto</label>
            <input className="input" placeholder="ej: RAMI" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={4} style={{ textTransform: 'uppercase' }} />
          </div>
          <div className="field">
            <label className="label">Moneda por defecto</label>
            <div className="currency-row">
              {(['ARS', 'USD'] as const).map(c => (
                <button key={c} type="button" className={`currency-btn ${currency === c ? 'active' : ''}`} onClick={() => setCurrency(c)}>{c}</button>
              ))}
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Creando...' : 'Empezar'}</button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="form">
          <p className="hint">Pedíle al owner que genere un código desde Config → Código de invitación. El código dura 48 horas y es de un solo uso.</p>
          <div className="field">
            <label className="label">Código de invitación</label>
            <input className="input" placeholder="Pegá el código acá" value={code} onChange={e => setCode(e.target.value)} autoCorrect="off" autoCapitalize="none" spellCheck={false} />
          </div>
          <div className="field">
            <label className="label">Tu nombre corto</label>
            <input className="input" placeholder="ej: CANDE" value={joinName} onChange={e => setJoinName(e.target.value)} maxLength={4} style={{ textTransform: 'uppercase' }} />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Uniéndome...' : 'Unirme'}</button>
        </form>
      )}

      <style jsx>{`
        .wrap { min-height: 100dvh; max-width: 480px; margin: 0 auto; padding: 64px 24px 32px; background: var(--bg); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 36px; font-weight: 800; color: var(--primary); letter-spacing: -1px; margin: 0 0 6px; }
        .subtitle { color: var(--text-secondary); font-size: 14px; margin: 0; }
        .tabs { display: flex; background: var(--surface); border-radius: 12px; padding: 4px; margin-bottom: 24px; }
        .tab { flex: 1; padding: 10px; border: none; background: none; font-size: 14px; font-weight: 600; color: var(--text-secondary); border-radius: 9px; cursor: pointer; transition: all 0.15s; }
        .tab--active { background: var(--primary); color: white; }
        .form { display: flex; flex-direction: column; gap: 16px; }
        .hint { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5; background: var(--primary-light); padding: 12px; border-radius: 8px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .input { border: 1.5px solid var(--border); border-radius: 10px; padding: 13px 14px; font-size: 16px; color: var(--text); background: var(--surface); transition: border-color 0.15s; }
        .input:focus { border-color: var(--primary); outline: none; }
        .currency-row { display: flex; gap: 10px; }
        .currency-btn { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px; font-size: 15px; font-weight: 600; background: var(--surface); color: var(--text-secondary); cursor: pointer; transition: all 0.15s; }
        .currency-btn.active { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }
        .error { color: var(--danger); font-size: 13px; margin: 0; }
        .btn { background: var(--primary); color: white; border: none; border-radius: 12px; padding: 15px; font-size: 16px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
