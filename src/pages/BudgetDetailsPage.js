import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function BudgetDetailsPage() {
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/budgets/${id}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => mounted && setBudget(data))
      .catch(e => mounted && setErr(e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (err) return <div>Error: {err}</div>;
  if (!budget) return <div>Not found</div>;

  return (
    <div>
      <Link to="/budgets">← Back to Budgets</Link>
      <h1>{budget.name ?? `Budget ${id}`}</h1>
      <p>Amount: {budget.amount}</p>
      <p>Description: {budget.description}</p>
    </div>
  );
}