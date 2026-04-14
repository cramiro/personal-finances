'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { parseExpense, formatAmount } from '@/lib/parser';
import { supabase } from '@/lib/supabase';
import { getDailyRate } from '@/lib/blueRate';
import { Expense, Category } from '@/types';
import ExpenseDetailModal from '@/components/ExpenseDetailModal';

const CAT_COLORS = ['#1D9E75','#378ADD','#D85A30','#7F77DD','#BA7517','#D4537E','#E24B4A','#639922','#534AB7','#888780'];

export default function HomeScreen() {
  const { workspace, currentMember, categories, reloadCategories } = useApp();
  const [input, setInput] = useState('');
  const [recents, setRecents] = useState<Expense[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [showRecents, setShowRecents] = useState(false);
  const [overrideCategoryId, setOverrideCategoryId] = useState<string | null>(null);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const parsed = useMemo(
    () => parseExpense(input, categories, workspace?.default_currency ?? 'ARS'),
    [input, categories, workspace?.default_currency]
  );
  const hasInput = input.trim().length > 0;

  // Reset category override whenever the user changes the input
  useEffect(() => { setOverrideCategoryId(null); }, [input]);

  const activeCategoryId = overrideCategoryId ?? parsed.categoryId;
  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const activeCategoryName  = activeCategory?.name  ?? parsed.categoryName;
  const activeCategoryColor = activeCategory?.color ?? parsed.categoryColor;
  const isOwner = currentMember?.role === 'owner';

  const loadRecents = useCallback(async () => {
    if (!workspace) return;
    const { data } = await supabase
      .from('expenses')
      .select('*, categories(name,color,icon), members(display_name)')
      .eq('workspace_id', workspace.id)
      .order('date', { ascending: false })
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
      category_id: activeCategoryId,
      date: new Date().toISOString(),
    });
    setSaving(false);
    if (!error) {
      setInput('');
      setOverrideCategoryId(null);
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
            <span className="cat-dot" style={{ background: activeCategoryColor }} />
            <div className="preview-info">
              <span className="preview-amount">{formatAmount(parsed.amount, parsed.currency)}</span>
              <button type="button" className="preview-cat-btn" onClick={() => setShowCatPicker(true)}>
                {activeCategoryName} ›
              </button>
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

      {showCatPicker && workspace && (
        <CategoryPickerSheet
          categories={categories}
          workspaceId={workspace.id}
          selectedId={activeCategoryId}
          onSelect={id => { setOverrideCategoryId(id); setShowCatPicker(false); }}
          onCreated={async id => { await reloadCategories(); setOverrideCategoryId(id); setShowCatPicker(false); }}
          onClose={() => setShowCatPicker(false)}
        />
      )}

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
        .preview-cat-btn { background: none; border: none; padding: 0; font-size: 13px; color: var(--primary); font-weight: 600; cursor: pointer; text-align: left; }
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

function CategoryPickerSheet({ categories, workspaceId, selectedId, onSelect, onCreated, onClose }: {
  categories: Category[];
  workspaceId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreated: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CAT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    const maxOrder = Math.max(0, ...categories.map(c => c.sort_order));
    const { data } = await supabase
      .from('categories')
      .insert({ workspace_id: workspaceId, name, color: newColor, icon: '📦', keywords: [], is_default: false, sort_order: maxOrder + 1 })
      .select()
      .single();
    setSaving(false);
    if (data) await onCreated(data.id);
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="sheet-header">
          <p className="sheet-title">Categoría</p>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="cat-list">
          {categories.map(c => (
            <button key={c.id} className={`cat-option ${selectedId === c.id ? 'cat-option--active' : ''}`} onClick={() => onSelect(c.id)}>
              <span className="dot" style={{ background: c.color }} />
              <span className="cat-label">{c.name}</span>
              {selectedId === c.id && <span className="check">✓</span>}
            </button>
          ))}
        </div>
        <div className="divider" />
        {!creating ? (
          <button className="new-cat-btn" onClick={() => setCreating(true)}>+ Nueva categoría</button>
        ) : (
          <div className="new-cat-form">
            <input
              className="name-input"
              placeholder="Nombre"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <div className="color-row">
              {CAT_COLORS.map(col => (
                <button
                  key={col}
                  type="button"
                  className={`color-swatch ${newColor === col ? 'color-swatch--active' : ''}`}
                  style={{ background: col }}
                  onClick={() => setNewColor(col)}
                />
              ))}
            </div>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setCreating(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleCreate} disabled={saving || !newName.trim()}>
                {saving ? 'Guardando...' : 'Crear'}
              </button>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 400; }
        .sheet { background: var(--surface); border-radius: 20px 20px 0 0; padding: 20px; width: 100%; max-width: 480px; max-height: 80dvh; display: flex; flex-direction: column; }
        .sheet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .sheet-title { font-size: 16px; font-weight: 700; margin: 0; }
        .close-btn { border: none; background: none; font-size: 18px; color: var(--text-tertiary); padding: 4px; cursor: pointer; }
        .cat-list { overflow-y: auto; display: flex; flex-direction: column; gap: 2px; margin-bottom: 4px; }
        .cat-option { display: flex; align-items: center; gap: 10px; padding: 11px 8px; border: none; background: none; border-radius: 8px; cursor: pointer; width: 100%; text-align: left; }
        .cat-option:hover { background: var(--bg); }
        .cat-option--active { background: var(--primary-light); }
        .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .cat-label { flex: 1; font-size: 14px; font-weight: 500; color: var(--text); }
        .check { font-size: 14px; font-weight: 700; color: var(--primary); }
        .divider { height: 1px; background: var(--border); margin: 8px 0; }
        .new-cat-btn { background: none; border: none; padding: 10px 8px; font-size: 14px; font-weight: 700; color: var(--primary); cursor: pointer; text-align: left; width: 100%; }
        .new-cat-form { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; }
        .name-input { border: 1.5px solid var(--border); border-radius: 8px; padding: 11px 12px; font-size: 15px; color: var(--text); width: 100%; font-family: inherit; background: var(--surface); }
        .name-input:focus { border-color: var(--primary); outline: none; }
        .color-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .color-swatch { width: 28px; height: 28px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; }
        .color-swatch--active { border-color: var(--text); }
        .form-actions { display: flex; gap: 8px; }
        .btn-ghost { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 11px; font-size: 14px; font-weight: 600; color: var(--text-secondary); background: none; cursor: pointer; }
        .btn-primary { flex: 1; background: var(--primary); color: white; border: none; border-radius: 10px; padding: 11px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .btn-primary:disabled { opacity: 0.5; }
      `}</style>
    </div>
  );
}

