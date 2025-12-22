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

        fetch('/api/budgets', {
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

    if (loading) return <div className="text-center py-10 text-gray-600">Loading budgets...</div>;
    if (err) return <div className="bg-red-100 text-red-700 p-4 rounded-md shadow-sm">Error: {err}</div>;

    return (
        <div className="space-y-8">

            {/* NAGŁÓWEK STRONY I PRZYCISK AKCJI */}
            <header className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h1 className="text-3xl font-light text-gray-800">Your Budgets</h1>

                {/* Przycisk Create Budget - Akcent Indygo, duży i widoczny */}
                <Link
                    to="/budgets/new"
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition duration-150"
                >
                    + Create New Budget
                </Link>
            </header>

            {items.length === 0 ? (
                // EKRAN BRAKU DANYCH: Minimalistyczny, centrowany
                <div className="text-center py-20 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <p className="text-gray-600 mb-6 text-lg">
                        No budgets yet. Create your first budget to get started!
                    </p>
                    <Link
                        to="/budgets/new"
                        className="inline-block px-6 py-2 bg-indigo-500 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-600 transition duration-150"
                    >
                        Create Your First Budget
                    </Link>
                </div>
            ) : (
                // SIATKA KART BUDŻETOWYCH
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map(b => (
                        // Karta Budżetu
                        <div
                            key={b.id}
                            className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] border border-gray-100"
                        >
                            <Link
                                to={`/budgets/${b.id}`}
                                className="text-lg font-bold text-indigo-600 hover:text-indigo-700 block mb-1"
                            >
                                {b.name ?? `Budget ${b.id}`}
                            </Link>

                            {/* ZMIANA: Pokazujemy datę startu. Datę końca tylko, jeśli istnieje. */}
                            <div className="text-gray-500 text-sm">
                                {b.startDate}
                                {b.endDate && (
                                    <span className="ml-1 font-medium">&mdash; {b.endDate}</span>
                                )}
                            </div>
                            {/* KONIEC ZMIANY */}

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}