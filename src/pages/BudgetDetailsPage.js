import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BudgetDetailsPage() {
    const { id } = useParams();
    const { token } = useAuth();

    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);

    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    const [totalSpent, setTotalSpent] = useState(null);
    const [loadingSpent, setLoadingSpent] = useState(true);

    const [totalIncome, setTotalIncome] = useState(null);
    const [loadingIncome, setLoadingIncome] = useState(true);

    const [balance, setBalance] = useState(null);
    const [loadingBalance, setLoadingBalance] = useState(true);

    const [err, setErr] = useState(null);

    useEffect(() => {
        let mounted = true;

        if (!token) {
            setErr("Authentication token missing.");
            setLoading(false);
            setLoadingTransactions(false);
            setLoadingSpent(false);
            setLoadingIncome(false);
            setLoadingBalance(false);
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
                    if (r.status === 404) return [];
                    throw new Error(`Failed to fetch transactions. Status: ${r.status}`);
                }
                return r.json();
            })
            .then(data => mounted && setTransactions(Array.isArray(data) ? data : []))
            .catch(e => mounted && console.error("Transactions loading error: ", e.message))
            .finally(() => mounted && setLoadingTransactions(false));

        // 3. POBIERANIE TOTAL SPENT
        fetch(`http://localhost:8080/api/budgets/${id}/spent`, { headers })
            .then(r => r.ok ? r.json() : 0) // Zmieniamy throw na 0, jeśli np. 404 (brak wydatków)
            .then(data => mounted && setTotalSpent(data))
            .catch(e => mounted && console.error("Total spent error: ", e.message))
            .finally(() => mounted && setLoadingSpent(false));

        // 4. ZMIANA: POBIERANIE TOTAL INCOME
        fetch(`http://localhost:8080/api/budgets/${id}/earned`, { headers })
            .then(r => r.ok ? r.json() : 0)
            .then(data => mounted && setTotalIncome(data))
            .catch(e => mounted && console.error("Total income error: ", e.message))
            .finally(() => mounted && setLoadingIncome(false));

        // 5. ZMIANA: POBIERANIE BALANCE
        fetch(`http://localhost:8080/api/budgets/${id}/balance`, { headers })
            .then(r => r.ok ? r.json() : 0)
            .then(data => mounted && setBalance(data))
            .catch(e => mounted && console.error("Balance error: ", e.message))
            .finally(() => mounted && setLoadingBalance(false));

        return () => { mounted = false; };
    }, [id, token]);

    if (loading || loadingSpent || loadingIncome || loadingBalance) return <div>Loading budget details and analytics...</div>;
    if (err) return <div>Error: {err}</div>;
    if (!budget) return <div>Budget not found</div>;

    const formatCurrency = (amount) => {
        return (amount !== null && amount !== undefined) ? `${parseFloat(amount).toFixed(2)} PLN` : '0.00 PLN';
    };

    return (
        <div>
            <Link to="/budgets">← Back to Budgets</Link>
            <div style={{ marginBottom: '20px' }}>
                <h1>{budget.name ?? `Budget ${id}`}</h1>

                <div style={{ display: 'flex', gap: '30px', margin: '15px 0', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                    <div style={{ color: 'green' }}>
                        <strong>Income:</strong> {formatCurrency(totalIncome)}
                    </div>
                    <div style={{ color: 'red' }}>
                        <strong>Spent:</strong> {formatCurrency(totalSpent)}
                    </div>
                    <div style={{ color: balance >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                        <strong>Balance:</strong> {formatCurrency(balance)}
                    </div>
                </div>

                <p>Start Date: {budget.startDate}</p>
                <p>End Date: {budget.endDate || 'Unlimited'}</p>
            </div>


            <h2>Transactions</h2>
            <Link
                to={`/transactions/new?budgetId=${id}`}
                style={{ display: 'inline-block', marginBottom: '15px', padding: '8px 16px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: 4 }}
            >
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

const tableHeaderStyle = { padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' };
const tableCellStyle = { padding: '10px', textAlign: 'left' };