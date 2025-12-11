import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Usunięto importy dla ChartJS, ArcElement, Tooltip, Legend, Doughnut
import SpendingChart from '../components/SpendingChart'; // <-- WAŻNE: Dodajemy nowy import

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

    // USUNIĘTO: categorySpending
    // USUNIĘTO: loadingChart
    const [deletingId, setDeletingId] = useState(null);


    useEffect(() => {
        let mounted = true;

        if (!token) {
            setErr("Authentication token missing.");
            setLoading(false);
            setLoadingTransactions(false);
            setLoadingSpent(false);
            setLoadingIncome(false);
            setLoadingBalance(false);
            // USUNIĘTO: setLoadingChart(false);
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const fetchAllData = () => {
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

            fetch(`http://localhost:8080/api/budgets/${id}/spent`, { headers })
                .then(r => r.ok ? r.json() : 0)
                .then(data => mounted && setTotalSpent(data))
                .catch(e => mounted && console.error("Total spent error: ", e.message))
                .finally(() => mounted && setLoadingSpent(false));

            fetch(`http://localhost:8080/api/budgets/${id}/earned`, { headers })
                .then(r => r.ok ? r.json() : 0)
                .then(data => mounted && setTotalIncome(data))
                .catch(e => mounted && console.error("Total income error: ", e.message))
                .finally(() => mounted && setLoadingIncome(false));

            fetch(`http://localhost:8080/api/budgets/${id}/balance`, { headers })
                .then(r => r.ok ? r.json() : 0)
                .then(data => mounted && setBalance(data))
                .catch(e => mounted && console.error("Balance error: ", e.message))
                .finally(() => mounted && setLoadingBalance(false));

            // USUNIĘTO: cały blok fetch dla spending-by-category. Wykres teraz sam pobierze te dane.

        };

        fetchAllData();

        return () => { mounted = false; };
    }, [id, token]);


    const handleDeleteTransaction = async (transactionId) => {
        if (!window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
            return;
        }

        setDeletingId(transactionId);

        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const response = await fetch(`http://localhost:8080/api/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`Failed to delete transaction. Status: ${response.status}`);
            }

            // Po usunięciu, odświeżamy stronę, aby zaktualizować wszystkie dane
            window.location.reload();

        } catch (e) {
            setErr(`Failed to delete: ${e.message}. Please try again.`);
        } finally {
            setDeletingId(null);
        }
    };


    // USUNIĘTO: loadingChart z głównego warunku
    if (loading || loadingSpent || loadingIncome || loadingBalance) return <div className="text-center py-10 text-gray-600">Loading budget details and analytics...</div>;
    if (err) return <div className="bg-red-100 text-red-700 p-4 rounded-md shadow-sm">Error: {err}</div>;
    if (!budget) return <div className="text-center py-10 text-gray-600">Budget not found</div>;

    const formatCurrency = (amount) => {
        const formatter = new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 2,
        });
        return (amount !== null && amount !== undefined) ? formatter.format(amount) : formatter.format(0);
    };

    const getBalanceColor = (b) => b >= 0 ? 'text-emerald-600' : 'text-red-600';
    const tableHeaderClass = "p-3 text-left border-b-2 border-gray-200 text-sm font-semibold text-gray-600";
    const tableHeaderActionClass = "p-3 text-center border-b-2 border-gray-200 text-sm font-semibold text-gray-600";
    const tableCellClass = "p-3 text-left text-sm text-gray-700 border-b border-gray-100";
    const tableCellActionClass = "p-3 text-center text-sm text-gray-700 border-b border-gray-100";


    // USUNIĘTO: definicję chartData

    return (
        <div className="space-y-8">

            {/* GŁÓWNA SIATKA GÓRNA: TYTUŁ (LEWO) vs WYKRES (PRAWO) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-4">

                {/* KOLUMNA LEWA (2/3 szerokości): Nagłówek i Daty */}
                <div className="lg:col-span-2">
                    <h1 className="text-4xl font-light text-gray-800 mb-1">
                        {budget.name ?? `Budget ${id}`}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                        {budget.startDate}
                        {budget.endDate && (
                            <span className="ml-1 font-medium">&mdash; {budget.endDate}</span>
                        )}
                    </p>
                </div>

                {/* KOLUMNA PRAWA (1/3 szerokości): WYKRES KATEGORII */}
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-light text-gray-800 mb-4">Spending Breakdown</h2>

                    {/* NOWY KOMPONENT WYKRESU */}
                    <SpendingChart budgetId={id} formatCurrency={formatCurrency} />

                </div> {/* KONIEC KOLUMNY PRAWEJ */}

            </div> {/* KONIEC GŁÓWNEJ SIATKI GÓRNEJ */}


            {/* PANEL ANALITYCZNY (Income, Spent, Balance) - Zawsze pod siatką, na całą szerokość */}
            <div className="flex flex-wrap md:flex-row gap-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="flex-1 min-w-[150px] p-3 border-r border-gray-200">
                    <p className="text-sm text-gray-500 font-medium">Total Income</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {formatCurrency(totalIncome)}
                    </p>
                </div>
                <div className="flex-1 min-w-[150px] p-3 border-r border-gray-200">
                    <p className="text-sm text-gray-500 font-medium">Total Spent</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                        {formatCurrency(totalSpent)}
                    </p>
                </div>
                <div className="flex-1 min-w-[150px] p-3">
                    <p className="text-sm text-gray-500 font-medium">Current Balance</p>
                    <p className={`text-2xl font-bold mt-1 ${getBalanceColor(balance)}`}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </div>

            {/* SEKCJA TRANSAKCJI */}
            <div className="flex justify-between items-center pt-4">
                <h2 className="text-2xl font-light text-gray-800">Transactions</h2>
                <Link
                    to={`/transactions/new?budgetId=${id}`}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 text-sm"
                >
                    + Add New Transaction
                </Link>
            </div>

            {loadingTransactions ? (
                <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                    <p className="text-gray-600">Loading transactions...</p>
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-xl shadow-sm">
                    <p className="text-gray-500">No transactions recorded for this budget yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                        <tr className="bg-gray-50">
                            <th className={tableHeaderClass}>Date</th>
                            <th className={tableHeaderClass}>Category</th>
                            <th className={tableHeaderClass}>Description</th>
                            <th className={tableHeaderClass}>Type</th>
                            <th className={tableHeaderClass + " text-right"}>Amount</th>
                            <th className={tableHeaderActionClass}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50 transition duration-150">
                                <td className={tableCellClass}>{new Date(t.date).toLocaleDateString()}</td>
                                <td className={tableCellClass}>{t.category ? t.category.name : 'N/A'}</td>
                                <td className={tableCellClass + " max-w-xs truncate"}>{t.description || "—"}</td>
                                <td className={tableCellClass}>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                            {t.type}
                                        </span>
                                </td>
                                <td className={tableCellClass + " text-right font-semibold"}>
                                    {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount).replace('PLN', '')} PLN
                                </td>
                                <td className={tableCellActionClass}>
                                    <button
                                        onClick={() => handleDeleteTransaction(t.id)}
                                        disabled={deletingId === t.id}
                                        className="text-red-500 hover:text-red-700 disabled:opacity-50 transition"
                                        title="Delete Transaction"
                                    >
                                        {deletingId === t.id ? '...' : 'X'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}