import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function BudgetCard({ budget, onEdit, onDelete }) {
  const [busy, setBusy] = useState(false);

  return (
    <div style={{
      border: '1px solid #eee', padding: 12, borderRadius: 6,
      display: 'flex', flexDirection: 'column', gap: 8
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
        <Link to={`/budgets/${budget.id}`} style={{ fontWeight: 700 }}>{budget.name ?? `Budget ${budget.id}`}</Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setBusy(true); Promise.resolve(onEdit(budget)).finally(() => setBusy(false)); }}
            disabled={busy}
            aria-label="Edit budget"
          >
            Edit
          </button>
          <button
            onClick={() => { if (confirm('Delete this budget?')) { setBusy(true); Promise.resolve(onDelete(budget)).finally(() => setBusy(false)); } }}
            disabled={busy}
            aria-label="Delete budget"
          >
            Delete
          </button>
        </div>
      </div>
      <div>Amount: {budget.amount}</div>
      {budget.description && <div style={{ color: '#555' }}>{budget.description}</div>}
    </div>
  );
}

// language: javascript
// file: src/pages/BudgetsPage.js
import React, { useEffect, useState } from 'react';
import BudgetCard from '../components/BudgetCard';

export default function BudgetsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', description: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchBudgets(); }, []);

  async function fetchBudgets() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/budgets', { credentials: 'include' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setItems(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function filtered() {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(b => (b.name || '').toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q));
  }

  async function handleCreate(e) {
    e?.preventDefault();
    if (!form.name || form.amount === '') return alert('Name and amount required');
    const payload = { name: form.name, amount: Number(form.amount), description: form.description };
    // optimistic UI
    const temp = { ...payload, id: `temp-${Date.now()}` };
    setItems(prev => [temp, ...prev]);
    setShowCreate(false);
    setForm({ name: '', amount: '', description: '' });
    try {
      const r = await fetch('/api/budgets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const created = await r.json();
      setItems(prev => prev.map(it => it.id === temp.id ? created : it));
    } catch (e) {
      // rollback
      setItems(prev => prev.filter(it => it.id !== temp.id));
      alert('Create failed: ' + e.message);
    }
  }

  async function handleEdit(budget) {
    const newName = prompt('Name', budget.name);
    if (newName == null) return;
    const newAmount = prompt('Amount', String(budget.amount ?? '0'));
    if (newAmount == null) return;
    const payload = { ...budget, name: newName, amount: Number(newAmount) };
    // optimistic update
    setItems(prev => prev.map(it => it.id === budget.id ? payload : it));
    try {
      const r = await fetch(`/api/budgets/${budget.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const updated = await r.json();
      setItems(prev => prev.map(it => it.id === budget.id ? updated : it));
    } catch (e) {
      alert('Update failed: ' + e.message);
      fetchBudgets();
    }
  }

  async function handleDelete(budget) {
    // optimistic remove
    const prev = items;
    setItems(prevItems => prevItems.filter(it => it.id !== budget.id));
    try {
      const r = await fetch(`/api/budgets/${budget.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      alert('Delete failed: ' + e.message);
      setItems(prev);
    }
  }

  if (loading) return <div>Loading budgets...</div>;
  if (err) return <div>Error: {err}</div>;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Budgets</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Search budgets"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search budgets"
          />
          <button onClick={() => setShowCreate(s => !s)}>{showCreate ? 'Close' : 'New Budget'}</button>
          <button onClick={fetchBudgets}>Refresh</button>
        </div>
      </header>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ marginBottom: 12, display: 'grid', gap: 8, maxWidth: 420 }}>
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <input placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))'
      }}>
        {filtered().map(b => (
          <BudgetCard key={b.id} budget={b} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
        {filtered().length === 0 && <div>No budgets found</div>}
      </div>
    </div>
  );
}