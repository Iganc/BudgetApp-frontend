import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BudgetDetailsPage() {
    const { id } = useParams();
    const { token } = useAuth();

    // Stan dla budżetu
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);

    // Stan dla transakcji
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    const [err, setErr] = useState(null);

    // Funkcja ładująca szczegóły budżetu i jego transakcje
    useEffect(() => {
        let mounted = true;

        if (!token) {
            setErr("Authentication token missing.");
            setLoading(false);
            setLoadingTransactions(false);
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 1. POBIERANIE SZCZEGÓŁÓW BUDŻETU
        fetch(`http://localhost:8080/api/budgets/${id}`, { headers })
            .then(r => {
                if (r.status === 401 || r.status === 403) {
                    throw new Error("You are not authorized to view this resource.");
                }
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => mounted && setBudget(data))
            .catch(e => mounted && setErr("Budget loading failed: " + e.message))
            .finally(() => mounted && setLoading(false));

        // 2. POBIERANIE TRANSAKCJI DLA TEGO BUDŻETU
        fetch(`http://localhost:8080/api/transactions/budget/${id}`, { headers })
            .then(r => {
                if (!r.ok) {
                    // W przypadku braku transakcji może zwrócić 404/błąd, ale lepiej obsłużyć to jako pustą listę
                    // Aby uniknąć błędu kompilacji:
                    if (r.status === 404) return [];
                    throw new Error(`Failed to fetch transactions. Status: ${r.status}`);
                }
                return r.json();
            })
            .then(data => mounted && setTransactions(Array.isArray(data) ? data : []))
            .catch(e => mounted && console.error("Transactions loading error: ", e.message)) // Błąd transakcji nie blokuje wyświetlania budżetu
            .finally(() => mounted && setLoadingTransactions(false));

        return () => { mounted = false; };
    }, [id, token]);

    if (loading) return <div>Loading budget details...</div>;
    if (err) return <div>Error: {err}</div>;
    if (!budget) return <div>Budget not found</div>;

    return (
        <div>
            <Link to="/budgets">← Back to Budgets</Link>
            <div style={{ marginBottom: '20px' }}>
                <h1>{budget.name ?? `Budget ${id}`}</h1>
                <p>Limit: {budget.budgetLimit}</p> {/* Założyłem pole budgetLimit w modelu Budget */}
                <p>Start Date: {budget.startDate}</p>
                <p>End Date: {budget.endDate || 'Unlimited'}</p>
                <p>Category: {budget.category}</p>
            </div>

            {/* ---------------------------------------------------- */}
            {/* SEKCJA TRANSAKCJI */}
            {/* ---------------------------------------------------- */}
            <h2>Transactions</h2>
            <Link to="/transactions/new" style={{ display: 'inline-block', marginBottom: '15px', padding: '8px 16px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: 4 }}>
                Add New Transaction
            </Link>

            {loadingTransactions ? (
                <p>Loading transactions...</p>
            ) : transactions.length === 0 ? (
                <p>No transactions recorded for this budget yet.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={tableHeaderStyle}>Date</th>
                        <th style={tableHeaderStyle}>Category</th>
                        <th style={tableHeaderStyle}>Description</th>
                        <th style={tableHeaderStyle}>Type</th>
                        <th style={tableHeaderStyle}>Amount</th>
                    </tr>
                    </thead>
                    <tbody>
                    {transactions.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tableCellStyle}>{new Date(t.date).toLocaleDateString()}</td>
                            <td style={tableCellStyle}>{t.category}</td>
                            <td style={tableCellStyle}>{t.description}</td>
                            <td style={{ ...tableCellStyle, color: t.type === 'INCOME' ? 'green' : 'red' }}>
                                {t.type}
                            </td>
                            <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>
                                {t.type === 'INCOME' ? '+' : '-'} {t.amount} PLN
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// Proste style dla tabeli
const tableHeaderStyle = { padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' };
const tableCellStyle = { padding: '10px', textAlign: 'left' };