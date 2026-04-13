'use client';
import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Cargar', icon: '⚡' },
  { href: '/resumen', label: 'Resumen', icon: '📊' },
  { href: '/config', label: 'Config', icon: '⚙️' },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="shell">
      <header className="header">
        <span className="logo">gastly</span>
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
        .header { padding: 16px 20px 8px; background: var(--surface); border-bottom: 1px solid var(--border); }
        .logo { font-size: 22px; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }
        .main { flex: 1; overflow-y: auto; padding-bottom: 72px; }
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; display: flex; background: var(--surface); border-top: 1px solid var(--border); z-index: 50; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 10px 0 12px; background: none; border: none; gap: 3px; }
        .nav-icon { font-size: 20px; }
        .nav-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); }
        .nav-btn--active .nav-label { color: var(--primary); }
        .nav-btn--active .nav-icon { opacity: 1; }
        .nav-btn .nav-icon { opacity: 0.5; }
        .nav-btn--active .nav-icon { opacity: 1; }
      `}</style>
    </div>
  );
}
