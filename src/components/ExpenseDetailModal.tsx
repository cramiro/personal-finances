'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getDailyRate } from '@/lib/blueRate';
import { formatAmount } from '@/lib/parser';
import { Expense, Currency, Category } from '@/types';

export default function ExpenseDetailModal({ expense, categories, isOwner, displayCur, toDisplay, onClose, onSaved, onDeleted }: {
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
    await supabase.from('expenses').update({
      amount: num,
      description: description.trim(),
      category_id: categoryId,
      currency,
      amount_ars,
      amount_usd,
    }).eq('id', expense.id);
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
                <button className="btn-danger" onClick={handleDelete}>Eliminar</button>
                <button className="btn-ghost" onClick={() => setEditing(true)}>Editar</button>
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
