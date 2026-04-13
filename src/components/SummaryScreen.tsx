'use client';
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { getDailyRate } from '@/lib/blueRate';
import { formatAmount } from '@/lib/parser';
import { Expense, Currency, Category } from '@/types';

function getMonths() {
  const out = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('es-AR', { month: 'short', year: '2-digit' }).replace('.','');
    out.push({ value, label });
  }
  return out;
}
const MONTHS = getMonths();

export default function SummaryScreen() {
  const { workspace, members, categories, currentMember, blueRate, refreshBlueRate } = useApp();
  const isOwner = currentMember?.role === 'owner';
  const [from, setFrom] = useState(MONTHS[2]?.value ?? MONTHS[0].value);
  const [to, setTo] = useState(MONTHS[0].value);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUSD, setShowUSD] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [drillCat, setDrillCat] = useState<{id: string; name: string; color: string} | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    const start = (from < to ? from : to);
    const end   = (from < to ? to : from);
    const startDate = `${start}-01T00:00:00`;
    const endD = new Date(`${end}-01`); endD.setMonth(endD.getMonth()+1);

    let q = supabase.from('expenses')
      .select('*, categories(name,color,icon), members(display_name,id)')
      .eq('workspace_id', workspace.id)
      .gte('date', startDate).lte('date', endD.toISOString())
      .order('date', { ascending: false });
    if (memberId) q = q.eq('member_id', memberId);

    const { data } = await q;
    setExpenses(data ?? []);
    setLoading(false);
  }, [workspace, from, to, memberId]);

  useEffect(() => { load(); refreshBlueRate(); }, [load]);

  function toDisplay(e: { amount: number; currency: Currency; amount_ars: number | null; amount_usd: number | null }) {
    if (!showUSD) {
      if (e.amount_ars != null) return e.amount_ars;
      const rate = blueRate?.venta ?? 1400;
      return e.currency === 'USD' ? e.amount * rate : e.amount;
    }
    if (e.amount_usd != null) return e.amount_usd;
    const rate = blueRate?.venta ?? 1400;
    return e.currency === 'ARS' ? e.amount / rate : e.amount;
  }

  const displayCur: Currency = showUSD ? 'USD' : 'ARS';
  const total = expenses.reduce((s, e) => s + toDisplay(e), 0);

  // Monthly chart
  const range: string[] = [];
  const s = from < to ? from : to, en = from < to ? to : from;
  const [sy,sm] = s.split('-').map(Number), [ey,em] = en.split('-').map(Number);
  let y=sy, m=sm;
  while (y<ey||(y===ey&&m<=em)) { range.push(`${y}-${String(m).padStart(2,'0')}`); m++; if(m>12){m=1;y++;} }

  // Reset selectedMonth when range changes
  useEffect(() => { setSelectedMonth(null); }, [from, to, memberId]);

  const chartData = range.map(mo => {
    const sum = expenses.filter(e => e.date.startsWith(mo)).reduce((s,e) => s+toDisplay(e),0);
    const label = new Date(`${mo}-02T12:00:00Z`).toLocaleString('es-AR',{month:'short'}).replace('.','');
    return { monthKey: mo, month: label, total: Math.round(sum) };
  });

  // Category breakdown — filtered by selectedMonth if set
  const catExpenses = selectedMonth ? expenses.filter(e => e.date.startsWith(selectedMonth)) : expenses;
  const catMap: Record<string,{name:string;color:string;total:number}> = {};
  catExpenses.forEach(e => {
    const cat = e.categories as any;
    const key = e.category_id ?? '__null__';
    const name = cat?.name ?? 'Sin categoría';
    const color = cat?.color ?? '#888780';
    if (!catMap[key]) catMap[key] = { name, color, total: 0 };
    catMap[key].total += toDisplay(e);
  });
  const breakdown = Object.values(catMap).sort((a,b)=>b.total-a.total);

  const catPeriodLabel = selectedMonth
    ? new Date(`${selectedMonth}-01`).toLocaleString('es-AR', { month: 'long', year: '2-digit' }).replace('.','')
    : null;

  return (
    <div className="wrap">
      {/* Month selectors */}
      <div className="selectors">
        <Select label="Desde" value={from} onChange={setFrom} />
        <Select label="Hasta" value={to} onChange={setTo} />
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <>
          {/* Total */}
          <div className="total-card">
            <span className="total-label">Total gastado</span>
            <span className="total-amount">{formatAmount(total, displayCur)}</span>
            {blueRate && (
              <button className="convert-btn" onClick={() => setShowUSD(v=>!v)}>
                {showUSD
                  ? `Ver en ARS · cotización $${blueRate.venta.toLocaleString('es-AR')}`
                  : `Ver en USD blue · ${formatAmount(total/blueRate.venta, 'USD')}`}
              </button>
            )}
          </div>

          {/* Member pills */}
          <div className="pills">
            <button className={`pill ${!memberId?'pill--active':''}`} onClick={()=>setMemberId(null)}>Todos</button>
            {members.map(m => (
              <button key={m.id} className={`pill ${memberId===m.id?'pill--active':''}`} onClick={()=>setMemberId(memberId===m.id?null:m.id)}>{m.display_name}</button>
            ))}
          </div>

          {/* Bar chart */}
          {chartData.some(d=>d.total>0) && (
            <div className="chart-card">
              <p className="section-label">Por mes</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}} style={{cursor:'pointer'}}>
                  <XAxis dataKey="month" tick={{fontSize:12,fill:'#6B6B6B'}} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{fill:'#f0f0ee'}}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const mk = (payload[0].payload as any).monthKey;
                      const isActive = selectedMonth === mk;
                      return (
                        <div className="tt-box">
                          <p className="tt-month">{label}</p>
                          <p className="tt-total">{formatAmount(Number(payload[0].value), displayCur)}</p>
                          <p className="tt-action">{isActive ? '✕ quitar filtro' : 'ver detalle →'}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="total" radius={[6,6,0,0]} onClick={(data: any) => {
                    const mk = data.monthKey;
                    setSelectedMonth((prev: string | null) => prev === mk ? null : mk);
                  }}>
                    {chartData.map((d,i)=>(
                      <Cell key={i} fill={selectedMonth && selectedMonth !== d.monthKey ? '#b2d8cc' : '#1D9E75'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category breakdown */}
          {breakdown.length > 0 && (
            <div className="section">
              <div className="section-header">
                <p className="section-label">Por categoría</p>
                {catPeriodLabel
                  ? <button className="period-badge" onClick={() => setSelectedMonth(null)}>{catPeriodLabel} ✕</button>
                  : <span className="period-badge period-badge--muted">rango completo</span>
                }
              </div>
              {breakdown.map((c,i) => {
                const catKey = Object.keys(catMap).find(k => catMap[k] === c) ?? '';
                const catId = catKey === '__null__' ? '' : catKey;
                return (
                  <button key={i} className="cat-row cat-row--btn" onClick={() => setDrillCat({id: catId, name: c.name, color: c.color})}>
                    <span className="cat-dot" style={{background:c.color}} />
                    <span className="cat-name">{c.name}</span>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{width:`${Math.min(100,(c.total/total)*100)}%`,background:c.color}} />
                    </div>
                    <span className="cat-amount">{formatAmount(c.total,displayCur)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {drillCat && (
            <DrillModal
              catId={drillCat.id}
              catName={drillCat.name}
              catColor={drillCat.color}
              expenses={expenses}
              toDisplay={toDisplay}
              displayCur={displayCur}
              isOwner={isOwner}
              categories={categories}
              onClose={() => setDrillCat(null)}
              onReload={load}
            />
          )}

          {expenses.length === 0 && <p className="empty">Sin gastos en este período</p>}
        </>
      )}

      <style jsx>{`
        .wrap { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .selectors { display: flex; gap: 12px; }
        .loading { display:flex;justify-content:center;padding:40px; }
        .spinner { width:28px;height:28px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.7s linear infinite; }
        @keyframes spin{to{transform:rotate(360deg)}}
        .total-card { background: var(--surface); border-radius: 16px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 6px; }
        .total-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .total-amount { font-size: 36px; font-weight: 800; color: var(--text); letter-spacing: -1.5px; line-height: 1; }
        .convert-btn { background: none; border: none; padding: 0; font-size: 13px; font-weight: 600; color: var(--primary); text-align: left; }
        .pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .pill { border: 1.5px solid var(--border); border-radius: 20px; padding: 6px 14px; font-size: 13px; font-weight: 600; background: var(--surface); color: var(--text-secondary); transition: all 0.15s; }
        .pill--active { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }
        .chart-card { background: var(--surface); border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .tt-box { background: var(--surface); border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; min-width: 140px; }
        .tt-month { font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.4px; margin: 0 0 2px; }
        .tt-total { font-size: 15px; font-weight: 800; color: var(--text); margin: 0 0 6px; }
        .tt-action { font-size: 12px; font-weight: 700; color: var(--primary); margin: 0; }
        .section { background: var(--surface); border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .section-label { font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
        .period-badge { border: none; background: var(--primary-light); color: var(--primary); font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 6px; cursor: pointer; }
        .period-badge--muted { background: var(--bg); color: var(--text-tertiary); cursor: default; }
        .cat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .cat-row--btn { width: 100%; border: none; background: none; padding: 0; cursor: pointer; text-align: left; border-radius: 8px; transition: background 0.1s; }
        .cat-row--btn:hover { background: var(--bg); }
        .cat-dot { width:10px;height:10px;border-radius:50%;flex-shrink:0; }
        .cat-name { width: 100px; font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bar-bg { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
        .cat-amount { font-size: 13px; font-weight: 700; color: var(--text); min-width: 80px; text-align: right; }
        .empty { text-align: center; color: var(--text-tertiary); padding: 40px 0; margin: 0; }
      `}</style>
    </div>
  );
}

function DrillModal({ catId, catName, catColor, expenses, toDisplay, displayCur, isOwner, categories, onClose, onReload }: {
  catId: string;
  catName: string;
  catColor: string;
  expenses: Expense[];
  toDisplay: (e: Expense) => number;
  displayCur: Currency;
  isOwner: boolean;
  categories: Category[];
  onClose: () => void;
  onReload: () => void;
}) {
  const [selected, setSelected] = useState<Expense | null>(null);

  const items = expenses
    .filter(e => catId ? e.category_id === catId : !e.category_id)
    .sort((a, b) => toDisplay(b) - toDisplay(a));

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  return (
    <>
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <span className="cat-dot" style={{background: catColor}} />
          <h3 className="modal-title">{catName}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-list">
          {items.map(e => {
            const mem = e.members as any;
            return (
              <button key={e.id} className="item-row" onClick={() => setSelected(e)}>
                <div className="item-info">
                  <span className="item-desc">{e.description}</span>
                  <span className="item-meta">{mem?.display_name} · {fmtDate(e.date)}</span>
                </div>
                <span className="item-amount">{formatAmount(toDisplay(e), displayCur)}</span>
                {isOwner && <span className="item-chevron">›</span>}
              </button>
            );
          })}
          {items.length === 0 && <p className="empty">Sin gastos</p>}
        </div>
      </div>
      <style jsx>{`
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: flex-end; justify-content: center; z-index: 200; }
        .modal { background: var(--surface); border-radius: 20px 20px 0 0; padding: 20px; width: 100%; max-width: 480px; max-height: 80dvh; display: flex; flex-direction: column; }
        .modal-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .cat-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .modal-title { flex: 1; font-size: 18px; font-weight: 700; margin: 0; }
        .close-btn { border: none; background: none; font-size: 18px; color: var(--text-tertiary); padding: 4px; cursor: pointer; }
        .modal-list { overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
        .item-row { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-top: 1px solid var(--border); width: 100%; background: none; border-left: none; border-right: none; border-bottom: none; cursor: pointer; text-align: left; }
        .item-info { flex: 1; overflow: hidden; }
        .item-desc { display: block; font-size: 14px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-meta { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .item-amount { font-size: 14px; font-weight: 700; color: var(--text); flex-shrink: 0; }
        .item-chevron { font-size: 18px; color: var(--text-tertiary); flex-shrink: 0; }
        .empty { color: var(--text-tertiary); font-size: 14px; text-align: center; padding: 24px 0; margin: 0; }
      `}</style>
    </div>
    {selected && (
      <ExpenseDetailModal
        expense={selected}
        categories={categories}
        isOwner={isOwner}
        displayCur={displayCur}
        toDisplay={toDisplay}
        onClose={() => setSelected(null)}
        onSaved={() => { setSelected(null); onReload(); }}
        onDeleted={() => { setSelected(null); onClose(); onReload(); }}
      />
    )}
    </>
  );
}

function ExpenseDetailModal({ expense, categories, isOwner, displayCur, toDisplay, onClose, onSaved, onDeleted }: {
  expense: Expense;
  categories: Category[];
  isOwner: boolean;
  displayCur: Currency;
  toDisplay: (e: Expense) => number;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(expense.amount));
  const [description, setDescription] = useState(expense.description);
  const [categoryId, setCategoryId] = useState(expense.category_id);
  const [currency, setCurrency] = useState<Currency>(expense.currency);
  const [saving, setSaving] = useState(false);

  const cat = expense.categories as any;

  async function handleSave() {
    const num = parseFloat(amount.replace(',', '.'));
    if (!num || num <= 0) return;
    setSaving(true);
    const dateStr = expense.date.slice(0, 10);
    const rate = await getDailyRate(dateStr);
    const amount_ars = currency === 'ARS' ? num : Math.round(num * rate);
    const amount_usd = currency === 'USD' ? num : Math.round(num / rate * 100) / 100;
    await supabase.from('expenses').update({ amount: num, description: description.trim(), category_id: categoryId, currency, amount_ars, amount_usd }).eq('id', expense.id);
    setSaving(false);
    onSaved();
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este gasto?')) return;
    await supabase.from('expenses').delete().eq('id', expense.id);
    onDeleted();
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        {!editing ? (
          <>
            <div className="dh">
              <div>
                <p className="d-desc">{expense.description}</p>
                <p className="d-meta">{cat?.name} · {fmtDate(expense.date)}</p>
              </div>
              <button className="close-btn" onClick={onClose}>✕</button>
            </div>
            <p className="d-amount">{formatAmount(toDisplay(expense), displayCur)}</p>
            {isOwner && (
              <div className="d-actions">
                <button className="btn-ghost" onClick={() => setEditing(true)}>Editar</button>
                <button className="btn-danger" onClick={handleDelete}>Eliminar</button>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="modal-title">Editar gasto</h3>
            <label className="label">Monto</label>
            <div className="amount-row">
              <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" />
              <div className="currency-toggle">
                {(['ARS', 'USD'] as const).map(c => (
                  <button key={c} type="button" className={`cur-btn ${currency === c ? 'active' : ''}`} onClick={() => setCurrency(c)}>{c}</button>
                ))}
              </div>
            </div>
            <label className="label">Descripción</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} />
            <label className="label">Categoría</label>
            <select className="input" value={categoryId ?? ''} onChange={e => setCategoryId(e.target.value)}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="d-actions">
              <button className="btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 300; }
        .modal { background: var(--surface); border-radius: 20px 20px 0 0; padding: 24px; width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 12px; }
        .dh { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .d-desc { font-size: 18px; font-weight: 700; color: var(--text); margin: 0 0 4px; }
        .d-meta { font-size: 13px; color: var(--text-secondary); margin: 0; }
        .d-amount { font-size: 32px; font-weight: 800; color: var(--text); letter-spacing: -1px; margin: 0; }
        .close-btn { border: none; background: none; font-size: 18px; color: var(--text-tertiary); padding: 4px; cursor: pointer; flex-shrink: 0; }
        .d-actions { display: flex; gap: 10px; margin-top: 4px; }
        .btn-ghost { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 13px; font-size: 15px; font-weight: 600; color: var(--text-secondary); background: none; cursor: pointer; }
        .btn-danger { flex: 1; border: 1.5px solid var(--danger); border-radius: 10px; padding: 13px; font-size: 15px; font-weight: 700; color: var(--danger); background: none; cursor: pointer; }
        .btn-primary { flex: 1; background: var(--primary); color: white; border: none; border-radius: 10px; padding: 13px; font-size: 15px; font-weight: 700; cursor: pointer; }
        .btn-primary:disabled { opacity: 0.6; }
        .modal-title { font-size: 18px; font-weight: 700; margin: 0; }
        .label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .input { border: 1.5px solid var(--border); border-radius: 8px; padding: 11px 12px; font-size: 15px; color: var(--text); width: 100%; font-family: inherit; background: var(--surface); }
        .input:focus { border-color: var(--primary); outline: none; }
        .amount-row { display: flex; gap: 8px; align-items: center; }
        .amount-row .input { flex: 1; }
        .currency-toggle { display: flex; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; }
        .cur-btn { border: none; padding: 10px 12px; font-size: 13px; font-weight: 700; background: var(--surface); color: var(--text-secondary); cursor: pointer; }
        .cur-btn.active { background: var(--primary); color: white; }
      `}</style>
    </div>
  );
}

function Select({ label, value, onChange }: { label: string; value: string; onChange: (v:string)=>void }) {
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
      <label style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)'}}>{label}</label>
      <select
        value={value}
        onChange={e=>onChange(e.target.value)}
        style={{border:'1.5px solid var(--border)',borderRadius:10,padding:'9px 10px',fontSize:15,fontWeight:600,color:'var(--text)',background:'var(--surface)',appearance:'auto'}}
      >
        {MONTHS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
    </div>
  );
}
