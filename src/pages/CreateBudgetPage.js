import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CreateBudgetPage() {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [hasEndDate, setHasEndDate] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      startDate: startDate,
      endDate: hasEndDate && endDate ? endDate : null,
    };

    console.log('=== SENDING BUDGET ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('hasEndDate:', hasEndDate);
    console.log('endDate value:', endDate);
    console.log('===================');

    try {
      const response = await fetch('http://localhost:8080/api/budgets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.message || 'Failed to create budget');
      }

      navigate('/budgets');
    } catch (err) {
      console.error('Caught error:', err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Create Budget</h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={hasEndDate}
            onChange={(e) => {
              setHasEndDate(e.target.checked);
              if (!e.target.checked) setEndDate('');
            }}
          />
          Set end date (leave unchecked for unlimited)
        </label>
        {hasEndDate && (
          <label>
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
        )}
        <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Create
        </button>
      </form>
    </div>
  );
}