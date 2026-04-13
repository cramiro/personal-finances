'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';
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

function GeneralTab() {
  const { workspace, members, logout } = useApp();
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (!workspace) return;
    navigator.clipboard.writeText(workspace.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="content">
      <section className="card">
        <h3 className="card-title">Workspace</h3>
        <Row label="Nombre" value={workspace?.name??''} />
        <Row label="Moneda default" value={workspace?.default_currency??'ARS'} />
      </section>

      <section className="card">
        <h3 className="card-title">Miembros</h3>
        {members.map(m=><Row key={m.id} label={m.display_name} value={m.role==='owner'?'owner':'miembro'} />)}
      </section>

      <section className="card">
        <h3 className="card-title">Código de invitación</h3>
        <p style={{fontSize:13,color:'var(--text-secondary)',margin:'0 0 10px',lineHeight:1.5}}>
          Compartí este código para que otros puedan unirse a tu workspace.
        </p>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <code style={{flex:1,background:'var(--bg)',border:'1.5px solid var(--border)',borderRadius:8,padding:'10px 12px',fontSize:11,color:'var(--text-secondary)',wordBreak:'break-all'}}>
            {workspace?.id}
          </code>
          <button className="btn-primary sm" onClick={copyCode} style={{flexShrink:0}}>
            {copied ? '✓' : 'Copiar'}
          </button>
        </div>
      </section>

      <button className="danger-btn" onClick={logout}>Cerrar sesión</button>

      <style jsx>{`
        .content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .card { background: var(--surface); border-radius: 12px; padding: 16px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-size: 13px; font-weight: 700; color: var(--text-secondary); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.4px; }
        .link-btn { background: none; border: none; color: var(--primary); font-weight: 700; font-size: 14px; }
        .add-row { margin-top: 10px; }
        .input { width: 100%; border: 1.5px solid var(--border); border-radius: 8px; padding: 10px 12px; font-size: 14px; color: var(--text); }
        .input:focus { border-color: var(--primary); }
        .btn-primary { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 9px 16px; font-size: 14px; font-weight: 700; }
        .btn-ghost { background: none; border: 1.5px solid var(--border); border-radius: 8px; padding: 9px 16px; font-size: 14px; font-weight: 600; color: var(--text-secondary); }
        .sm { font-size: 13px; }
        .danger-btn { border: 1.5px solid var(--danger); background: none; color: var(--danger); border-radius: 10px; padding: 13px; font-size: 15px; font-weight: 700; }
      `}</style>
    </div>
  );
}

function Row({ label, value }: { label:string; value:string }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderTop:'1px solid var(--border)'}}>
      <span style={{fontSize:14,color:'var(--text)'}}>{label}</span>
      <span style={{fontSize:14,color:'var(--text-secondary)'}}>{value}</span>
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
        .field-input { border:1.5px solid var(--border);border-radius:8px;padding:11px 12px;font-size:14px;color:var(--text);width:100%;resize:none;font-family:inherit; }
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
