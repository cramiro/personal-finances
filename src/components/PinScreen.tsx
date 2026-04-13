'use client';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';

const MAX_ATTEMPTS = 3;
const LOCKOUT_SEC = 30;

export default function PinScreen() {
  const { unlockWithPin, workspace } = useApp();
  const [digits, setDigits] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      const left = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (left <= 0) { setLockedUntil(null); setAttempts(0); clearInterval(id); }
      else setRemaining(left);
    }, 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  async function pressDigit(d: string) {
    if (lockedUntil) return;
    const next = [...digits, d];
    setDigits(next);
    if (next.length === 4) {
      const ok = await unlockWithPin(next.join(''));
      if (!ok) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setDigits([]);
        const na = attempts + 1;
        setAttempts(na);
        if (na >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_SEC * 1000);
          setRemaining(LOCKOUT_SEC);
        }
      }
    }
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="wrap">
      <h1 className="logo">gastly</h1>
      <p className="ws-name">{workspace?.name}</p>

      <div className={`dots ${shake ? 'shake' : ''}`}>
        {[0,1,2,3].map(i => <div key={i} className={`dot ${digits.length > i ? 'dot--filled' : ''}`} />)}
      </div>

      <p className="hint">{lockedUntil ? `Bloqueado por ${remaining}s` : 'Ingresá tu PIN'}</p>

      <div className="keypad">
        {keys.map((k, i) => (
          <button
            key={i}
            className={`key ${!k ? 'key--empty' : ''}`}
            onClick={() => k === '⌫' ? setDigits(d => d.slice(0,-1)) : k ? pressDigit(k) : undefined}
            disabled={!k || !!lockedUntil}
          >
            {k}
          </button>
        ))}
      </div>

      <style jsx>{`
        .wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100dvh; background: var(--bg); padding: 24px; }
        .logo { font-size: 32px; font-weight: 800; color: var(--primary); letter-spacing: -1px; margin: 0 0 6px; }
        .ws-name { color: var(--text-secondary); font-size: 14px; margin: 0 0 40px; }
        .dots { display: flex; gap: 20px; margin-bottom: 14px; }
        .dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--primary); background: transparent; transition: background 0.15s; }
        .dot--filled { background: var(--primary); }
        .hint { font-size: 13px; color: var(--text-tertiary); margin: 0 0 40px; }
        .keypad { display: grid; grid-template-columns: repeat(3, 80px); gap: 12px; }
        .key { width: 80px; height: 80px; border-radius: 50%; border: none; background: var(--surface); font-size: 24px; font-weight: 500; color: var(--text); box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.1s, background 0.1s; }
        .key:active { transform: scale(0.93); background: #f0f0ee; }
        .key:disabled { opacity: 0.4; cursor: not-allowed; }
        .key--empty { background: transparent; box-shadow: none; pointer-events: none; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
        .shake { animation: shake 0.4s ease; }
      `}</style>
    </div>
  );
}
