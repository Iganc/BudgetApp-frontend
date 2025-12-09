import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function BudgetsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token'); // lub sessionStorage.getItem('token')

    fetch('/api/budgets', {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => mounted && setItems(data))
      .catch(e => mounted && setErr(e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Loading budgets...</div>;
  if (err) return <div>Error: {err}</div>;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Budgets</h1>
        <Link to="/transactions/new">Add Transaction</Link>
      </header>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {items.map(b => (
          <div key={b.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
            <Link to={`/budgets/${b.id}`} style={{ fontWeight: 600 }}>{b.name ?? `Budget ${b.id}`}</Link>
            <div>Amount: {b.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}