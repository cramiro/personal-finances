// ─── Gastly UI Kit — AppShell, Shared Utils & Fake Data ─────────────────────
// Exports: C, FONT, CATS, MEMBERS, INIT_EXPENSES, INIT_RECURRING, INIT_SHOPPING,
//          CHART_DATA, BREAKDOWN, fmtAmt, timeAgo, parseInput, avatarBg,
//          Shell, Chevron, SectionToggle

const C = {
  primary: '#1D9E75', primaryLight: '#E8F7F2',
  bg: '#FAFAF8', surface: '#FFFFFF',
  text: '#1A1A1A', textSec: '#6B6B6B', textTer: '#ABABAB',
  border: '#E8E8E8', danger: '#E24B4A',
};
const FONT = "'DM Sans', -apple-system, sans-serif";

// ─── Fake Data ─────────────────────────────────────────────────────────────
const CATS = [
  { id:'c1',  name:'Supermercado',    icon:'🛒', color:'#1D9E75', keywords:['super','supermercado','coto','carrefour','dia','jumbo','chino'] },
  { id:'c2',  name:'Transporte',      icon:'🚗', color:'#378ADD', keywords:['nafta','uber','taxi','sube','peaje','cabify'] },
  { id:'c3',  name:'Comida',          icon:'🍕', color:'#D85A30', keywords:['delivery','rappi','pedidosya','restaurant','cafe','pizza','sushi','burger','birra'] },
  { id:'c4',  name:'Suscripciones',   icon:'📺', color:'#7F77DD', keywords:['netflix','spotify','youtube','hbo','disney','prime','icloud','chatgpt'] },
  { id:'c5',  name:'Hogar',           icon:'🏠', color:'#BA7517', keywords:['luz','gas','agua','internet','alquiler','expensas','limpieza'] },
  { id:'c6',  name:'Salud',           icon:'💊', color:'#D4537E', keywords:['farmacia','medico','doctor','prepaga','dentista'] },
  { id:'c7',  name:'Entretenimiento', icon:'🎭', color:'#E24B4A', keywords:['cine','teatro','recital','show','juego'] },
  { id:'c8',  name:'Ropa',            icon:'👕', color:'#639922', keywords:['ropa','zapatillas','zapatos','zara'] },
  { id:'c9',  name:'Educación',       icon:'📚', color:'#534AB7', keywords:['curso','libro','udemy'] },
  { id:'c10', name:'Otros',           icon:'📦', color:'#888780', keywords:[] },
];

const MEMBERS = [
  { id:'m1', display_name:'Caro', role:'owner',  last_seen_at:new Date(Date.now()-7200000).toISOString(),  last_device:'iPhone 15' },
  { id:'m2', display_name:'Miru', role:'member', last_seen_at:new Date(Date.now()-93600000).toISOString(), last_device:'iPhone 14' },
];

const INIT_EXPENSES = [
  { id:'e1', description:'Coto Palermo',         amount:24800, currency:'ARS', category_id:'c1', member_id:'m1', date:'2026-05-07', created_at:new Date(Date.now()-7200000).toISOString() },
  { id:'e2', description:'Rappi Burger',          amount:18,    currency:'USD', category_id:'c3', member_id:'m2', date:'2026-05-06', created_at:new Date(Date.now()-93600000).toISOString() },
  { id:'e3', description:'Netflix',              amount:6,     currency:'USD', category_id:'c4', member_id:'m1', date:'2026-05-05', created_at:new Date(Date.now()-180000000).toISOString() },
  { id:'e4', description:'Uber al aeropuerto',   amount:15200, currency:'ARS', category_id:'c2', member_id:'m2', date:'2026-05-04', created_at:new Date(Date.now()-266400000).toISOString() },
  { id:'e5', description:'Farmacia Sana Sana',   amount:8400,  currency:'ARS', category_id:'c6', member_id:'m1', date:'2026-05-03', created_at:new Date(Date.now()-352800000).toISOString() },
  { id:'e6', description:'Spotify',             amount:4,     currency:'USD', category_id:'c4', member_id:'m1', date:'2026-05-02', created_at:new Date(Date.now()-439200000).toISOString() },
  { id:'e7', description:'Carrefour San Justo', amount:31600, currency:'ARS', category_id:'c1', member_id:'m2', date:'2026-05-01', created_at:new Date(Date.now()-525600000).toISOString() },
];

