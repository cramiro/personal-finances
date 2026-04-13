'use client';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { parseExpense, formatAmount } from '@/lib/parser';
import { supabase } from '@/lib/supabase';
import { getDailyRate } from '@/lib/blueRate';
import { Expense } from '@/types';
import ExpenseDetailModal from '@/components/ExpenseDetailModal';

export default function HomeScreen() {
  const { workspace, currentMember, categories } = useApp();
  const [input, setInput] = useState('');
  const [recents, setRecents] = useState<Expense[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [showRecents, setShowRecents] = useState(false);

  const parsed = parseExpense(input, categories, workspace?.default_currency ?? 'ARS');
  const hasInput = input.trim().length > 0;
  const isOwner = currentMember?.role === 'owner';

  const loadRecents = useCallback(async () => {
    if (!workspace) return;
    const { data } = await supabase
      .from('expenses')
      .select('*, categories(name,color,icon), members(display_name)')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(15);
    setRecents(data ?? []);
  }, [workspace]);

  useEffect(() => { loadRecents(); }, [loadRecents]);


  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !currentMember || parsed.amount <= 0) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const rate = await getDailyRate(today);
    const amount_ars = parsed.currency === 'ARS' ? parsed.amount : parsed.amount * rate;
    const amount_usd = parsed.currency === 'USD' ? parsed.amount : parsed.amount / rate;
    const { error } = await supabase.from('expenses').insert({
      workspace_id: workspace.id,
      member_id: currentMember.id,
      amount: parsed.amount,
      currency: parsed.currency,
      amount_ars: Math.round(amount_ars),
      amount_usd: Math.round(amount_usd * 100) / 100,
      description: parsed.description || input,
      category_id: parsed.categoryId,
      date: new Date().toISOString(),
    });
    setSaving(false);
    if (!error) {
      setInput('');
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
      loadRecents();
    }
  }

  function timeAgo(d: string) {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    return `${Math.floor(diff/86400)}d`;
  }

  return (
    <div className="home">
      {workspace && <p className="ws-name">{workspace.name}</p>}
      <form onSubmit={handleConfirm} className="card">
        <input
          className="big-input"
          placeholder='"10k super" o "50usd netflix"'
          value={input}
          onChange={e => setInput(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        {hasInput && parsed.amount > 0 && (
          <div className="preview">
            <span className="cat-dot" style={{ background: parsed.categoryColor }} />
            <div className="preview-info">
              <span className="preview-amount">{formatAmount(parsed.amount, parsed.currency)}</span>
              <span className="preview-cat">{parsed.categoryName}</span>
            </div>
            {currentMember && <span className="member-badge">{currentMember.display_name}</span>}
          </div>
        )}

        <button type="submit" className="confirm-btn" disabled={!hasInput || parsed.amount <= 0 || saving}>
          {saving ? 'Guardando...' : savedMsg ? '✓ Guardado' : 'Confirmar gasto'}
        </button>
      </form>

      <button className="section-toggle" onClick={() => setShowRecents(v => !v)}>
        <span className="section-label">Recientes</span>
        <svg className={`chevron ${showRecents ? 'chevron--up' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className={`expense-list ${showRecents ? '' : 'expense-list--hidden'}`}>
        {recents.length === 0 && <p className="empty">Cargá tu primer gasto</p>}
        {recents.map(e => {
          const cat = e.categories as any;
          const mem = e.members as any;
          return (
            <button key={e.id} className="expense-row" onClick={() => setSelected(e)}>
              <span className="cat-dot" style={{ background: cat?.color ?? '#888' }} />
              <div className="exp-info">
                <span className="exp-desc">{e.description}</span>
                <span className="exp-meta">{cat?.name} · {mem?.display_name}</span>
              </div>
              <div className="exp-right">
                <span className="exp-amount">{formatAmount(e.amount, e.currency)}</span>
                <span className="exp-time">{timeAgo(e.created_at)}</span>
              </div>
              <span className="row-chevron">›</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <ExpenseDetailModal
          expense={selected}
          categories={categories}
          isOwner={isOwner}
          displayCur={selected.currency}
          toDisplay={e => e.amount}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); loadRecents(); }}
          onDeleted={() => { setSelected(null); loadRecents(); }}
        />
      )}

      <style jsx>{`
        .home { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .ws-name { font-size: 22px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; margin: 4px 0 0; }
        .card { background: var(--surface); border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); display: flex; flex-direction: column; }
        .big-input { font-size: 20px; color: var(--text); border: none; border-bottom: 1.5px solid var(--border); padding: 8px 0 12px; width: 100%; background: transparent; }
        .big-input:focus { border-bottom-color: var(--primary); }
        .preview { display: flex; align-items: center; gap: 10px; padding: 12px 0; }
        .cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
        .preview-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .preview-amount { font-size: 22px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
        .preview-cat { font-size: 13px; color: var(--text-secondary); }
        .member-badge { background: var(--primary-light); color: var(--primary); font-size: 12px; font-weight: 700; padding: 4px 9px; border-radius: 6px; }
        .confirm-btn { margin-top: 12px; background: var(--primary); color: white; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 700; transition: opacity 0.15s; width: 100%; cursor: pointer; }
        .confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .section-toggle { display: flex; align-items: center; justify-content: space-between; background: none; border: none; padding: 4px 0; cursor: pointer; width: 100%; }
        .section-label { font-size: 12px; font-weight: 700; color: var(--text-tertiary); letter-spacing: 0.5px; text-transform: uppercase; }
        .chevron { color: var(--text-tertiary); transition: transform 0.2s; flex-shrink: 0; }
        .chevron--up { transform: rotate(180deg); }
        .expense-list { display: flex; flex-direction: column; gap: 2px; }
        .expense-list--hidden { display: none; }
        .expense-row { display: flex; align-items: center; gap: 10px; background: var(--surface); border-radius: 10px; padding: 12px; width: 100%; border: none; text-align: left; cursor: pointer; }
        .expense-row:active { opacity: 0.7; }
        .exp-info { flex: 1; overflow: hidden; }
        .exp-desc { display: block; font-size: 14px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .exp-meta { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .exp-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .exp-amount { font-size: 14px; font-weight: 700; color: var(--text); }
        .exp-time { font-size: 11px; color: var(--text-tertiary); }
        .row-chevron { font-size: 18px; color: var(--text-tertiary); flex-shrink: 0; }
        .empty { color: var(--text-tertiary); font-size: 14px; text-align: center; padding: 32px 0; margin: 0; }
      `}</style>
    </div>
  );
}

