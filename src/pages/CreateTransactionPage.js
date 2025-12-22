import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'];

export default function CreateTransactionPage() {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const initialBudgetId = query.get('budgetId');

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    // ZMIANA STANU: Używamy tylko categoryId (Long)
    const [categoryId, setCategoryId] = useState('');
    const [type, setType] = useState(TRANSACTION_TYPES[1]); // Domyślnie: EXPENSE
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const [budgetId, setBudgetId] = useState(initialBudgetId || '');
    const [availableBudgets, setAvailableBudgets] = useState([]);

    // NOWE STANY DLA KATEGORII
    const [availableCategories, setAvailableCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [loadingBudgets, setLoadingBudgets] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const navigate = useNavigate();

    // --- FUNKCJA POBIERAJĄCA BUDŻETY ---
    const fetchBudgets = async () => {
        setLoadingBudgets(true);
        try {
            const response = await fetch('/api/budgets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch budgets');
            const data = await response.json();
            setAvailableBudgets(data);

            // Ustawienie domyślnego budżetu, jeśli podano w query params lub jeśli jest to pierwszy budżet
            if (data.length > 0 && initialBudgetId && data.some(b => b.id === parseInt(initialBudgetId))) {
                setBudgetId(initialBudgetId);
            } else if (data.length > 0) {
                // W przypadku braku initialBudgetId, ustawiamy pierwszy lub zostawiamy puste
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

    // --- FUNKCJA POBIERAJĄCA KATEGORIE ---
    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const response = await fetch('/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setAvailableCategories(data);

            // Ustaw domyślną kategorię (pierwszą na liście)
            if (data.length > 0 && !categoryId) {
                setCategoryId(data[0].id.toString());
            }
        } catch (e) {
            setError("Could not load categories: " + e.message);
        } finally {
            setLoadingCategories(false);
        }
    };


    useEffect(() => {
        if (token) {
            fetchBudgets();
            fetchCategories();
        }
    }, [token]);


    const handleAddCategory = async () => {
        if (newCategoryName.trim().length === 0) return;

        try {
            setError(null);
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newCategoryName.trim() })
            });

            if (response.status === 409) {
                throw new Error("Category already exists.");
            }
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create new category. Status: ${response.status}. Details: ${errorText.substring(0, 50)}`);
            }

            const newCat = await response.json();

            setAvailableCategories(prev => [...prev, newCat]);
            setCategoryId(newCat.id.toString());
            setNewCategoryName('');

        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };


    // --- Obsługa Submitu ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!categoryId) {
            setError("Please select a category.");
            return;
        }

        const amountFloat = parseFloat(amount);
        if (isNaN(amountFloat) || amountFloat <= 0) {
            setError("Amount must be a positive number.");
            return;
        }

        // Payload MUSI wysyłać ID jako obiekt
        const payload = {
            amount: amountFloat,
            description: description || null,
            category: { id: parseInt(categoryId) },
            type: type,
            date: date + "T12:00:00",
            budget: budgetId ? { id: parseInt(budgetId) } : null,
        };

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Failed to create transaction. Status: ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.message) errorMessage = errorJson.message;
                } catch (e) {
                    // Ignorujemy błędy parsowania, używamy domyślnej wiadomości
                }

                throw new Error(errorMessage);
            }

            // Przekierowanie do szczegółów budżetu lub strony głównej
            navigate(budgetId ? `/budgets/${budgetId}` : '/budgets');
        } catch (err) {
            setError(err.message);
            console.error("Caught error:", err);
        }
    };

    const groupedCategories = availableCategories ? availableCategories.reduce((acc, category) => {

        const isCustom = !!category.user;

        const groupName = isCustom ? "My Categories" : "Standard Categories";

        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        acc[groupName].push(category);
        return acc;
    }, {}) : {};

    if (loadingBudgets || loadingCategories) return <div className="text-center py-10 text-gray-600">Loading data...</div>;

    return (
        <div className="flex justify-center items-center py-8">
            <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <h1 className="text-3xl font-light text-gray-800 mb-6">Add New Transaction</h1>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Pole Transakcji Type (Dynamiczne Kolory) */}
                    <div className="flex justify-center mb-4">
                        {TRANSACTION_TYPES.map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`
                                    w-1/2 py-3 text-lg font-bold border 
                                    ${t === 'INCOME' ? 'rounded-l-lg' : 'rounded-r-lg'}
                                    transition duration-200
                                    ${
                                    type === t
                                        ? t === 'INCOME'
                                            ? 'bg-emerald-600 text-white shadow-md border-emerald-600' // Aktywny INCOME (Szmaragd)
                                            : 'bg-red-600 text-white shadow-md border-red-600' // Aktywny EXPENSE (Czerwony)
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300' // Nieaktywny
                                }
                                `}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Pole Kwoty */}
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Amount (PLN):</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            min="0.01"
                            step="0.01"
                            className="mt-1 block w-full px-3 py-3 text-xl border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        />
                    </label>

                    {/* Pole Daty */}
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Date:</span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </label>

                    {/* Pole Kategoria (NOWA SEKCJA) */}
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Category:</span>

                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150"
                            >
                                {/* Opcja domyślna, jeśli lista jest pusta */}
                                {Object.keys(groupedCategories).length === 0 && (
                                    <option value="" disabled>No categories available</option>
                                )}

                                {/* Iteracja przez Grupy (Standard/My Categories) */}
                                {Object.entries(groupedCategories).map(([groupName, categories]) => (
                                    <optgroup label={groupName} key={groupName}>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>

                        {/* Sekcja Dodawania Nowej Kategorii */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add New Category Name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150"
                            />
                            <button
                                type="button"
                                onClick={handleAddCategory}
                                disabled={newCategoryName.trim().length === 0}
                                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Pole Opisu */}
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Description (optional):</span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="2"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </label>

                    {/* Pole Przypisania do Budżetu */}
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Assign to Budget:</span>
                        <select
                            value={budgetId}
                            onChange={(e) => setBudgetId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">-- No Budget --</option>
                            {availableBudgets.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="submit"
                        className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                    >
                        Add Transaction
                    </button>
                </form>

                {/* Link powrotny */}
                <Link
                    to="/budgets"
                    className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-800 transition"
                >
                    &larr; Back to Budgets
                </Link>
            </div>
        </div>
    );
}