const INIT_RECURRING = [
  { id:'r1', name:'Alquiler', category_id:'c5', paid:true,  by:'m1' },
  { id:'r2', name:'Expensas', category_id:'c5', paid:true,  by:'m2' },
  { id:'r3', name:'Internet', category_id:'c5', paid:false, by:null },
  { id:'r4', name:'Luz',      category_id:'c5', paid:false, by:null },
  { id:'r5', name:'Netflix',  category_id:'c4', paid:true,  by:'m1' },
  { id:'r6', name:'Gas',      category_id:'c5', paid:false, by:null },
];

const INIT_SHOPPING = [
  { id:'s1', name:'Yerba',       created_by:'m2', completed_at:null, completed_by:null },
  { id:'s2', name:'Leche',       created_by:'m1', completed_at:null, completed_by:null },
  { id:'s3', name:'Mantequilla', created_by:'m1', completed_at:'2026-05-07T10:00Z', completed_by:'m2' },
];

const CHART_DATA = [
  { key:'2026-01', label:'ene', total:287000 },
  { key:'2026-02', label:'feb', total:312000 },
  { key:'2026-03', label:'mar', total:245000 },
  { key:'2026-04', label:'abr', total:298000 },
  { key:'2026-05', label:'may', total:148200 },
];

const BREAKDOWN = [
  { id:'c1', name:'Supermercado',  color:'#1D9E75', total:56400 },
  { id:'c5', name:'Hogar',         color:'#BA7517', total:38000 },
  { id:'c2', name:'Transporte',    color:'#378ADD', total:22600 },
  { id:'c3', name:'Comida',        color:'#D85A30', total:17800 },
  { id:'c4', name:'Suscripciones', color:'#7F77DD', total:14000 },
  { id:'c6', name:'Salud',         color:'#D4537E', total:8400  },
];

