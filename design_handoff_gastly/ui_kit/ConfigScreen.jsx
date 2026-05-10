// ─── Gastly UI Kit — ConfigScreen ────────────────────────────────────────────
const { useState: useCF } = React;
const { C: CC, FONT: FC, CATS: CATSC, MEMBERS: MEMC, timeAgo: taC } = window;

function ConfigScreen({ member }) {
  const [tab, setTab]       = useCF('general');
  const [copied, setCopied] = useCF(false);
  const [shopOn, setShopOn] = useCF(true);
  const [recOn, setRecOn]   = useCF(true);

  const Toggle = ({ on, onToggle }) => (
    <button onClick={onToggle}
      style={{ width:44, height:26, borderRadius:13, border:'none', background:on?CC.primary:CC.border, position:'relative', cursor:'pointer', flexShrink:0, padding:0, transition:'background 0.2s' }}>
      <span style={{ position:'absolute', top:3, left:3, width:20, height:20, borderRadius:'50%', background:'white', transition:'transform 0.2s', transform:on?'translateX(18px)':'none', display:'block' }} />
    </button>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', fontFamily:FC }}>
      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${CC.border}`, background:CC.surface }}>
        {[['general','General'],['categories','Categorías']].map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{ flex:1, padding:14, border:'none', background:'none', fontSize:14, fontWeight:600, color:tab===id?CC.primary:CC.textSec, cursor:'pointer', borderBottom:`2px solid ${tab===id?CC.primary:'transparent'}`, marginBottom:-1, fontFamily:FC }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' ? (
        <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
          {/* Workspace settings */}
          <section style={{ background:CC.surface, borderRadius:12, padding:16 }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:CC.textSec, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Workspace</h3>
            {[{label:'Nombre',value:'Casa Miro'},{label:'Moneda default',value:'ARS'}].map(row => (
              <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderTop:`1px solid ${CC.border}` }}>
                <span style={{ fontSize:14, color:CC.text }}>{row.label}</span>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:14, color:CC.textSec }}>{row.value}</span>
                  {member.role==='owner' && <button style={{ background:'none', border:'none', color:CC.primary, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FC }}>Editar</button>}
                </div>
              </div>
            ))}
            {/* Feature toggles */}
            {[{label:'Lista de compras',desc:'Agregar y compartir ítems pendientes',on:shopOn,toggle:()=>setShopOn(v=>!v)},
              {label:'Gastos fijos',desc:'Checklist mensual de gastos recurrentes',on:recOn,toggle:()=>setRecOn(v=>!v)}
            ].map((f,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'10px 0 4px', borderTop:`1px solid ${CC.border}`, marginTop:4 }}>
                <div>
                  <span style={{ display:'block', fontSize:14, fontWeight:600, color:CC.text }}>{f.label}</span>
                  <span style={{ display:'block', fontSize:12, color:CC.textTer, marginTop:2 }}>{f.desc}</span>
                </div>
                <Toggle on={f.on} onToggle={f.toggle} />
              </div>
            ))}
          </section>

          {/* Members */}
          <section style={{ background:CC.surface, borderRadius:12, padding:16 }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:CC.textSec, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Miembros</h3>
            {MEMC.map(m => (
              <div key={m.id} style={{ borderTop:`1px solid ${CC.border}`, padding:'10px 0 6px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:14, fontWeight:700, color:CC.text }}>{m.display_name}</span>
                  <span style={{ fontSize:12, color:CC.textTer, background:CC.bg, borderRadius:5, padding:'2px 7px', fontWeight:600 }}>{m.role==='owner'?'owner':'miembro'}</span>
                </div>
                {member.role==='owner' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:3, marginTop:6 }}>
                    <span style={{ fontSize:12, color:CC.textSec }}>🕐 {taC(m.last_seen_at)}</span>
                    <span style={{ fontSize:12, color:CC.textSec }}>📱 {m.last_device}</span>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Invite code */}
          {member.role==='owner' && (
            <section style={{ background:CC.surface, borderRadius:12, padding:16 }}>
              <h3 style={{ fontSize:13, fontWeight:700, color:CC.textSec, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Código de invitación</h3>
              <p style={{ fontSize:13, color:CC.textSec, margin:'0 0 12px', lineHeight:1.5 }}>Dura 48 horas y es de un solo uso.</p>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <code style={{ flex:1, background:CC.bg, border:`1.5px solid ${CC.border}`, borderRadius:8, padding:'10px 12px', fontSize:12, color:CC.text, wordBreak:'break-all', fontFamily:'monospace' }}>GBT9-XTQK-2M7R</code>
                <button onClick={()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}}
                  style={{ background:CC.primary, color:'white', border:'none', borderRadius:8, padding:'7px 12px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FC }}>{copied?'✓':'Copiar'}</button>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                <span style={{ fontSize:12, color:CC.textTer }}>Expira en 47h</span>
                <button style={{ background:'none', border:`1.5px solid ${CC.border}`, borderRadius:8, padding:'7px 12px', fontSize:13, fontWeight:600, color:CC.textSec, cursor:'pointer', fontFamily:FC }}>Regenerar</button>
              </div>
            </section>
          )}

          <button style={{ border:`1.5px solid ${CC.danger}`, background:'none', color:CC.danger, borderRadius:10, padding:13, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:FC }}>
            Cerrar sesión
          </button>
        </div>
      ) : (
        /* ─ Categories tab ─ */
        <div style={{ padding:16, display:'flex', flexDirection:'column', gap:6 }}>
          {CATSC.map(cat => (
            <div key={cat.id} style={{ display:'flex', alignItems:'center', gap:10, background:CC.surface, borderRadius:10, padding:12 }}>
              <span style={{ width:12, height:12, borderRadius:'50%', background:cat.color, flexShrink:0 }} />
              <div style={{ flex:1, overflow:'hidden' }}>
                <span style={{ display:'block', fontSize:14, fontWeight:600, color:CC.text }}>{cat.name}</span>
                <span style={{ display:'block', fontSize:12, color:CC.textSec, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {cat.keywords.length > 0 ? cat.keywords.slice(0,5).join(', ') : 'Sin keywords'}
                </span>
              </div>
              <button style={{ border:`1.5px solid ${CC.border}`, borderRadius:6, padding:'5px 10px', fontSize:12, fontWeight:600, color:CC.textSec, background:'none', fontFamily:FC }}>Editar</button>
            </div>
          ))}
          <button style={{ border:`2px dashed ${CC.primary}`, borderRadius:10, padding:13, fontSize:14, fontWeight:700, color:CC.primary, background:'none', marginTop:4, cursor:'pointer', fontFamily:FC }}>
            + Nueva categoría
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ConfigScreen });
