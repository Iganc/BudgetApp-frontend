import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Stałe dla typów transakcji
const TRANSACTION_TYPES = ['EXPENSE', 'INCOME'];

export default function CreateTransactionPage() {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState(TRANSACTION_TYPES[0]);
    const [budgetId, setBudgetId] = useState('');
    const [availableBudgets, setAvailableBudgets] = useState([]);

    const [loadingBudgets, setLoadingBudgets] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const navigate = useNavigate();

    // 1. POBIERANIE DOSTĘPNYCH BUDŻETÓW
    useEffect(() => {
        const fetchBudgets = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/budgets', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch budgets');
                const data = await response.json();
                setAvailableBudgets(data);

                // Opcjonalnie: ustawienie pierwszego budżetu jako domyślny wybór
                if (data.length > 0) {
                    setBudgetId(data[0].id.toString());
                } else {
                    setBudgetId('');
                }
            } catch (e) {
                setError("Could not load budgets: " + e.message);
            } finally {
                setLoadingBudgets(false);
            }
        };
        if (token) {
            fetchBudgets();
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const payload = {
            amount: parseFloat(amount),
            description: description || null,
            category: category,
            type: type,
            date: new Date().toISOString(), // Ustawienie aktualnej daty
            // Wymagana struktura dla budżetu, aby backend odebrał ID
            budget: budgetId ? { id: parseInt(budgetId) } : null,
        };

        try {
            const response = await fetch('http://localhost:8080/api/transactions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to create transaction. Status: ${response.status}`);
            }

            navigate('/budgets'); // Przekierowanie po sukcesie
        } catch (err) {
            console.error('Caught error:', err);
            setError(err.message);
        }
    };

    if (loadingBudgets) return <div>Loading budgets for selection...</div>;

    return (
        <div>
            <h1>Add New Transaction</h1>
            {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>

                {/* Pole Typ (INCOME/EXPENSE) */}
                <label>
                    Transaction Type:
                    <select value={type} onChange={(e) => setType(e.target.value)} style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}>
                        {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </label>

                {/* Pole Kwota */}
                <label>
                    Amount (PLN):
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }} />
                </label>

                {/* Pole Kategoria */}
                <label>
                    Category:
                    <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }} />
                </label>

                {/* Pole Opis */}
                <label>
                    Description (optional):
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }} />
                </label>

                {/* Pole Wybór Budżetu */}
                <label>
                    Assign to Budget:
                    {availableBudgets.length > 0 ? (
                        <select value={budgetId} onChange={(e) => setBudgetId(e.target.value)} style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}>
                            {/* Opcja na transakcje bez budżetu, jeśli chcesz to dopuścić. Wymagałoby: <option value="">None</option> */}
                            {availableBudgets.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    ) : (
                        <p style={{ color: '#888' }}>No budgets available. Create one first!</p>
                    )}
                </label>

                <button type="submit" disabled={availableBudgets.length === 0} style={{ padding: '10px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    Add Transaction
                </button>
            </form>
        </div>
    );
}