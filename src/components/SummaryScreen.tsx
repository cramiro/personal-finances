'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { formatAmount } from '@/lib/parser';
import { Expense, Currency, Category } from '@/types';
import ExpenseDetailModal from '@/components/ExpenseDetailModal';
import { arDate, arYearMonth } from '@/lib/constants';

function getMonths() {
  const out = [];
  const [yr, mo] = arDate().split('-').map(Number);
  for (let i = 0; i < 12; i++) {
    let y = yr, m = mo - i;
    if (m <= 0) { m += 12; y--; }
    const value = `${y}-${String(m).padStart(2, '0')}`;
    const label = new Date(`${value}-02T12:00:00`).toLocaleString('es-AR', { month: 'short', year: '2-digit' }).replace('.', '');
    out.push({ value, label });
  }
  return out;
}
const MONTHS = getMonths();
const BAR_MARGIN = { top: 24, right: 4, bottom: 0, left: 4 };

// --- Weekly helpers ---
function getMondayKey(dateStr: string): string {
  const d = new Date(dateStr.slice(0, 10) + 'T12:00:00');
  const day = d.getDay(); // 0=Sun, 1=Mon…
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD" of Monday
}

function getWeeks8(): string[] {
  const keys: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const key = getMondayKey(arDate(new Date(Date.now() - i * 7 * 86_400_000)));
    if (!keys.includes(key)) keys.push(key);
  }
  return keys;
}

function getWeekLabel(mondayKey: string): string {
  const thisMon = getMondayKey(arDate());
  const lastMon = getMondayKey(arDate(new Date(Date.now() - 7 * 86_400_000)));
  if (mondayKey === thisMon) return 'Esta sem.';
  if (mondayKey === lastMon) return 'Sem. ant.';
  const d = new Date(mondayKey + 'T12:00:00');
  return d.toLocaleString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '');
}

// --- Preset chips ---
type Preset = 'this-week' | 'last-week' | 'this-month' | 'last-month' | '3-months' | 'ytd' | 'custom';
const PRESET_LABELS: Record<Preset, string> = {
  'this-week':  'Esta sem.',
  'last-week':  'Sem. ant.',
  'this-month': 'Este mes',
  'last-month': 'Mes ant.',
  '3-months':   '3 meses',
  'ytd':        'Este año',
  'custom':     '···',
};

