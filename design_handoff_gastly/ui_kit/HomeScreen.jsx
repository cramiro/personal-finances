// ─── Gastly UI Kit — HomeScreen ──────────────────────────────────────────────
const { useState: useSH, useEffect: useEH, useMemo: useMH } = React;
const { C: CH, FONT: FH, CATS: CATSH, MEMBERS: MEMH, INIT_EXPENSES, INIT_RECURRING, INIT_SHOPPING,
        fmtAmt, timeAgo, parseInput, Chevron: ChevronH, SectionToggle } = window;

function HomeScreen({ member }) {
  const [input, setInput]             = useSH('');
  const [expenses, setExpenses]       = useSH(INIT_EXPENSES);
  const [saved, setSaved]             = useSH(false);
  const [showRecents, setShowRecents] = useSH(true);
  const [recurring, setRecurring]     = useSH(INIT_RECURRING);
  const [showRec, setShowRec]         = useSH(false);
  const [shopping, setShopping]       = useSH(INIT_SHOPPING);
  const [showShop, setShowShop]       = useSH(false);
  const [newItem, setNewItem]         = useSH('');
  const [showCatPicker, setShowCatPicker] = useSH(false);
  const [overrideCat, setOverrideCat]     = useSH(null);

  const parsed = useMH(() => parseInput(input), [input]);
  useEH(() => { setOverrideCat(null); }, [input]);

  const activeCat = useMH(() => {
    if (overrideCat) return CATSH.find(c => c.id === overrideCat) || null;
    return CATSH.find(c => c.id === parsed.catId) || null;
  }, [overrideCat, parsed.catId]);

  function confirm(e) {
    e.preventDefault();
    if (!parsed.amount) return;
    const exp = { id:'e'+Date.now(), description:parsed.description||input, amount:parsed.amount, currency:parsed.currency, category_id:activeCat?.id||parsed.catId, member_id:member.id, date:'2026-05-08', created_at:new Date().toISOString() };
    setExpenses(prev => [exp, ...prev]);
    setInput(''); setOverrideCat(null);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    if (!showRecents) setShowRecents(true);
  }

  const paidCount  = recurring.filter(r => r.paid).length;
  const pendingShop = shopping.filter(s => !s.completed_at).length;
  const hasInput   = input.trim().length > 0;

  return (
    <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12, fontFamily:FH }}>
      <p style={{ fontSize:22, fontWeight:800, color:CH.text, letterSpacing:-0.5, margin:'4px 0 0' }}>Casa Miro</p>

      {/* ─ Input card ─ */}
      <form onSubmit={confirm} style={{ background:CH.surface, borderRadius:16, padding:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column' }}>
        <input
          placeholder={'"100k super" o "25k café"'}
          value={input} onChange={e => setInput(e.target.value)}
          autoComplete="off" autoCorrect="off" spellCheck={false}
          style={{ fontSize:20, color:CH.text, border:'none', borderBottom:`1.5px solid ${hasInput?CH.primary:CH.border}`, padding:'8px 0 12px', width:'100%', background:'transparent', fontFamily:FH, outline:'none', transition:'border-color 0.15s' }}
        />
        {hasInput && parsed.amount > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0' }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:activeCat?.color||parsed.catColor, flexShrink:0 }} />
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2 }}>
              <span style={{ fontSize:22, fontWeight:800, color:CH.text, letterSpacing:-0.5 }}>{fmtAmt(parsed.amount, parsed.currency)}</span>
              <button type="button" onClick={()=>setShowCatPicker(true)} style={{ background:'none', border:'none', padding:0, fontSize:13, color:CH.primary, fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:FH }}>
                {activeCat?.name||parsed.catName} ›
              </button>
            </div>
            <span style={{ background:CH.primaryLight, color:CH.primary, fontSize:12, fontWeight:700, padding:'4px 9px', borderRadius:6 }}>{member.display_name}</span>
          </div>
        )}
        <button type="submit" disabled={!hasInput||!parsed.amount}
          style={{ marginTop:12, background:CH.primary, color:'white', border:'none', borderRadius:10, padding:14, fontSize:16, fontWeight:700, width:'100%', cursor:'pointer', opacity:(!hasInput||!parsed.amount)?0.4:1, fontFamily:FH, transition:'opacity 0.15s' }}>
          {saved ? '✓ Guardado' : 'Confirmar gasto'}
        </button>
      </form>

      {/* ─ Recientes ─ */}
      <SectionToggle label="Recientes" open={showRecents} onToggle={()=>setShowRecents(v=>!v)} />
      {showRecents && (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {expenses.length === 0 && <p style={{ color:CH.textTer, fontSize:14, textAlign:'center', padding:'32px 0', margin:0 }}>Cargá tu primer gasto</p>}
          {expenses.map(exp => {
            const cat = CATSH.find(c => c.id === exp.category_id);
            const mem = MEMH.find(m => m.id === exp.member_id);
            return (
              <div key={exp.id} style={{ display:'flex', alignItems:'center', gap:10, background:CH.surface, borderRadius:10, padding:12 }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background:cat?.color||'#888', flexShrink:0 }} />
                <div style={{ flex:1, overflow:'hidden' }}>
                  <span style={{ display:'block', fontSize:14, fontWeight:500, color:CH.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{exp.description}</span>
                  <span style={{ display:'block', fontSize:12, color:CH.textSec, marginTop:2 }}>{cat?.name} · {mem?.display_name}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:CH.text }}>{fmtAmt(exp.amount, exp.currency)}</span>
                  <span style={{ fontSize:11, color:CH.textTer }}>{timeAgo(exp.created_at)}</span>
                </div>
                <span style={{ fontSize:18, color:CH.textTer, flexShrink:0 }}>›</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ─ Gastos fijos ─ */}
      <SectionToggle label="Gastos fijos — mayo" open={showRec} onToggle={()=>setShowRec(v=>!v)} badge={`${paidCount}/${recurring.length}`} badgeDone={paidCount===recurring.length} />
      {showRec && (
        <div style={{ background:CH.surface, borderRadius:12, padding:12, display:'flex', flexDirection:'column' }}>
          {[...recurring.filter(r=>!r.paid), ...recurring.filter(r=>r.paid)].map((r,i) => {
            const cat = CATSH.find(c => c.id === r.category_id);
            const mem = MEMH.find(m => m.id === r.by);
            return (
              <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderTop:i===0?'none':`1px solid ${CH.border}`, opacity:r.paid?0.5:1 }}>
                <button onClick={()=>setRecurring(prev=>prev.map(x=>x.id===r.id?{...x,paid:!x.paid,by:x.paid?null:member.id}:x))}
                  style={{ width:26, height:26, borderRadius:'50%', border:`2px solid ${r.paid?CH.primary:CH.border}`, background:r.paid?CH.primary:'none', cursor:'pointer', fontSize:13, fontWeight:700, color:r.paid?'white':CH.textTer, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:FH }}>
                  {r.paid?'✓':'○'}
                </button>
                <div style={{ flex:1 }}>
                  <span style={{ display:'block', fontSize:14, fontWeight:500, color:CH.text }}>{r.name}</span>
                  <span style={{ display:'block', fontSize:11, color:CH.textTer, marginTop:1 }}>{r.paid ? `pagó: ${mem?.display_name}` : `${cat?.icon} ${cat?.name}`}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─ Lista de compras ─ */}
      <SectionToggle label="Lista de compras" open={showShop} onToggle={()=>setShowShop(v=>!v)} badge={pendingShop>0?pendingShop:undefined} />
      {showShop && (
        <div style={{ background:CH.surface, borderRadius:12, padding:12, display:'flex', flexDirection:'column', gap:2 }}>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <input placeholder="Agregar ítem..." value={newItem} onChange={e=>setNewItem(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&newItem.trim()){ setShopping(p=>[{id:'s'+Date.now(),name:newItem.trim(),created_by:member.id,completed_at:null,completed_by:null},...p]); setNewItem(''); } }}
              style={{ flex:1, border:`1.5px solid ${CH.border}`, borderRadius:8, padding:'10px 12px', fontSize:16, color:CH.text, background:CH.surface, fontFamily:FH, outline:'none' }}
            />
            <button onClick={()=>{ if(!newItem.trim()) return; setShopping(p=>[{id:'s'+Date.now(),name:newItem.trim(),created_by:member.id,completed_at:null,completed_by:null},...p]); setNewItem(''); }}
              style={{ background:CH.primary, color:'white', border:'none', borderRadius:8, padding:'10px 14px', fontSize:18, fontWeight:700, cursor:'pointer', fontFamily:FH }}>→</button>
          </div>
          {shopping.map((s,i) => {
            const mem = MEMH.find(m=>m.id===s.created_by);
            return (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderTop:i===0?'none':`1px solid ${CH.border}`, opacity:s.completed_at?0.5:1 }}>
                <button onClick={()=>setShopping(p=>p.map(x=>x.id===s.id?{...x,completed_at:x.completed_at?null:new Date().toISOString(),completed_by:x.completed_at?null:member.id}:x))}
                  style={{ width:26, height:26, borderRadius:'50%', border:`2px solid ${s.completed_at?CH.primary:CH.border}`, background:s.completed_at?CH.primary:'none', cursor:'pointer', fontSize:13, fontWeight:700, color:s.completed_at?'white':CH.textTer, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:FH }}>
                  {s.completed_at?'✓':'○'}
                </button>
                <div style={{ flex:1 }}>
                  <span style={{ display:'block', fontSize:14, fontWeight:500, color:CH.text, textDecoration:s.completed_at?'line-through':'none' }}>{s.name}</span>
                  <span style={{ display:'block', fontSize:11, color:CH.textTer, marginTop:1 }}>cargó: {mem?.display_name}</span>
                </div>
                <button onClick={()=>setShopping(p=>p.filter(x=>x.id!==s.id))} style={{ border:'none', background:'none', color:CH.textTer, fontSize:14, cursor:'pointer', padding:4, fontFamily:FH }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─ Category picker sheet ─ */}
      {showCatPicker && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowCatPicker(false);}}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:400 }}>
          <div style={{ background:CH.surface, borderRadius:'20px 20px 0 0', padding:20, width:'100%', maxWidth:480, maxHeight:'80dvh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <p style={{ fontSize:16, fontWeight:700, margin:0 }}>Categoría</p>
              <button onClick={()=>setShowCatPicker(false)} style={{ border:'none', background:'none', fontSize:18, color:CH.textTer, padding:4, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:2 }}>
              {CATSH.map(cat => {
                const isActive = (activeCat?.id||parsed.catId) === cat.id;
                return (
                  <button key={cat.id} onClick={()=>{setOverrideCat(cat.id);setShowCatPicker(false);}}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 8px', border:'none', background:isActive?CH.primaryLight:'none', borderRadius:8, cursor:'pointer', width:'100%', textAlign:'left', fontFamily:FH }}>
                    <span style={{ width:10, height:10, borderRadius:'50%', background:cat.color, flexShrink:0 }} />
                    <span style={{ flex:1, fontSize:14, fontWeight:500, color:CH.text }}>{cat.name}</span>
                    {isActive && <span style={{ fontSize:14, fontWeight:700, color:CH.primary }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { HomeScreen });