// ─── Utilities ────────────────────────────────────────────────────────────
function fmtAmt(n, cur) {
  if (cur === 'USD') return `U$${Number(n).toLocaleString('es-AR',{maximumFractionDigits:2})}`;
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function timeAgo(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'ahora';
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}

function parseInput(input) {
  const none = { amount:0, currency:'ARS', description:'', catId:null, catName:'Otros', catColor:'#888780' };
  if (!input.trim()) return none;
  let text = input.trim().toLowerCase();
  let currency = 'ARS';
  if (/^u[\$\d]/.test(text)) { currency='USD'; text=text.replace(/^u\$?/,'').trim(); }
  else if (/^usd\s/i.test(text)) { currency='USD'; text=text.replace(/^usd\s*/i,'').trim(); }
  const parts = text.split(/\s+/);
  const amtStr = parts[0]||'';
  const kM = amtStr.match(/^(\d+(?:\.\d+)?)k$/i);
  const amount = kM ? parseFloat(kM[1])*1000 : /^\d+(?:\.\d+)?$/.test(amtStr) ? parseFloat(amtStr) : 0;
  const desc = parts.slice(1).join(' ');
  let cat = CATS[CATS.length-1];
  outer: for (const c of CATS) { for (const kw of c.keywords) { if (desc.includes(kw)) { cat=c; break outer; } } }
  return { amount, currency, description:desc||amtStr, catId:cat.id, catName:cat.name, catColor:cat.color };
}

const _AVATAR_BG = ['#1D9E75','#378ADD','#D85A30','#7F77DD','#BA7517','#D4537E','#639922','#534AB7'];
function avatarBg(name) {
  let h=0; for (let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h);
  return _AVATAR_BG[Math.abs(h)%_AVATAR_BG.length];
}

// ─── Primitives ──────────────────────────────────────────────────────────────
const { useState: _us, useEffect: _ue, useRef: _ur } = React;

function Chevron({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform:open?'rotate(180deg)':'none', transition:'0.2s', color:C.textTer, flexShrink:0 }}>
      <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SectionToggle({ label, open, onToggle, badge, badgeDone }) {
  return (
    <button onClick={onToggle} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', padding:'4px 0', cursor:'pointer', width:'100%', fontFamily:FONT }}>
      <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:C.textTer, textTransform:'uppercase', letterSpacing:'0.5px' }}>
        {label}
        {badge !== undefined && (
          <span style={{ background:C.primary, color:'white', fontSize:11, fontWeight:700, borderRadius:10, padding:'1px 7px', lineHeight:1.6 }}>
            {badgeDone ? '✓' : badge}
          </span>
        )}
      </span>
      <Chevron open={open} />
    </button>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
function Shell({ children, screen, onNav, member, onLogout }) {
  const [menuOpen, setMenuOpen] = _us(false);
  const menuRef = _ur(null);
  _ue(() => {
    if (!menuOpen) return;
    const fn = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [menuOpen]);

  const NAV = [
    { id:'home',    label:'Cargar',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? C.primary : C.textTer} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
    },
    { id:'summary', label:'Resumen',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? C.primary : C.textTer} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 20V14M12 20V8M18 20V3"/>
        </svg>
      ),
    },
    { id:'config',  label:'Config',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? C.primary : C.textTer} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6"  x2="20" y2="6"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="4" y1="18" x2="20" y2="18"/>
          <circle cx="9"  cy="6"  r="2.5" fill={C.surface}/>
          <circle cx="16" cy="12" r="2.5" fill={C.surface}/>
          <circle cx="10" cy="18" r="2.5" fill={C.surface}/>
        </svg>
      ),
    },
  ];
  const name = member?.display_name || '';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:C.bg, fontFamily:FONT, position:'relative' }}>
      <header style={{ padding:'14px 20px 10px', background:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ fontSize:22, fontWeight:800, color:C.primary, letterSpacing:-0.5 }}>gastly</span>
        <div ref={menuRef} style={{ position:'relative' }}>
          <button onClick={()=>setMenuOpen(v=>!v)} style={{ width:34, height:34, borderRadius:'50%', border:'none', background:avatarBg(name), color:'white', fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT }}>
            {name.charAt(0).toUpperCase()}
          </button>
          {menuOpen && (
            <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:12, boxShadow:'0 4px 20px rgba(0,0,0,0.12)', zIndex:100, minWidth:160, overflow:'hidden' }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, padding:'12px 14px 10px', margin:0 }}>{name}</p>
              <div style={{ height:1, background:C.border }} />
              <button onClick={()=>{setMenuOpen(false);onLogout();}} style={{ display:'block', width:'100%', textAlign:'left', background:'none', border:'none', padding:'11px 14px', fontSize:14, fontWeight:600, color:C.danger, cursor:'pointer', fontFamily:FONT }}>Cerrar sesión</button>
            </div>
          )}
        </div>
      </header>
      <main style={{ flex:1, overflowY:'auto', paddingBottom:72 }}>{children}</main>
      <nav style={{ position:'absolute', bottom:0, left:0, right:0, display:'flex', background:C.surface, borderTop:`1px solid ${C.border}`, zIndex:50 }}>
        {NAV.map(n => {
          const active = screen === n.id;
          return (
            <button key={n.id} onClick={()=>onNav(n.id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0 12px', background:'none', border:'none', gap:4, cursor:'pointer', fontFamily:FONT }}>
              {n.icon(active)}
              <span style={{ fontSize:11, fontWeight:600, color:active ? C.primary : C.textTer }}>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

Object.assign(window, { C, FONT, CATS, MEMBERS, INIT_EXPENSES, INIT_RECURRING, INIT_SHOPPING, CHART_DATA, BREAKDOWN, fmtAmt, timeAgo, parseInput, avatarBg, Shell, Chevron, SectionToggle });
