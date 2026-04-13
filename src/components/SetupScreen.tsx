'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function SetupScreen() {
  const { setupWorkspace } = useApp();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Falta el nombre del workspace');
    if (!displayName.trim()) return setError('Falta tu nombre corto');
    if (!/^\d{4}$/.test(pin)) return setError('El PIN debe ser 4 dígitos numéricos');
    if (pin !== pin2) return setError('Los PINs no coinciden');
    setLoading(true);
    try {
      await setupWorkspace(name.trim(), pin, displayName.trim(), currency);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="setup-wrap">
      <div className="setup-header">
        <h1 className="logo">gastly</h1>
        <p className="subtitle">La forma más rápida de trackear gastos</p>
      </div>

      <form onSubmit={handleCreate} className="setup-form">
        <h2 className="form-title">Creá tu workspace</h2>

        <Field label="Nombre del workspace">
          <input className="input" placeholder="ej: Casa ML & JP" value={name} onChange={e => setName(e.target.value)} />
        </Field>

        <Field label="Tu nombre corto">
          <input className="input" placeholder="ej: ML" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={4} style={{ textTransform: 'uppercase' }} />
        </Field>

        <Field label="Moneda por defecto">
          <div className="currency-row">
            {(['ARS', 'USD'] as const).map(c => (
              <button key={c} type="button" className={`currency-btn ${currency === c ? 'currency-btn--active' : ''}`} onClick={() => setCurrency(c)}>{c}</button>
            ))}
          </div>
        </Field>

        <Field label="PIN de 4 dígitos">
          <input className="input" type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={pin} onChange={e => setPin(e.target.value)} />
        </Field>

        <Field label="Confirmar PIN">
          <input className="input" type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={pin2} onChange={e => setPin2(e.target.value)} />
        </Field>

        {error && <p className="error">{error}</p>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear workspace'}
        </button>
      </form>

      <style jsx>{`
        .setup-wrap { min-height: 100dvh; max-width: 480px; margin: 0 auto; padding: 48px 24px 32px; background: var(--bg); }
        .setup-header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 36px; font-weight: 800; color: var(--primary); letter-spacing: -1px; margin: 0 0 6px; }
        .subtitle { color: var(--text-secondary); font-size: 14px; margin: 0; }
        .setup-form { display: flex; flex-direction: column; gap: 14px; }
        .form-title { font-size: 18px; font-weight: 700; margin: 0 0 6px; }
        .input { width: 100%; border: 1.5px solid var(--border); border-radius: 10px; padding: 13px 14px; font-size: 16px; color: var(--text); background: var(--surface); transition: border-color 0.15s; }
        .input:focus { border-color: var(--primary); }
        .currency-row { display: flex; gap: 10px; }
        .currency-btn { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px; font-size: 15px; font-weight: 600; background: var(--surface); color: var(--text-secondary); transition: all 0.15s; }
        .currency-btn--active { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }
        .error { color: var(--danger); font-size: 13px; margin: 0; }
        .btn-primary { background: var(--primary); color: white; border: none; border-radius: 12px; padding: 15px; font-size: 16px; font-weight: 700; margin-top: 6px; transition: opacity 0.15s; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
