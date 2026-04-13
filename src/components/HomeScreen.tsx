'use client';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { parseExpense, formatAmount } from '@/lib/parser';
import { supabase } from '@/lib/supabase';
import { Expense } from '@/types';

export default function HomeScreen() {
  const { workspace, currentMember, categories } = useApp();
  const [input, setInput] = useState('');
  const [recents, setRecents] = useState<Expense[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const parsed = parseExpense(input, categories, workspace?.default_currency ?? 'ARS');
  const hasInput = input.trim().length > 0;

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
    const { error } = await supabase.from('expenses').insert({
      workspace_id: workspace.id,
      member_id: currentMember.id,
      amount: parsed.amount,
      currency: parsed.currency,
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
      {/* Input card */}
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

        <button
          type="submit"
          className="confirm-btn"
          disabled={!hasInput || parsed.amount <= 0 || saving}
        >
          {saving ? 'Guardando...' : savedMsg ? '✓ Guardado' : 'Confirmar gasto'}
        </button>
      </form>

      {/* Recents */}
      <p className="section-label">Recientes</p>
      <div className="expense-list">
        {recents.length === 0 && <p className="empty">Cargá tu primer gasto</p>}
        {recents.map(e => {
          const cat = e.categories as any;
          const mem = e.members as any;
          return (
            <div key={e.id} className="expense-row">
              <span className="cat-dot" style={{ background: cat?.color ?? '#888' }} />
              <div className="exp-info">
                <span className="exp-desc">{e.description}</span>
                <span className="exp-meta">{cat?.name} · {mem?.display_name}</span>
              </div>
              <div className="exp-right">
                <span className="exp-amount">{formatAmount(e.amount, e.currency)}</span>
                <span className="exp-time">{timeAgo(e.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .home { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .card { background: var(--surface); border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 0; }
        .big-input { font-size: 20px; color: var(--text); border: none; border-bottom: 1.5px solid var(--border); padding: 8px 0 12px; width: 100%; background: transparent; }
        .big-input:focus { border-bottom-color: var(--primary); }
        .preview { display: flex; align-items: center; gap: 10px; padding: 12px 0; }
        .cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
        .preview-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .preview-amount { font-size: 22px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
        .preview-cat { font-size: 13px; color: var(--text-secondary); }
        .member-badge { background: var(--primary-light); color: var(--primary); font-size: 12px; font-weight: 700; padding: 4px 9px; border-radius: 6px; }
        .confirm-btn { margin-top: 12px; background: var(--primary); color: white; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 700; transition: opacity 0.15s; width: 100%; }
        .confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .section-label { font-size: 12px; font-weight: 700; color: var(--text-tertiary); letter-spacing: 0.5px; text-transform: uppercase; margin: 4px 0 0; }
        .expense-list { display: flex; flex-direction: column; gap: 2px; }
        .expense-row { display: flex; align-items: center; gap: 10px; background: var(--surface); border-radius: 10px; padding: 12px; }
        .exp-info { flex: 1; overflow: hidden; }
        .exp-desc { display: block; font-size: 14px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .exp-meta { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .exp-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .exp-amount { font-size: 14px; font-weight: 700; color: var(--text); }
        .exp-time { font-size: 11px; color: var(--text-tertiary); }
        .empty { color: var(--text-tertiary); font-size: 14px; text-align: center; padding: 32px 0; margin: 0; }
      `}</style>
    </div>
  );
}
