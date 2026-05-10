// ─── Gastly UI Kit — SummaryScreen ───────────────────────────────────────────
const { useState: useSS, useMemo: useSM } = React;
const { C: CS, FONT: FS, MEMBERS: MEMS, CHART_DATA, BREAKDOWN, fmtAmt: fmtS } = window;

const PRESETS = ['Esta sem.','Sem. ant.','Este mes','Mes ant.','3 meses','Este año','···'];
const BLUE_RATE = 1401;
const TOTAL_ARS = 148200;

function SimpleBarChart({ data, activeBar, onBarClick }) {
  const maxV = Math.max(...data.map(d => d.total), 1);
  const BW = 34, GAP = 18, H = 130, PAD = 24;
  const W = data.length * (BW + GAP) - GAP;

  function shortFmt(v) {
    if (v >= 1000000) return `$${(v/1000000).toFixed(1).replace('.0','')}M`;
    if (v >= 1000) return `$${Math.round(v/1000)}K`;
    return `$${v}`;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + PAD + 20}`} style={{ overflow:'visible', display:'block' }}>
      {data.map((d, i) => {
        const bh = Math.max((d.total / maxV) * H, 4);
        const x = i * (BW + GAP);
        const y = PAD + H - bh;
        const hl = !activeBar || activeBar === d.key;
        return (
          <g key={i} onClick={() => onBarClick(d.key)} style={{ cursor:'pointer' }}>
            <rect x={x} y={y} width={BW} height={bh} rx={5} fill={hl ? CS.primary : '#b2d8cc'} />
            <text x={x+BW/2} y={y-6} textAnchor="middle" fontSize={10} fontWeight={700} fill={CS.textSec} fontFamily="'DM Sans', sans-serif">
              {shortFmt(d.total)}
            </text>
            <text x={x+BW/2} y={H+PAD+16} textAnchor="middle" fontSize={11} fill={CS.textSec} fontFamily="'DM Sans', sans-serif">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SummaryScreen() {
  const [preset, setPreset]       = useSS('Este mes');
  const [showUSD, setShowUSD]     = useSS(false);
  const [memberId, setMemberId]   = useSS(null);
  const [activeBar, setActiveBar] = useSS(null);

  const total    = showUSD ? Math.round(TOTAL_ARS / BLUE_RATE) : TOTAL_ARS;
  const cur      = showUSD ? 'USD' : 'ARS';
  const avgLabel = showUSD ? 'U$207' : '$285.333';
  const activeMonth = CHART_DATA.find(d => d.key === activeBar);

  return (
    <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12, fontFamily:FS }}>

      {/* ─ Preset chips ─ */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
        {PRESETS.map(p => {
          const active = preset === p;
          return (
            <button key={p} onClick={()=>{setPreset(p);setActiveBar(null);}}
              style={{ flexShrink:0, padding:'7px 14px', border:`1.5px solid ${active?CS.primary:CS.border}`, borderRadius:20, fontSize:13, fontWeight:600, background:active?CS.primaryLight:CS.surface, color:active?CS.primary:CS.textSec, cursor:'pointer', whiteSpace:'nowrap', fontFamily:FS, transition:'0.15s' }}>
              {p}
            </button>
          );
        })}
      </div>

      {/* ─ Total card ─ */}
      <div style={{ background:CS.surface, borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', gap:6 }}>
        <span style={{ fontSize:13, fontWeight:600, color:CS.textSec }}>Total gastado</span>
        <span style={{ fontSize:36, fontWeight:800, color:CS.text, letterSpacing:-1.5, lineHeight:1 }}>{fmtS(total, cur)}</span>
        <button onClick={()=>setShowUSD(v=>!v)}
          style={{ background:'none', border:'none', padding:0, fontSize:13, fontWeight:600, color:CS.primary, textAlign:'left', cursor:'pointer', fontFamily:FS }}>
          {showUSD ? `Ver en ARS · cotización $${BLUE_RATE.toLocaleString('es-AR')}` : `Ver en USD blue · U$${Math.round(TOTAL_ARS/BLUE_RATE)}`}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:4, borderTop:`1px solid ${CS.border}`, marginTop:2 }}>
          <span style={{ fontSize:12, color:CS.textSec, flex:1 }}>Prom. 3m: {avgLabel}</span>
          <span style={{ fontSize:12, fontWeight:700, padding:'2px 7px', borderRadius:5, color:'#C0392B', background:'rgba(192,57,43,0.1)' }}>+8%</span>
        </div>
      </div>

      {/* ─ Member filter pills ─ */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[null, ...MEMS].map(m => {
          const active = memberId === (m?.id||null);
          return (
            <button key={m?.id||'all'} onClick={()=>setMemberId(m?.id||null)}
              style={{ border:`1.5px solid ${active?CS.primary:CS.border}`, borderRadius:20, padding:'6px 14px', fontSize:13, fontWeight:600, background:active?CS.primaryLight:CS.surface, color:active?CS.primary:CS.textSec, cursor:'pointer', fontFamily:FS }}>
              {m ? m.display_name : 'Todos'}
            </button>
          );
        })}
      </div>

      {/* ─ Bar chart ─ */}
      <div style={{ background:CS.surface, borderRadius:16, padding:16, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <p style={{ fontSize:12, fontWeight:700, color:CS.textTer, textTransform:'uppercase', letterSpacing:'0.5px', margin:0 }}>Por mes</p>
          {activeBar && (
            <button onClick={()=>setActiveBar(null)}
              style={{ background:CS.primaryLight, color:CS.primary, border:'none', fontSize:12, fontWeight:700, padding:'3px 8px', borderRadius:6, cursor:'pointer', fontFamily:FS }}>
              {activeMonth?.label} ✕
            </button>
          )}
        </div>
        <SimpleBarChart data={CHART_DATA} activeBar={activeBar} onBarClick={k=>setActiveBar(p=>p===k?null:k)} />
      </div>

      {/* ─ Category breakdown ─ */}
      <div style={{ background:CS.surface, borderRadius:16, padding:16, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize:12, fontWeight:700, color:CS.textTer, textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 10px' }}>Por categoría</p>
        {BREAKDOWN.map((b, i) => {
          const pct = (b.total / TOTAL_ARS) * 100;
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:b.color, flexShrink:0 }} />
              <span style={{ width:96, fontSize:13, color:CS.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'left', flexShrink:0 }}>{b.name}</span>
              <div style={{ flex:1, height:8, background:CS.border, borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', background:b.color, borderRadius:4, width:`${Math.min(100,pct)}%`, transition:'width 0.3s' }} />
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:CS.text, minWidth:76, textAlign:'right', flexShrink:0 }}>{fmtS(b.total,'ARS')}</span>
              <span style={{ fontSize:11, fontWeight:600, color:CS.textTer, minWidth:28, textAlign:'right', flexShrink:0 }}>{Math.round(pct)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { SummaryScreen, SimpleBarChart });
