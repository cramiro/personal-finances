'use client';
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { formatAmount } from '@/lib/parser';
import { Expense, Currency } from '@/types';

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
  const { workspace, members, blueRate, refreshBlueRate } = useApp();
  const [from, setFrom] = useState(MONTHS[2]?.value ?? MONTHS[0].value);
  const [to, setTo] = useState(MONTHS[0].value);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUSD, setShowUSD] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

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

  function toDisplay(amount: number, cur: Currency) {
    const rate = blueRate?.venta ?? 1400;
    if (!showUSD) return cur === 'USD' ? amount * rate : amount;
    return cur === 'ARS' ? amount / rate : amount;
  }

  const displayCur: Currency = showUSD ? 'USD' : 'ARS';
  const total = expenses.reduce((s, e) => s + toDisplay(e.amount, e.currency), 0);

  // Monthly chart
  const range: string[] = [];
  const s = from < to ? from : to, en = from < to ? to : from;
  const [sy,sm] = s.split('-').map(Number), [ey,em] = en.split('-').map(Number);
  let y=sy, m=sm;
  while (y<ey||(y===ey&&m<=em)) { range.push(`${y}-${String(m).padStart(2,'0')}`); m++; if(m>12){m=1;y++;} }

  const chartData = range.map(mo => {
    const sum = expenses.filter(e => e.date.startsWith(mo)).reduce((s,e) => s+toDisplay(e.amount,e.currency),0);
    const label = new Date(`${mo}-01`).toLocaleString('es-AR',{month:'short'}).replace('.','');
    return { month: label, total: Math.round(sum) };
  });

  // Category breakdown
  const catMap: Record<string,{name:string;color:string;total:number}> = {};
  expenses.forEach(e => {
    const cat = e.categories as any;
    if (!catMap[e.category_id]) catMap[e.category_id] = { name: cat?.name??'Otros', color: cat?.color??'#888', total: 0 };
    catMap[e.category_id].total += toDisplay(e.amount, e.currency);
  });
  const breakdown = Object.values(catMap).sort((a,b)=>b.total-a.total);

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
                <BarChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
                  <XAxis dataKey="month" tick={{fontSize:12,fill:'#6B6B6B'}} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v)=>formatAmount(Number(v),displayCur)} cursor={{fill:'#f0f0ee'}} />
                  <Bar dataKey="total" radius={[6,6,0,0]}>
                    {chartData.map((_,i)=><Cell key={i} fill="#1D9E75" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category breakdown */}
          {breakdown.length > 0 && (
            <div className="section">
              <p className="section-label">Por categoría</p>
              {breakdown.map((c,i) => (
                <div key={i} className="cat-row">
                  <span className="cat-dot" style={{background:c.color}} />
                  <span className="cat-name">{c.name}</span>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{width:`${Math.min(100,(c.total/total)*100)}%`,background:c.color}} />
                  </div>
                  <span className="cat-amount">{formatAmount(c.total,displayCur)}</span>
                </div>
              ))}
            </div>
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
        .section { background: var(--surface); border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .section-label { font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px; }
        .cat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
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
