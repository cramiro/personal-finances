'use client';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

const NAV = [
  { href: '/', label: 'Cargar', icon: '⚡' },
  { href: '/resumen', label: 'Resumen', icon: '📊' },
  { href: '/config', label: 'Config', icon: '⚙️' },
];

const AVATAR_COLORS = [
  '#1D9E75', '#378ADD', '#D85A30', '#7F77DD',
  '#BA7517', '#D4537E', '#639922', '#534AB7',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentMember, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = currentMember?.display_name ?? '';
  const initial = name.charAt(0).toUpperCase();
  const bgColor = name ? avatarColor(name) : '#888';

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div className="shell">
      <header className="header">
        <span className="logo">gastly</span>
        {name && (
          <div className="avatar-wrap" ref={menuRef}>
            <button className="avatar" style={{ background: bgColor }} onClick={() => setMenuOpen(v => !v)}>
              {initial}
            </button>
            {menuOpen && (
              <div className="dropdown">
                <p className="dropdown-name">{name}</p>
                <div className="dropdown-sep" />
                <button className="dropdown-item dropdown-item--danger" onClick={() => { setMenuOpen(false); logout(); }}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="main">{children}</main>

      <nav className="bottom-nav">
        {NAV.map(n => {
          const active = pathname === n.href;
          return (
            <button
              key={n.href}
              onClick={() => router.push(n.href)}
              className={`nav-btn ${active ? 'nav-btn--active' : ''}`}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </button>
          );
        })}
      </nav>

      <style jsx>{`
        .shell { display: flex; flex-direction: column; min-height: 100dvh; max-width: 480px; margin: 0 auto; background: var(--bg); }
        .header { padding: 16px 20px 8px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .logo { font-size: 22px; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }
        .avatar-wrap { position: relative; }
        .avatar { width: 34px; height: 34px; border-radius: 50%; border: none; color: white; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); z-index: 100; min-width: 160px; overflow: hidden; }
        .dropdown-name { font-size: 13px; font-weight: 700; color: var(--text); padding: 12px 14px 10px; margin: 0; }
        .dropdown-sep { height: 1px; background: var(--border); margin: 0; }
        .dropdown-item { display: block; width: 100%; text-align: left; background: none; border: none; padding: 11px 14px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .dropdown-item--danger { color: var(--danger); }
        .dropdown-item--danger:hover { background: var(--bg); }
        .main { flex: 1; overflow-y: auto; padding-bottom: 72px; }
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; display: flex; background: var(--surface); border-top: 1px solid var(--border); z-index: 50; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 10px 0 12px; background: none; border: none; gap: 3px; }
        .nav-icon { font-size: 20px; }
        .nav-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); }
        .nav-btn--active .nav-label { color: var(--primary); }
        .nav-btn .nav-icon { opacity: 0.5; }
        .nav-btn--active .nav-icon { opacity: 1; }
      `}</style>
    </div>
  );
}
