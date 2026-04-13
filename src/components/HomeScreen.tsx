'use client';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { parseExpense, formatAmount } from '@/lib/parser';
import { supabase } from '@/lib/supabase';
import { Expense, Category } from '@/types';

export default function HomeScreen() {
  const { workspace, currentMember, categories } = useApp();
  const [input, setInput] = useState('');
  const [recents, setRecents] = useState<Expense[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

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

  useEffect(() => {
    if (!openMenu) return;
    function close() { setOpenMenu(null); }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenu]);

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

  async function handleDelete(id: string) {
    setOpenMenu(null);
    if (!confirm('¿Eliminar este gasto?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    loadRecents();
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
              {isOwner && (
                <div className="menu-wrap">
                  <button className="menu-trigger" onClick={() => setOpenMenu(openMenu === e.id ? null : e.id)}>···</button>
                  {openMenu === e.id && (
                    <div className="menu-dropdown">
                      <button className="menu-item" onClick={() => { setOpenMenu(null); setEditing(e); }}>Editar</button>
                      <button className="menu-item menu-item--danger" onClick={() => handleDelete(e.id)}>Eliminar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <EditModal
          expense={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); loadRecents(); }}
        />
      )}

      <style jsx>{`
        .home { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
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
        .section-label { font-size: 12px; font-weight: 700; color: var(--text-tertiary); letter-spacing: 0.5px; text-transform: uppercase; margin: 4px 0 0; }
        .expense-list { display: flex; flex-direction: column; gap: 2px; }
        .expense-row { display: flex; align-items: center; gap: 10px; background: var(--surface); border-radius: 10px; padding: 12px; }
        .exp-info { flex: 1; overflow: hidden; }
        .exp-desc { display: block; font-size: 14px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .exp-meta { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .exp-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .exp-amount { font-size: 14px; font-weight: 700; color: var(--text); }
        .exp-time { font-size: 11px; color: var(--text-tertiary); }
        .menu-wrap { position: relative; flex-shrink: 0; }
        .menu-trigger { border: none; background: none; font-size: 18px; font-weight: 700; color: var(--text-tertiary); padding: 4px 6px; cursor: pointer; border-radius: 6px; line-height: 1; letter-spacing: 1px; }
        .menu-trigger:hover { color: var(--text-secondary); }
        .menu-dropdown { position: absolute; right: 0; top: calc(100% + 4px); background: var(--surface); border: 1.5px solid var(--border); border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index: 50; min-width: 110px; overflow: hidden; }
        .menu-item { display: block; width: 100%; text-align: left; border: none; background: none; padding: 11px 14px; font-size: 14px; font-weight: 600; color: var(--text); cursor: pointer; }
        .menu-item:hover { background: var(--bg); }
        .menu-item--danger { color: var(--danger); }
        .empty { color: var(--text-tertiary); font-size: 14px; text-align: center; padding: 32px 0; margin: 0; }
      `}</style>
    </div>
  );
}

function EditModal({ expense, categories, onClose, onSaved }: {
  expense: Expense;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(String(expense.amount));
  const [description, setDescription] = useState(expense.description);
  const [categoryId, setCategoryId] = useState(expense.category_id);
  const [currency, setCurrency] = useState(expense.currency);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const num = parseFloat(amount.replace(',', '.'));
    if (!num || num <= 0) return;
    setSaving(true);
    await supabase.from('expenses').update({
      amount: num,
      description: description.trim(),
      category_id: categoryId,
      currency,
    }).eq('id', expense.id);
    setSaving(false);
    onSaved();
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3 className="title">Editar gasto</h3>

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

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: flex-end; justify-content: center; z-index: 200; }
        .modal { background: var(--surface); border-radius: 20px 20px 0 0; padding: 24px; width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 10px; }
        .title { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
        .label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .input { border: 1.5px solid var(--border); border-radius: 8px; padding: 11px 12px; font-size: 15px; color: var(--text); width: 100%; font-family: inherit; }
        .input:focus { border-color: var(--primary); outline: none; }
        .amount-row { display: flex; gap: 8px; align-items: center; }
        .amount-row .input { flex: 1; }
        .currency-toggle { display: flex; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; }
        .cur-btn { border: none; padding: 10px 12px; font-size: 13px; font-weight: 700; background: var(--surface); color: var(--text-secondary); cursor: pointer; }
        .cur-btn.active { background: var(--primary); color: white; }
        .modal-actions { display: flex; gap: 10px; margin-top: 6px; }
        .btn-primary { flex: 1; background: var(--primary); color: white; border: none; border-radius: 10px; padding: 13px; font-size: 15px; font-weight: 700; cursor: pointer; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-ghost { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 13px; font-size: 15px; font-weight: 600; color: var(--text-secondary); background: none; cursor: pointer; }
      `}</style>
    </div>
  );
}
