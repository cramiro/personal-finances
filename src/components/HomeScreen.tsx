'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { parseExpense, formatAmount } from '@/lib/parser';
import { supabase } from '@/lib/supabase';
import { getDailyRate } from '@/lib/blueRate';
import { Expense, Category, ShoppingItem, Member, RecurringTemplate, RecurringCheck } from '@/types';
import ExpenseDetailModal from '@/components/ExpenseDetailModal';
import { CAT_COLORS } from '@/lib/constants';

function timeAgo(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}

export default function HomeScreen() {
  const { workspace, currentMember, members, categories, reloadCategories } = useApp();
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
  const { activeCategoryName, activeCategoryColor } = useMemo(() => {
    const cat = categories.find(c => c.id === activeCategoryId);
    return {
      activeCategoryName:  cat?.name  ?? parsed.categoryName,
      activeCategoryColor: cat?.color ?? parsed.categoryColor,
    };
  }, [activeCategoryId, categories, parsed.categoryName, parsed.categoryColor]);
  const isOwner = currentMember?.role === 'owner';

  const loadRecents = useCallback(async () => {
    if (!workspace) return;
    const monthStart = new Date().toISOString().slice(0, 7) + '-01';
    const { data } = await supabase
      .from('expenses')
      .select('*, categories(name,color,icon), members(display_name)')
      .eq('workspace_id', workspace.id)
      .gte('date', monthStart)
      .order('date', { ascending: false })
      .limit(50);
    setRecents(data ?? []);
  }, [workspace]);

  useEffect(() => { loadRecents(); }, [loadRecents]);


  async function addExpenseAsRecurring(expense: Expense) {
    if (!workspace) return;
    const { data: existing } = await supabase
      .from('recurring_templates')
      .select('id, name')
      .eq('workspace_id', workspace.id);
    const name = expense.description.trim();
    if ((existing ?? []).some(t => t.name.toLowerCase() === name.toLowerCase())) return;
    const maxOrder = (existing ?? []).length;
    await supabase.from('recurring_templates').insert({
      workspace_id: workspace.id,
      name,
      category_id: expense.category_id || null,
      sort_order: maxOrder + 1,
    });
  }

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

  return (
    <div className="home">
      {workspace && <p className="ws-name">{workspace.name}</p>}
      <form onSubmit={handleConfirm} className="card">
        <input
          className="big-input"
          placeholder='"100k super" o "25k café"'
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

      {workspace?.show_recurring && currentMember && (
        <RecurringSection
          workspaceId={workspace.id}
          currentMember={currentMember}
          members={members}
          categories={categories}
          refreshKey={recents.length}
        />
      )}

      {workspace?.show_shopping_list && currentMember && (
        <ShoppingListSection
          workspaceId={workspace.id}
          currentMember={currentMember}
          members={members}
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
          onAddAsRecurring={workspace?.show_recurring ? addExpenseAsRecurring : undefined}
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

function nextMonthStart() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function RecurringSection({ workspaceId, currentMember, members, categories, refreshKey }: {
  workspaceId: string;
  currentMember: Member;
  members: Member[];
  categories: Category[];
  refreshKey: number;
}) {
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [checks, setChecks] = useState<RecurringCheck[]>([]);

  const loadAll = useCallback(async () => {
    const [{ data: tmpl }, { data: exps }, { data: chks }] = await Promise.all([
      supabase.from('recurring_templates').select('*').eq('workspace_id', workspaceId).order('sort_order'),
      supabase.from('expenses').select('id, description, category_id, member_id, date')
        .eq('workspace_id', workspaceId)
        .gte('date', currentMonth + '-01')
        .lt('date', nextMonthStart()),
      supabase.from('recurring_checks').select('*')
        .eq('workspace_id', workspaceId)
        .eq('year_month', currentMonth),
    ]);
    setTemplates(tmpl ?? []);
    setMonthExpenses((exps ?? []) as Expense[]);
    setChecks(chks ?? []);
  }, [workspaceId, currentMonth]);

  // Initial load (and reload if workspace changes)
  useEffect(() => { loadAll(); }, [loadAll]);
  // On new expense: only reload if the panel is open — avoids 3 queries per expense when closed
  // When panel opens: also reload to show fresh data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) loadAll(); }, [open, refreshKey]);

  function getStatus(t: RecurringTemplate): { paid: boolean; byMember: string | null } {
    const check = checks.find(c => c.template_id === t.id);
    if (check) return { paid: true, byMember: check.checked_by };
    const exp = monthExpenses.find(e =>
      e.description.toLowerCase().includes(t.name.toLowerCase())
    );
    if (exp) return { paid: true, byMember: exp.member_id };
    return { paid: false, byMember: null };
  }

  async function toggleCheck(t: RecurringTemplate, currentlyPaid: boolean) {
    const check = checks.find(c => c.template_id === t.id);
    // Auto-matched expenses can't be manually unticked
    const hasAutoMatch = monthExpenses.some(e =>
      e.description.toLowerCase().includes(t.name.toLowerCase())
    );
    if (hasAutoMatch) return;

    if (currentlyPaid && check) {
      setChecks(prev => prev.filter(c => c.id !== check.id));
      await supabase.from('recurring_checks').delete().eq('id', check.id);
    } else if (!currentlyPaid) {
      const payload = { workspace_id: workspaceId, template_id: t.id, year_month: currentMonth, checked_by: currentMember.id };
      const { data } = await supabase.from('recurring_checks').insert(payload).select().single();
      if (data) setChecks(prev => [...prev, data]);
    }
  }

  const pending   = templates.filter(t => !getStatus(t).paid);
  const completed = templates.filter(t =>  getStatus(t).paid);

  if (templates.length === 0) return null;

  const monthLabel = new Date().toLocaleString('es-AR', { month: 'long' });

  return (
    <>
      <button className="rec-toggle" onClick={() => setOpen(v => !v)}>
        <span className="rec-toggle-label">
          Gastos fijos — {monthLabel}
          {completed.length === templates.length
            ? <span className="rec-badge rec-badge--done">✓</span>
            : <span className="rec-badge">{completed.length}/{templates.length}</span>
          }
        </span>
        <svg className={`rec-chevron ${open ? 'rec-chevron--up' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="rec-panel">
          {[...pending, ...completed].map(t => {
            const { paid, byMember } = getStatus(t);
            const hasAutoMatch = monthExpenses.some(e =>
              e.description.toLowerCase().includes(t.name.toLowerCase())
            );
            const memberName = members.find(m => m.id === byMember)?.display_name ?? '?';
            const cat = categories.find(c => c.id === t.category_id);
            return (
              <div key={t.id} className={`rec-item ${paid ? 'rec-item--done' : ''}`}>
                <button
                  type="button"
                  className={`rec-check ${paid ? 'rec-check--paid' : ''}`}
                  onClick={() => toggleCheck(t, paid)}
                  title={hasAutoMatch ? 'Detectado automáticamente' : undefined}
                >
                  {paid ? '✓' : '○'}
                </button>
                <div className="rec-info">
                  <span className="rec-name">{t.name}</span>
                  <span className="rec-meta">
                    {paid
                      ? `pagó: ${memberName}${hasAutoMatch ? ' · auto' : ''}`
                      : cat ? `${cat.icon} ${cat.name}` : 'Sin categoría'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .rec-toggle { display: flex; align-items: center; justify-content: space-between; background: none; border: none; padding: 4px 0; cursor: pointer; width: 100%; }
        .rec-toggle-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
        .rec-badge { background: var(--primary); color: white; font-size: 11px; font-weight: 700; border-radius: 10px; padding: 1px 7px; line-height: 1.6; }
        .rec-badge--done { background: #1D9E75; }
        .rec-chevron { color: var(--text-tertiary); transition: transform 0.2s; flex-shrink: 0; }
        .rec-chevron--up { transform: rotate(180deg); }
        .rec-panel { background: var(--surface); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; }
        .rec-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid var(--border); }
        .rec-item:first-child { border-top: none; }
        .rec-item--done { opacity: 0.5; }
        .rec-check { width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--border); background: none; cursor: pointer; font-size: 13px; font-weight: 700; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .rec-check--paid { border-color: var(--primary); background: var(--primary); color: white; }
        .rec-info { flex: 1; }
        .rec-name { display: block; font-size: 14px; font-weight: 500; color: var(--text); }
        .rec-meta { display: block; font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }
      `}</style>
    </>
  );
}

function ShoppingListSection({ workspaceId, currentMember, members }: {
  workspaceId: string;
  currentMember: Member;
  members: Member[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    setItems(data ?? []);
  }, [workspaceId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function addItem() {
    const name = newItem.trim();
    if (!name) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('shopping_items').insert({
        workspace_id: workspaceId,
        created_by: currentMember.id,
        name,
      });
      if (!error) {
        setNewItem('');
        loadItems();
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleItem(item: ShoppingItem) {
    const now = new Date().toISOString();
    const patch = item.completed_at
      ? { completed_at: null, completed_by: null }
      : { completed_at: now, completed_by: currentMember.id };
    // Optimistic update — UI responds instantly, no need to refetch
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...patch } : i));
    // Persist in background
    supabase.from('shopping_items').update(patch).eq('id', item.id);
  }

  async function deleteItem(id: string) {
    await supabase.from('shopping_items').delete().eq('id', id);
    loadItems();
  }

  async function clearCompleted() {
    const ids = completed.map(i => i.id);
    if (ids.length === 0) return;
    await supabase.from('shopping_items').delete().in('id', ids);
    loadItems();
  }

  function memberName(id: string | null) {
    if (!id) return '?';
    return members.find(m => m.id === id)?.display_name ?? '?';
  }

  const { pending, completed } = useMemo(() => ({
    pending:   items.filter(i => !i.completed_at),
    completed: items.filter(i =>  i.completed_at),
  }), [items]);

  return (
    <>
      <button className="shop-toggle" onClick={() => setOpen(v => !v)}>
        <span className="shop-toggle-label">
          Lista de compras
          {pending.length > 0 && <span className="shop-badge">{pending.length}</span>}
        </span>
        <svg className={`shop-chevron ${open ? 'shop-chevron--up' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="shop-panel">
          <div className="shop-add">
            <input
              className="shop-input"
              placeholder="Agregar ítem..."
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
            />
            <button type="button" className="shop-add-btn" onClick={addItem} disabled={saving || !newItem.trim()}>→</button>
          </div>

          {items.length === 0 && <p className="shop-empty">La lista está vacía</p>}

          {pending.map(item => (
            <div key={item.id} className="shop-item">
              <button className="check-btn" onClick={() => toggleItem(item)}>○</button>
              <div className="shop-info">
                <span className="shop-name">{item.name}</span>
                <span className="shop-meta">cargó: {memberName(item.created_by)}</span>
              </div>
              <button className="shop-del" onClick={() => deleteItem(item.id)}>✕</button>
            </div>
          ))}

          {completed.length > 0 && (
            <>
              <div className="shop-divider" />
              {completed.map(item => (
                <div key={item.id} className="shop-item shop-item--done">
                  <button className="check-btn check-btn--done" onClick={() => toggleItem(item)}>✓</button>
                  <div className="shop-info">
                    <span className="shop-name">{item.name}</span>
                    <span className="shop-meta">completó: {memberName(item.completed_by)}</span>
                  </div>
                  <button className="shop-del" onClick={() => deleteItem(item.id)}>✕</button>
                </div>
              ))}
              <button className="shop-clear" onClick={clearCompleted}>Limpiar completados</button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .shop-toggle { display: flex; align-items: center; justify-content: space-between; background: none; border: none; padding: 4px 0; cursor: pointer; width: 100%; }
        .shop-toggle-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
        .shop-chevron { color: var(--text-tertiary); transition: transform 0.2s; flex-shrink: 0; }
        .shop-chevron--up { transform: rotate(180deg); }
        .shop-badge { background: var(--primary); color: white; font-size: 11px; font-weight: 700; border-radius: 10px; padding: 1px 7px; line-height: 1.6; }
        .shop-panel { background: var(--surface); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 2px; }
        .shop-add { display: flex; gap: 8px; margin-bottom: 8px; }
        .shop-input { flex: 1; border: 1.5px solid var(--border); border-radius: 8px; padding: 10px 12px; font-size: 16px; color: var(--text); background: var(--surface); font-family: inherit; }
        .shop-input:focus { border-color: var(--primary); outline: none; }
        .shop-add-btn { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px 14px; font-size: 18px; font-weight: 700; cursor: pointer; }
        .shop-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .shop-empty { font-size: 13px; color: var(--text-tertiary); text-align: center; padding: 16px 0 8px; margin: 0; }
        .shop-item { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-top: 1px solid var(--border); }
        .shop-item--done { opacity: 0.5; }
        .check-btn { width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--border); background: none; cursor: pointer; font-size: 13px; font-weight: 700; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .check-btn--done { border-color: var(--primary); background: var(--primary); color: white; }
        .shop-info { flex: 1; overflow: hidden; }
        .shop-name { display: block; font-size: 14px; font-weight: 500; color: var(--text); }
        .shop-item--done .shop-name { text-decoration: line-through; }
        .shop-meta { display: block; font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }
        .shop-del { border: none; background: none; color: var(--text-tertiary); font-size: 14px; cursor: pointer; padding: 4px; flex-shrink: 0; }
        .shop-divider { height: 1px; background: var(--border); margin: 4px 0; }
        .shop-clear { background: none; border: none; color: var(--text-tertiary); font-size: 12px; font-weight: 600; cursor: pointer; padding: 8px 0 2px; text-align: left; }
      `}</style>
    </>
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
        .name-input { border: 1.5px solid var(--border); border-radius: 8px; padding: 11px 12px; font-size: 16px; color: var(--text); width: 100%; font-family: inherit; background: var(--surface); }
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

