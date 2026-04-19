'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Category, Invite, RecurringTemplate } from '@/types';
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories';
import { parseExpense } from '@/lib/parser';

type Tab = 'general' | 'categories';

const COLORS = ['#1D9E75','#378ADD','#D85A30','#7F77DD','#BA7517','#D4537E','#E24B4A','#639922','#534AB7','#888780'];

export default function ConfigScreen() {
  const [tab, setTab] = useState<Tab>('general');
  return (
    <div className="wrap">
      <div className="tabs">
        {(['general','categories'] as Tab[]).map(t => (
          <button key={t} className={`tab ${tab===t?'tab--active':''}`} onClick={()=>setTab(t)}>
            {t==='general'?'General':'Categorías'}
          </button>
        ))}
      </div>
      {tab==='general' ? <GeneralTab /> : <CategoriesTab />}
      <style jsx>{`
        .wrap { display: flex; flex-direction: column; height: 100%; }
        .tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--surface); }
        .tab { flex: 1; padding: 14px; border: none; background: none; font-size: 14px; font-weight: 600; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
        .tab--active { color: var(--primary); border-bottom-color: var(--primary); }
      `}</style>
    </div>
  );
}

function timeAgoEs(d: string | null): string {
  if (!d) return 'Nunca';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 2) return 'Ayer';
  if (diff < 86400 * 7) return `Hace ${Math.floor(diff / 86400)} días`;
  return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function GeneralTab() {
  const { workspace, members, currentMember, logout, setShoppingListEnabled, setRecurringEnabled, updateWorkspaceName, updateDefaultCurrency } = useApp();
  const [copied, setCopied] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const isOwner = currentMember?.role === 'owner';

  // Inline editing state for workspace settings
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);

  async function saveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === workspace?.name) { setEditingName(false); return; }
    setSavingName(true);
    await updateWorkspaceName(trimmed);
    setSavingName(false);
    setEditingName(false);
  }

  async function saveCurrency(cur: 'ARS' | 'USD') {
    if (cur === workspace?.default_currency) { setEditingCurrency(false); return; }
    setSavingCurrency(true);
    await updateDefaultCurrency(cur);
    setSavingCurrency(false);
    setEditingCurrency(false);
  }

  useEffect(() => {
    if (!workspace || !isOwner) { setInviteLoading(false); return; }
    supabase
      .from('invites')
      .select('*')
      .eq('workspace_id', workspace.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => { setInvite(data ?? null); setInviteLoading(false); });
  }, [workspace, isOwner]);

  async function generateInvite() {
    if (!workspace || !currentMember) return;
    setGenerating(true);
    // Invalidate existing active invites
    await supabase.from('invites')
      .update({ expires_at: new Date().toISOString() })
      .eq('workspace_id', workspace.id)
      .is('used_at', null);
    // Create new invite
    const { data } = await supabase
      .from('invites')
      .insert({ workspace_id: workspace.id, created_by: currentMember.user_id })
      .select().single();
    setInvite(data ?? null);
    setGenerating(false);
  }

  function copyToken() {
    if (!invite) return;
    navigator.clipboard.writeText(invite.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function hoursLeft(expiresAt: string) {
    const h = Math.round((new Date(expiresAt).getTime() - Date.now()) / 3_600_000);
    if (h < 1) return 'menos de 1h';
    return `${h}h`;
  }

  return (
    <div className="content">
      <section className="card">
        <h3 className="card-title">Workspace</h3>

        {/* Nombre editable */}
        {editingName ? (
          <div className="edit-row">
            <input
              className="edit-input"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
              autoFocus
            />
            <button className="edit-save" onClick={saveName} disabled={savingName}>{savingName ? '...' : 'Guardar'}</button>
            <button className="edit-cancel" onClick={() => setEditingName(false)}>✕</button>
          </div>
        ) : (
          <div className="setting-row">
            <span className="setting-label">Nombre</span>
            <div className="setting-right">
              <span className="setting-value">{workspace?.name ?? ''}</span>
              {isOwner && <button className="edit-link" onClick={() => { setNameValue(workspace?.name ?? ''); setEditingName(true); }}>Editar</button>}
            </div>
          </div>
        )}

        {/* Moneda default editable */}
        {editingCurrency ? (
          <div className="edit-row">
            <span className="setting-label">Moneda</span>
            <div className="currency-toggle">
              {(['ARS', 'USD'] as const).map(c => (
                <button
                  key={c}
                  className={`cur-btn ${(workspace?.default_currency ?? 'ARS') === c ? 'cur-btn--active' : ''}`}
                  onClick={() => saveCurrency(c)}
                  disabled={savingCurrency}
                >{c}</button>
              ))}
            </div>
            <button className="edit-cancel" onClick={() => setEditingCurrency(false)}>✕</button>
          </div>
        ) : (
          <div className="setting-row">
            <span className="setting-label">Moneda default</span>
            <div className="setting-right">
              <span className="setting-value">{workspace?.default_currency ?? 'ARS'}</span>
              {isOwner && <button className="edit-link" onClick={() => setEditingCurrency(true)}>Editar</button>}
            </div>
          </div>
        )}
        {isOwner && (
          <div className="feature-row">
            <div className="feature-info">
              <span className="feature-label">Lista de compras</span>
              <span className="feature-desc">Agregar y compartir ítems pendientes</span>
            </div>
            <button
              className={`toggle ${workspace?.show_shopping_list ? 'toggle--on' : ''}`}
              onClick={() => setShoppingListEnabled(!workspace?.show_shopping_list)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        )}
        {isOwner && (
          <div className="feature-row">
            <div className="feature-info">
              <span className="feature-label">Gastos fijos</span>
              <span className="feature-desc">Checklist mensual de gastos recurrentes</span>
            </div>
            <button
              className={`toggle ${workspace?.show_recurring ? 'toggle--on' : ''}`}
              onClick={() => setRecurringEnabled(!workspace?.show_recurring)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        )}
        {isOwner && workspace?.show_recurring && <RecurringTemplatesSection />}
      </section>

      <section className="card">
        <h3 className="card-title">Miembros</h3>
        {members.map(m => (
          <div key={m.id} className="member-card">
            <div className="member-top">
              <span className="member-name">{m.display_name}</span>
              <span className="member-role">{m.role === 'owner' ? 'owner' : 'miembro'}</span>
            </div>
            {isOwner && (
              <div className="member-meta">
                <span className="meta-row">🕐 {timeAgoEs(m.last_seen_at)}</span>
                <span className="meta-row">📱 {m.last_device ?? 'Desconocido'}</span>
                <span className="meta-row">📍 {m.last_location ?? 'Desconocida'}</span>
              </div>
            )}
          </div>
        ))}
      </section>

      {isOwner && (
        <section className="card">
          <h3 className="card-title">Código de invitación</h3>
          <p className="invite-desc">Dura 48 horas y es de un solo uso. Generá uno nuevo cuando lo necesites.</p>
          {inviteLoading ? (
            <p className="invite-hint">Cargando...</p>
          ) : invite ? (
            <>
              <div className="invite-row">
                <code className="invite-token">{invite.token}</code>
                <button className="btn-primary sm" onClick={copyToken}>{copied ? '✓' : 'Copiar'}</button>
              </div>
              <div className="invite-footer">
                <span className="invite-expiry">Expira en {hoursLeft(invite.expires_at)}</span>
                <button className="btn-ghost sm" onClick={generateInvite} disabled={generating}>
                  {generating ? '...' : 'Regenerar'}
                </button>
              </div>
            </>
          ) : (
            <button className="btn-primary" onClick={generateInvite} disabled={generating}>
              {generating ? 'Generando...' : 'Generar código'}
            </button>
          )}
        </section>
      )}

      <button className="danger-btn" onClick={logout}>Cerrar sesión</button>

      <style jsx>{`
        .content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .card { background: var(--surface); border-radius: 12px; padding: 16px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-size: 13px; font-weight: 700; color: var(--text-secondary); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.4px; }
        .link-btn { background: none; border: none; color: var(--primary); font-weight: 700; font-size: 14px; }
        .add-row { margin-top: 10px; }
        .input { width: 100%; border: 1.5px solid var(--border); border-radius: 8px; padding: 10px 12px; font-size: 16px; color: var(--text); }
        .input:focus { border-color: var(--primary); }
        .btn-primary { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 9px 16px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .btn-ghost { background: none; border: 1.5px solid var(--border); border-radius: 8px; padding: 9px 16px; font-size: 14px; font-weight: 600; color: var(--text-secondary); cursor: pointer; }
        .sm { font-size: 13px; padding: 7px 12px; }
        .danger-btn { border: 1.5px solid var(--danger); background: none; color: var(--danger); border-radius: 10px; padding: 13px; font-size: 15px; font-weight: 700; cursor: pointer; }
        .member-card { border-top: 1px solid var(--border); padding: 10px 0 6px; }
        .member-top { display: flex; justify-content: space-between; align-items: center; }
        .member-name { font-size: 14px; font-weight: 700; color: var(--text); }
        .member-role { font-size: 12px; color: var(--text-tertiary); background: var(--bg); border-radius: 5px; padding: 2px 7px; font-weight: 600; }
        .member-meta { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; }
        .meta-row { font-size: 12px; color: var(--text-secondary); }
        .invite-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 12px; line-height: 1.5; }
        .invite-hint { font-size: 13px; color: var(--text-tertiary); margin: 0; }
        .invite-row { display: flex; gap: 8px; align-items: center; }
        .invite-token { flex: 1; background: var(--bg); border: 1.5px solid var(--border); border-radius: 8px; padding: 10px 12px; font-size: 12px; color: var(--text); word-break: break-all; font-family: monospace; }
        .invite-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
        .invite-expiry { font-size: 12px; color: var(--text-tertiary); }
        .setting-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-top: 1px solid var(--border); }
        .setting-label { font-size: 14px; color: var(--text); }
        .setting-right { display: flex; align-items: center; gap: 10px; }
        .setting-value { font-size: 14px; color: var(--text-secondary); }
        .edit-link { background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; }
        .edit-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-top: 1px solid var(--border); }
        .edit-input { flex: 1; border: 1.5px solid var(--primary); border-radius: 8px; padding: 8px 10px; font-size: 16px; color: var(--text); background: var(--surface); font-family: inherit; outline: none; min-width: 0; }
        .edit-save { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 8px 12px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
        .edit-save:disabled { opacity: 0.6; }
        .edit-cancel { background: none; border: none; color: var(--text-tertiary); font-size: 16px; cursor: pointer; padding: 4px; flex-shrink: 0; }
        .currency-toggle { display: flex; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; }
        .cur-btn { border: none; padding: 7px 14px; font-size: 13px; font-weight: 700; background: var(--surface); color: var(--text-secondary); cursor: pointer; }
        .cur-btn--active { background: var(--primary); color: white; }
        .feature-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0 4px; border-top: 1px solid var(--border); margin-top: 6px; }
        .feature-info { flex: 1; }
        .feature-label { display: block; font-size: 14px; font-weight: 600; color: var(--text); }
        .feature-desc { display: block; font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
        .toggle { width: 44px; height: 26px; border-radius: 13px; border: none; background: var(--border); position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0; padding: 0; }
        .toggle--on { background: var(--primary); }
        .toggle-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: white; transition: transform 0.2s; display: block; }
        .toggle--on .toggle-knob { transform: translateX(18px); }
      `}</style>
    </div>
  );
}


function RecurringTemplatesSection() {
  const { workspace, categories } = useApp();
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');

  useEffect(() => {
    if (!workspace) return;
    supabase.from('recurring_templates').select('*')
      .eq('workspace_id', workspace.id).order('sort_order')
      .then(({ data }) => setTemplates(data ?? []));
  }, [workspace]);

  async function addTemplate() {
    const name = newName.trim();
    if (!name || !workspace) return;
    const maxOrder = Math.max(0, ...templates.map(t => t.sort_order));
    await supabase.from('recurring_templates').insert({
      workspace_id: workspace.id,
      name,
      category_id: newCategoryId || null,
      sort_order: maxOrder + 1,
    });
    setNewName('');
    setNewCategoryId('');
    const { data } = await supabase.from('recurring_templates').select('*')
      .eq('workspace_id', workspace.id).order('sort_order');
    setTemplates(data ?? []);
  }

  async function deleteTemplate(id: string) {
    if (!workspace) return;
    await supabase.from('recurring_templates').delete().eq('id', id);
    const { data } = await supabase.from('recurring_templates').select('*')
      .eq('workspace_id', workspace.id).order('sort_order');
    setTemplates(data ?? []);
  }

  function getCatColor(catId: string | null) {
    if (!catId) return 'var(--border)';
    return categories.find(c => c.id === catId)?.color ?? 'var(--border)';
  }

  return (
    <div className="rt-section">
      {templates.length > 0 && (
        <div className="rt-chips">
          {templates.map(t => (
            <div key={t.id} className="rt-chip">
              <span className="rt-chip-dot" style={{ background: getCatColor(t.category_id) }} />
              <span className="rt-chip-name">{t.name}</span>
              <button type="button" className="rt-chip-del" onClick={() => deleteTemplate(t.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="rt-add-row">
        <input
          className="rt-input"
          placeholder="Nombre (ej. Alquiler)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTemplate(); } }}
        />
        <select className="rt-select" value={newCategoryId} onChange={e => setNewCategoryId(e.target.value)}>
          <option value="">Sin cat.</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <button type="button" className="rt-add-btn" onClick={addTemplate} disabled={!newName.trim()}>+</button>
      </div>
      <style jsx>{`
        .rt-section { margin-top: 8px; }
        .rt-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .rt-chip { display: flex; align-items: center; gap: 5px; background: var(--bg); border: 1.5px solid var(--border); border-radius: 20px; padding: 5px 8px 5px 10px; }
        .rt-chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .rt-chip-name { font-size: 13px; color: var(--text); font-weight: 500; }
        .rt-chip-del { border: none; background: none; color: var(--text-tertiary); font-size: 11px; cursor: pointer; padding: 0 0 0 2px; line-height: 1; }
        .rt-add-row { display: flex; gap: 8px; }
        .rt-input { flex: 1; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px; background: var(--surface); color: var(--text); font-family: inherit; min-width: 0; }
        .rt-select { padding: 8px 4px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px; background: var(--surface); color: var(--text); max-width: 90px; }
        .rt-add-btn { padding: 8px 14px; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 18px; font-weight: 700; cursor: pointer; flex-shrink: 0; }
        .rt-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function CategoriesTab() {
  const { workspace, categories, reloadCategories } = useApp();
  const [editing, setEditing] = useState<Category|null>(null);
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [color, setColor] = useState('#888780');
  const [savedCat, setSavedCat] = useState<{id:string;name:string;keywords:string[]} | null>(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessResult, setReprocessResult] = useState<number|null>(null);

  function openEdit(cat: Category) { setEditing(cat); setIsNew(false); setName(cat.name); setKeywords(cat.keywords.join(', ')); setColor(cat.color); setSavedCat(null); setReprocessResult(null); }
  function openNew() { setEditing(null); setIsNew(true); setName(''); setKeywords(''); setColor('#888780'); setSavedCat(null); setReprocessResult(null); }
  function closeModal() { setEditing(null); setIsNew(false); setSavedCat(null); setReprocessResult(null); }

  async function save() {
    if (!workspace || !name.trim()) return;
    const kws = keywords.split(',').map(k=>k.trim().toLowerCase()).filter(Boolean);
    let catId = editing?.id ?? '';
    if (editing) {
      await supabase.from('categories').update({ name:name.trim(), keywords:kws, color }).eq('id', editing.id);
    } else {
      const maxOrder = Math.max(0,...categories.map(c=>c.sort_order));
      const { data } = await supabase.from('categories').insert({ workspace_id:workspace.id, name:name.trim(), keywords:kws, color, icon:'📦', is_default:false, sort_order:maxOrder+1 }).select().single();
      catId = data?.id ?? '';
    }
    await reloadCategories();
    setSavedCat({ id: catId, name: name.trim(), keywords: kws });
    setReprocessResult(null);
  }

  async function reprocess() {
    if (!workspace || !savedCat || savedCat.keywords.length === 0) return;
    setReprocessing(true);
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, description')
      .eq('workspace_id', workspace.id)
      .gte('date', yearStart);

    // Use the same matching rules as the parser (count, then length, then order)
    const matching = (expenses ?? []).filter(e => {
      const parsed = parseExpense(e.description, categories, workspace.default_currency);
      return parsed.categoryId === savedCat.id;
    });

    if (matching.length > 0) {
      await supabase.from('expenses')
        .update({ category_id: savedCat.id })
        .in('id', matching.map(e => e.id));
    }
    setReprocessResult(matching.length);
    setReprocessing(false);
  }

  async function del(cat: Category) {
    if (!confirm(`¿Eliminar "${cat.name}"?`)) return;
    await supabase.from('categories').delete().eq('id', cat.id);
    reloadCategories();
  }

  const showModal = !!editing || isNew || !!savedCat;

  return (
    <div className="content">
      {categories.map(cat => (
        <div key={cat.id} className="cat-row">
          <span className="dot" style={{background:cat.color}} />
          <div className="cat-info">
            <span className="cat-name">{cat.name}</span>
            <span className="cat-kws">{cat.keywords.length>0 ? cat.keywords.join(', ') : 'Sin keywords'}</span>
          </div>
          <button className="edit-btn" onClick={()=>openEdit(cat)}>Editar</button>
          {!cat.is_default && <button className="del-btn" onClick={()=>del(cat)}>✕</button>}
        </div>
      ))}

      <button className="new-btn" onClick={openNew}>+ Nueva categoría</button>

      {showModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal();}}>
          <div className="modal">
            {savedCat ? (
              <>
                <h3 className="modal-title">✓ Categoría guardada</h3>
                <p className="reprocess-desc">
                  ¿Querés reprocesar los gastos del año {new Date().getFullYear()} y asignar automáticamente <strong>{savedCat.name}</strong> a los que coincidan con los keywords?
                </p>
                {savedCat.keywords.length > 0
                  ? <p className="reprocess-kws">{savedCat.keywords.join(', ')}</p>
                  : <p className="reprocess-kws reprocess-kws--empty">Sin keywords — no se puede reprocesar</p>
                }
                {reprocessResult !== null && (
                  <p className="reprocess-result">
                    {reprocessResult > 0 ? `✓ ${reprocessResult} gasto${reprocessResult !== 1 ? 's' : ''} actualizado${reprocessResult !== 1 ? 's' : ''}` : 'Ningún gasto coincidió con los keywords'}
                  </p>
                )}
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={closeModal}>Cerrar</button>
                  {savedCat.keywords.length > 0 && reprocessResult === null && (
                    <button className="btn-primary" onClick={reprocess} disabled={reprocessing}>
                      {reprocessing ? 'Procesando...' : 'Reprocesar'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="modal-title">{isNew ? 'Nueva categoría' : 'Editar categoría'}</h3>

                <label className="field-label">Nombre</label>
                <input className="field-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Supermercado" autoFocus />

                <label className="field-label">Keywords (separados por coma)</label>
                <textarea className="field-input" value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="super, coto, jumbo" rows={3} />

                <label className="field-label">Color</label>
                <div className="color-grid">
                  {COLORS.map(c=>(
                    <button key={c} className={`color-dot ${color===c?'color-dot--active':''}`} style={{background:c}} onClick={()=>setColor(c)} />
                  ))}
                </div>

                <div className="modal-actions">
                  <button className="btn-ghost" onClick={closeModal}>Cancelar</button>
                  <button className="btn-primary" onClick={save}>Guardar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .content { padding: 16px; display: flex; flex-direction: column; gap: 6px; }
        .cat-row { display:flex;align-items:center;gap:10px;background:var(--surface);border-radius:10px;padding:12px; }
        .dot { width:12px;height:12px;border-radius:50%;flex-shrink:0; }
        .cat-info { flex:1;overflow:hidden; }
        .cat-name { display:block;font-size:14px;font-weight:600;color:var(--text); }
        .cat-kws { display:block;font-size:12px;color:var(--text-secondary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .edit-btn { border:1.5px solid var(--border);border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;color:var(--text-secondary);background:none; }
        .del-btn { border:none;background:none;color:var(--danger);font-size:16px;padding:4px 6px; }
        .new-btn { border:2px dashed var(--primary);border-radius:10px;padding:13px;font-size:14px;font-weight:700;color:var(--primary);background:none;margin-top:4px; }
        .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:flex-end;justify-content:center;z-index:200; }
        .modal { background:var(--surface);border-radius:20px 20px 0 0;padding:24px;width:100%;max-width:480px;display:flex;flex-direction:column;gap:12px;max-height:90dvh;overflow-y:auto; }
        .modal-title { font-size:18px;font-weight:700;margin:0; }
        .reprocess-desc { font-size:14px;color:var(--text);line-height:1.5;margin:0; }
        .reprocess-kws { font-size:13px;color:var(--text-secondary);background:var(--bg);border-radius:8px;padding:10px 12px;margin:0; }
        .reprocess-kws--empty { color:var(--text-tertiary);font-style:italic; }
        .reprocess-result { font-size:14px;font-weight:700;color:var(--primary);margin:0;text-align:center;padding:8px 0; }
        .field-label { font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:-6px; }
        .field-input { border:1.5px solid var(--border);border-radius:8px;padding:11px 12px;font-size:16px;color:var(--text);width:100%;resize:none;font-family:inherit; }
        .field-input:focus { border-color:var(--primary);outline:none; }
        .color-grid { display:flex;gap:10px;flex-wrap:wrap; }
        .color-dot { width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer; }
        .color-dot--active { border-color:var(--text);transform:scale(1.15); }
        .modal-actions { display:flex;gap:10px;margin-top:4px; }
        .btn-primary { flex:1;background:var(--primary);color:white;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:700; }
        .btn-ghost { flex:1;border:1.5px solid var(--border);border-radius:10px;padding:13px;font-size:15px;font-weight:600;color:var(--text-secondary);background:none; }
      `}</style>
    </div>
  );
}