function fmtShort(value: number, cur: Currency): string {
  if (cur === 'USD') {
    if (value >= 1000) return `U$${(value / 1000).toFixed(1).replace('.0', '')}K`;
    return `U$${Math.round(value)}`;
  }
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${Math.round(value)}`;
}

export default function SummaryScreen() {
  const { workspace, members, categories, currentMember, blueRate, refreshBlueRate } = useApp();
  const isOwner = currentMember?.role === 'owner';
  const [preset, setPreset] = useState<Preset>('this-month');
  const [from, setFrom] = useState(MONTHS[0].value);
  const [to, setTo] = useState(MONTHS[0].value);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUSD, setShowUSD] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [drillCat, setDrillCat] = useState<{id: string; name: string; color: string} | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<'monthly' | 'weekly'>('monthly');

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p === 'this-week') {
      setGranularity('weekly');
      setSelectedMonth(getMondayKey(arDate()));
    } else if (p === 'last-week') {
      setGranularity('weekly');
      setSelectedMonth(getMondayKey(arDate(new Date(Date.now() - 7 * 86_400_000))));
    } else if (p === 'this-month') {
      setGranularity('monthly');
      setFrom(MONTHS[0].value); setTo(MONTHS[0].value);
    } else if (p === 'last-month') {
      setGranularity('monthly');
      const m1 = MONTHS[1] ?? MONTHS[0];
      setFrom(m1.value); setTo(m1.value);
    } else if (p === '3-months') {
      setGranularity('monthly');
      setFrom(MONTHS[Math.min(2, MONTHS.length - 1)].value); setTo(MONTHS[0].value);
    } else if (p === 'ytd') {
      setGranularity('monthly');
      setFrom(`${arDate().slice(0, 4)}-01`); setTo(MONTHS[0].value);
    }
    // 'custom': keep current granularity/from/to; user adjusts manually
  }

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);

    let startDate: string, endDate: string;
    if (granularity === 'weekly') {
      startDate = getMondayKey(arDate(new Date(Date.now() - 7 * 7 * 86_400_000)));
      endDate = arDate(new Date(Date.now() + 86_400_000)); // tomorrow in AR time (exclusive upper bound)
    } else {
      const start = (from < to ? from : to);
      const end   = (from < to ? to : from);
      startDate = `${start}-01T00:00:00`;
      const endD = new Date(`${end}-01`); endD.setMonth(endD.getMonth()+1);
      endDate = endD.toISOString();
    }

    let q = supabase.from('expenses')
      .select('*, categories(name,color,icon), members(display_name,id)')
      .eq('workspace_id', workspace.id)
      .gte('date', startDate).lt('date', endDate)
      .order('date', { ascending: false });
    if (memberId) q = q.eq('member_id', memberId);

    const { data } = await q;
    setExpenses(data ?? []);
    setLoading(false);
  }, [workspace, from, to, memberId, granularity]);

  useEffect(() => {
    load();
    if (!blueRate || Date.now() - new Date(blueRate.fetchedAt).getTime() > 300_000) {
      refreshBlueRate();
    }
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Pre-compute display amount per expense once — avoids O(n×3) calls per render
  const displayAmounts = useMemo(() => {
    const rate = blueRate?.venta ?? 1400;
    const map = new Map<string, number>();
    expenses.forEach(e => {
      if (!showUSD) {
        map.set(e.id, e.amount_ars != null ? e.amount_ars : e.currency === 'USD' ? e.amount * rate : e.amount);
      } else {
        map.set(e.id, e.amount_usd != null ? e.amount_usd : e.currency === 'ARS' ? e.amount / rate : e.amount);
      }
    });
    return map;
  }, [expenses, showUSD, blueRate?.venta]);

  const total = useMemo(
    () => expenses.reduce((s, e) => s + (displayAmounts.get(e.id) ?? 0), 0),
    [expenses, displayAmounts]
  );

  // Monthly chart range
  const range = useMemo(() => {
    const out: string[] = [];
    const s = from < to ? from : to, en = from < to ? to : from;
    const [sy, sm] = s.split('-').map(Number), [ey, em] = en.split('-').map(Number);
    let y = sy, m = sm;
    while (y < ey || (y === ey && m <= em)) {
      out.push(`${y}-${String(m).padStart(2, '0')}`);
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }, [from, to]);

  // Reset selectedMonth when range or member changes (not granularity — applyPreset handles that explicitly)
  useEffect(() => { setSelectedMonth(null); }, [from, to, memberId]);

  // Single-pass chart data — unified shape for both monthly and weekly
  const chartData = useMemo(() => {
    if (granularity === 'monthly') {
      const monthTotals: Record<string, number> = {};
      expenses.forEach(e => {
        const mo = e.date.slice(0, 7);
        monthTotals[mo] = (monthTotals[mo] ?? 0) + (displayAmounts.get(e.id) ?? 0);
      });
      return range.map(mo => ({
        periodKey: mo,
        label: new Date(`${mo}-02T12:00:00Z`).toLocaleString('es-AR', { month: 'short' }).replace('.', ''),
        total: Math.round(monthTotals[mo] ?? 0),
      }));
    } else {
      const weeks8 = getWeeks8();
      const weekTotals: Record<string, number> = {};
      expenses.forEach(e => {
        const wk = getMondayKey(e.date);
        weekTotals[wk] = (weekTotals[wk] ?? 0) + (displayAmounts.get(e.id) ?? 0);
      });
      return weeks8.map(wk => ({
        periodKey: wk,
        label: getWeekLabel(wk),
        total: Math.round(weekTotals[wk] ?? 0),
      }));
    }
  }, [expenses, displayAmounts, range, granularity]);

  // Category breakdown — key included to avoid reverse-lookup in render
  const breakdown = useMemo(() => {
    const src = selectedMonth
      ? expenses.filter(e => granularity === 'weekly'
          ? getMondayKey(e.date) === selectedMonth
          : e.date.startsWith(selectedMonth))
      : expenses;
    const catMap: Record<string, { name: string; color: string; total: number; key: string }> = {};
    src.forEach(e => {
      const cat = e.categories as any;
      const key = e.category_id ?? '__null__';
      if (!catMap[key]) catMap[key] = { name: cat?.name ?? 'Sin categoría', color: cat?.color ?? '#888780', total: 0, key };
      catMap[key].total += displayAmounts.get(e.id) ?? 0;
    });
    return Object.values(catMap).sort((a, b) => b.total - a.total);
  }, [expenses, selectedMonth, displayAmounts, granularity]);

  const catPeriodLabel = selectedMonth
    ? (granularity === 'weekly'
        ? getWeekLabel(selectedMonth)
        : new Date(`${selectedMonth}-02T12:00:00Z`).toLocaleString('es-AR', { month: 'long', year: '2-digit' }).replace('.',''))
    : null;

  return (
    <div className="wrap">
      {/* Preset chips */}
      <div className="preset-row">
        {(Object.keys(PRESET_LABELS) as Preset[]).map(p => (
          <button
            key={p}
            className={`preset-chip ${preset === p ? 'preset-chip--active' : ''}`}
            onClick={() => applyPreset(p)}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Custom: granularity toggle + manual selectors */}
      {preset === 'custom' && (
        <>
          <div className="gran-toggle">
            <button className={`gran-btn ${granularity === 'monthly' ? 'gran-btn--active' : ''}`} onClick={() => setGranularity('monthly')}>Mensual</button>
            <button className={`gran-btn ${granularity === 'weekly' ? 'gran-btn--active' : ''}`} onClick={() => setGranularity('weekly')}>Semanal</button>
          </div>
          {granularity === 'monthly' && (
            <div className="selectors">
              <Select label="Desde" value={from} onChange={setFrom} />
              <Select label="Hasta" value={to} onChange={setTo} />
            </div>
          )}
        </>
      )}

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
              <p className="section-label">{granularity === 'weekly' ? 'Por semana' : 'Por mes'}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={BAR_MARGIN} style={{cursor:'pointer'}}>
                  <XAxis dataKey="label" tick={{fontSize:12,fill:'#6B6B6B'}} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{fill:'#f0f0ee'}}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const pk = (payload[0].payload as any).periodKey;
                      const isActive = selectedMonth === pk;
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
                    const pk = data.periodKey;
                    setSelectedMonth((prev: string | null) => prev === pk ? null : pk);
                  }}>
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: unknown) => fmtShort(Number(v), displayCur)}
                      style={{ fontSize: 11, fontWeight: 700, fill: '#6B6B6B' }}
                    />
                    {chartData.map((d,i)=>(
                      <Cell key={i} fill={selectedMonth && selectedMonth !== d.periodKey ? '#b2d8cc' : '#1D9E75'} />
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
                  : <button className="period-badge period-badge--muted" disabled>todo el período</button>
                }
              </div>
              {(() => {
                const breakdownTotal = breakdown.reduce((s, c) => s + c.total, 0);
                return breakdown.map((c,i) => {
                const catId = c.key === '__null__' ? '' : c.key;
                const pct = breakdownTotal > 0 ? c.total / breakdownTotal * 100 : 0;
                const pctLabel = pct < 1 ? '<1%' : `${Math.round(pct)}%`;
                return (
                  <button key={i} className="cat-row cat-row--btn" onClick={() => setDrillCat({id: catId, name: c.name, color: c.color})}>
                    <span className="cat-dot" style={{background:c.color}} />
                    <span className="cat-name">{c.name}</span>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{width:`${Math.min(100,pct)}%`,background:c.color}} />
                    </div>
                    <span className="cat-amount">{formatAmount(c.total,displayCur)}</span>
                    <span className="cat-pct">{pctLabel}</span>
                  </button>
                );
              })})()}
            </div>
          )}

          {drillCat && (
            <DrillModal
              catId={drillCat.id}
              catName={drillCat.name}
              catColor={drillCat.color}
              expenses={selectedMonth
                ? expenses.filter(e => granularity === 'weekly'
                    ? getMondayKey(e.date) === selectedMonth
                    : e.date.startsWith(selectedMonth))
                : expenses}
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
        .preset-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .preset-row::-webkit-scrollbar { display: none; }
        .preset-chip { flex-shrink: 0; padding: 7px 14px; border: 1.5px solid var(--border); border-radius: 20px; font-size: 13px; font-weight: 600; background: var(--surface); color: var(--text-secondary); cursor: pointer; white-space: nowrap; transition: all 0.15s; }
        .preset-chip--active { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }
        .gran-toggle { display: flex; background: var(--bg); border-radius: 10px; padding: 3px; }
        .gran-btn { flex: 1; padding: 9px; border: none; background: none; border-radius: 8px; font-size: 14px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; }
        .gran-btn--active { background: var(--surface); color: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
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
        .chart-card :global(*:focus:not(:focus-visible)) { outline: none; }
        .tt-box { background: var(--surface); border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; min-width: 140px; }
        .tt-month { font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.4px; margin: 0 0 2px; }
        .tt-total { font-size: 15px; font-weight: 800; color: var(--text); margin: 0 0 6px; }
        .tt-action { font-size: 12px; font-weight: 700; color: var(--primary); margin: 0; }
        .section { background: var(--surface); border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .section-label { font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
        .period-badge { border: none; background: var(--primary-light); color: var(--primary); font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 6px; cursor: pointer; }
        .period-badge--muted { background: var(--bg); color: var(--text-tertiary); cursor: default; border: 1.5px solid var(--border); }
        .cat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .cat-row--btn { width: 100%; border: none; background: none; padding: 0; cursor: pointer; text-align: left; border-radius: 8px; transition: background 0.1s; }
        .cat-row--btn:hover { background: var(--bg); }
        .cat-dot { width:10px;height:10px;border-radius:50%;flex-shrink:0; }
        .cat-name { width: 100px; font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bar-bg { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
        .cat-amount { font-size: 13px; font-weight: 700; color: var(--text); min-width: 80px; text-align: right; }
        .cat-pct { font-size: 11px; font-weight: 600; color: var(--text-tertiary); min-width: 28px; text-align: right; }
        .empty { text-align: center; color: var(--text-tertiary); padding: 40px 0; margin: 0; }
      `}</style>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
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

  const items = useMemo(
    () => expenses
      .filter(e => catId ? e.category_id === catId : !e.category_id)
      .sort((a, b) => toDisplay(b) - toDisplay(a)),
    [expenses, catId, toDisplay]
  );

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
