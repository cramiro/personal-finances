'use client';
import Link from 'next/link';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Registro en segundos',
    desc: 'Escribí "100k super" y listo. Sin formularios, sin categorías manuales.',
  },
  {
    icon: '👥',
    title: 'Para los dos',
    desc: 'Compartí el workspace con tu pareja. Cada uno carga desde su teléfono.',
  },
  {
    icon: '📊',
    title: 'Resumen visual',
    desc: 'Gráfico por categorías, filtros por mes y comparación con meses anteriores.',
  },
  {
    icon: '💵',
    title: 'ARS y dólar blue',
    desc: 'Cargá en pesos o en dólares. El resumen convierte automáticamente.',
  },
];

export default function LandingPage() {
  return (
    <div className="page">
      {/* Nav */}
      <nav className="nav">
        <span className="logo">gastly</span>
        <Link href="/cargar" className="nav-cta">Entrar</Link>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow">Para parejas argentinas</p>
          <h1 className="hero-title">
            Sabé en qué<br />gastás, sin que<br />sea un trabajo.
          </h1>
          <p className="hero-sub">
            Registrá gastos del hogar en menos de 10 segundos.
            Compartilo con tu pareja y terminá con el&nbsp;"¿a cuánto llegamos este mes?".
          </p>
          <Link href="/cargar" className="cta-btn">Empezar gratis</Link>
        </div>

        {/* Phone mockup */}
        <div className="mockup-wrap" aria-hidden="true">
          <div className="mockup">
            <div className="mockup-header">
              <span className="mockup-logo">gastly</span>
            </div>
            <div className="mockup-input-area">
              <p className="mockup-hint">CARGAR GASTO</p>
              <p className="mockup-input-text">145k alquiler</p>
              <div className="mockup-divider" />
            </div>
            <div className="mockup-preview">
              <span className="mockup-amount">$145.000</span>
              <span className="mockup-cat">🏠 Hogar</span>
            </div>
            <div className="mockup-btn">Confirmar gasto</div>
            <div className="mockup-recent-label">RECIENTES</div>
            {[
              { icon: '🛒', name: 'Super', amount: '$42.300', who: 'Vos' },
              { icon: '🚗', name: 'Nafta', amount: '$18.500', who: 'Ella' },
              { icon: '🍕', name: 'Pizza', amount: '$9.800',  who: 'Vos' },
            ].map((r, i) => (
              <div key={i} className="mockup-row">
                <span className="mockup-row-icon">{r.icon}</span>
                <span className="mockup-row-name">{r.name}</span>
                <span className="mockup-row-who">{r.who}</span>
                <span className="mockup-row-amt">{r.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <p className="section-label">POR QUÉ GASTLY</p>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bottom-cta">
        <h2 className="bottom-cta-title">Empezá hoy</h2>
        <p className="bottom-cta-sub">Sin tarjeta. Sin configuración. Solo tu email y un PIN.</p>
        <Link href="/cargar" className="cta-btn">Crear cuenta gratis</Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span className="footer-logo">gastly</span>
        <p className="footer-copy">Hecho con ♥ para el hogar argentino</p>
      </footer>

      <style jsx>{`
        /* ─── Page shell ─────────────────────────────────── */
        .page {
          min-height: 100dvh;
          background: #0E1117;
          color: #F2F2F0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ─── Nav ────────────────────────────────────────── */
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          max-width: 1080px;
          margin: 0 auto;
        }
        .logo {
          font-size: 22px;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.5px;
        }
        .nav-cta {
          font-size: 14px;
          font-weight: 600;
          color: #0E1117;
          text-decoration: none;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 7px 18px;
          transition: opacity 0.15s;
        }
        .nav-cta:hover { opacity: 0.85; }

        /* ─── Hero ───────────────────────────────────────── */
        .hero {
          max-width: 1080px;
          margin: 0 auto;
          padding: 48px 24px 80px;
          display: flex;
          align-items: center;
          gap: 64px;
        }
        .hero-inner { flex: 1; min-width: 0; }
        .hero-eyebrow {
          font-size: 12px;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin: 0 0 16px;
        }
        .hero-title {
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -1.5px;
          color: #F2F2F0;
          margin: 0 0 20px;
        }
        .hero-sub {
          font-size: 17px;
          line-height: 1.6;
          color: #9B9B9B;
          max-width: 420px;
          margin: 0 0 36px;
        }
        .cta-btn {
          display: inline-block;
          background: #FFFFFF;
          color: #0E1117;
          font-size: 16px;
          font-weight: 700;
          text-decoration: none;
          border-radius: 12px;
          padding: 15px 32px;
          transition: opacity 0.15s;
        }
        .cta-btn:hover { opacity: 0.85; }

        /* ─── Phone mockup ───────────────────────────────── */
        .mockup-wrap {
          flex-shrink: 0;
          display: flex;
          justify-content: center;
        }
        .mockup {
          width: 280px;
          background: var(--surface, #fff);
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.07), 0 32px 80px rgba(0,0,0,0.6);
          padding: 20px 16px 24px;
        }
        .mockup-header {
          margin-bottom: 20px;
        }
        .mockup-logo {
          font-size: 18px;
          font-weight: 800;
          color: var(--primary, #1D9E75);
          letter-spacing: -0.5px;
        }
        .mockup-input-area { margin-bottom: 12px; }
        .mockup-hint {
          font-size: 10px;
          font-weight: 700;
          color: #ABABAB;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin: 0 0 6px;
        }
        .mockup-input-text {
          font-size: 18px;
          font-weight: 500;
          color: #1A1A1A;
          margin: 0 0 8px;
        }
        .mockup-divider {
          height: 1.5px;
          background: var(--primary, #1D9E75);
          border-radius: 1px;
        }
        .mockup-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 12px 0;
        }
        .mockup-amount {
          font-size: 22px;
          font-weight: 800;
          color: #1A1A1A;
          letter-spacing: -0.5px;
        }
        .mockup-cat {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary, #1D9E75);
          background: #E8F7F2;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .mockup-btn {
          background: var(--primary, #1D9E75);
          color: white;
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          border-radius: 10px;
          padding: 11px;
          margin-bottom: 16px;
        }
        .mockup-recent-label {
          font-size: 10px;
          font-weight: 700;
          color: #ABABAB;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .mockup-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: #FAFAF8;
          border-radius: 8px;
          margin-bottom: 6px;
        }
        .mockup-row-icon { font-size: 16px; }
        .mockup-row-name {
          flex: 1;
          font-size: 13px;
          font-weight: 600;
          color: #1A1A1A;
        }
        .mockup-row-who {
          font-size: 11px;
          font-weight: 600;
          color: var(--primary, #1D9E75);
          background: #E8F7F2;
          padding: 2px 7px;
          border-radius: 6px;
        }
        .mockup-row-amt {
          font-size: 13px;
          font-weight: 700;
          color: #1A1A1A;
        }

        /* ─── Features ───────────────────────────────────── */
        .features {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }
        .section-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin: 0 0 32px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .feature-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px;
        }
        .feature-icon { font-size: 28px; display: block; margin-bottom: 12px; }
        .feature-title {
          font-size: 15px;
          font-weight: 700;
          color: #F2F2F0;
          margin: 0 0 8px;
        }
        .feature-desc {
          font-size: 13px;
          line-height: 1.5;
          color: #9B9B9B;
          margin: 0;
        }

        /* ─── Bottom CTA ─────────────────────────────────── */
        .bottom-cta {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 24px 80px;
          text-align: center;
        }
        .bottom-cta-title {
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800;
          letter-spacing: -1px;
          color: #F2F2F0;
          margin: 0 0 12px;
        }
        .bottom-cta-sub {
          font-size: 15px;
          color: #9B9B9B;
          margin: 0 0 28px;
        }

        /* ─── Footer ─────────────────────────────────────── */
        .footer {
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .footer-logo {
          font-size: 16px;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.5px;
        }
        .footer-copy {
          font-size: 12px;
          color: #5A5A5A;
          margin: 0;
        }

        /* ─── Responsive ─────────────────────────────────── */
        @media (max-width: 700px) {
          .hero { flex-direction: column; gap: 40px; padding-bottom: 48px; }
          .mockup-wrap { width: 100%; }
          .hero-sub { max-width: 100%; }
        }
        @media (max-width: 480px) {
          .mockup { width: 100%; max-width: 320px; }
        }
      `}</style>
    </div>
  );
}
