import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BudgetsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    fetch('http://localhost:8080/api/budgets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(r => {
        console.log('Budgets response status:', r.status);
        if (!r.ok) {
          return r.text().then(text => {
            console.error('Budgets error response:', text);
            throw new Error(`HTTP ${r.status}: ${text}`);
          });
        }
        return r.json();
      })
      .then(data => {
        console.log('Budgets data:', data);
        if (mounted) {
          setItems(Array.isArray(data) ? data : []);
        }
      })
      .catch(e => {
        console.error('Budgets fetch error:', e);
        if (mounted) {
          setErr(e.message);
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [token, logout, navigate]);

  if (loading) return <div>Loading budgets...</div>;
  if (err) return <div>Error: {err}</div>;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Budgets</h1>
        <Link to="/budgets/new" style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: 4 }}>
          Create Budget
        </Link>
      </header>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <p>No budgets yet. Create your first budget to get started!</p>
          <Link to="/budgets/new" style={{ display: 'inline-block', marginTop: 16, padding: '8px 16px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: 4 }}>
            Create Budget
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {items.map(b => (
            <div key={b.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
              <Link to={`/budgets/${b.id}`} style={{ fontWeight: 600 }}>{b.name ?? `Budget ${b.id}`}</Link>
              <div>Amount: {b.amount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}