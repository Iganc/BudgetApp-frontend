import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';

// Rejestracja elementów Chart.js jest konieczna
ChartJS.register(ArcElement, Tooltip, Legend);

// Paleta kolorów (ta sama co w BudgetDetailsPage)
const CHART_COLORS = [
    '#4f46e5', // Indigo
    '#10b981', // Emerald
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
];

// Osobny komponent wykresu
export default function SpendingChart({ budgetId, formatCurrency }) {
    const { token } = useAuth();
    const [categorySpending, setCategorySpending] = useState(null);
    const [loadingChart, setLoadingChart] = useState(true);
    const [error, setError] = useState(null);

    // Przeniesiona logika pobierania danych do tego komponentu
    useEffect(() => {
        if (!token || !budgetId) {
            setLoadingChart(false);
            return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };

        fetch(`http://localhost:8080/api/budgets/${budgetId}/spending-by-category`, { headers })
            .then(r => {
                if (!r.ok) throw new Error(`Failed to fetch spending data. Status: ${r.status}`);
                return r.json();
            })
            .then(data => {
                setCategorySpending(data);
            })
            .catch(e => {
                console.error("Spending chart fetch error: ", e.message);
                setError("Failed to load chart data.");
                setCategorySpending([]);
            })
            .finally(() => setLoadingChart(false));

    }, [token, budgetId]);


    // Logika ładowania i stanu pustego
    if (loadingChart) {
        return <div className="text-center py-4 text-gray-400 text-sm">Loading chart...</div>;
    }

    if (error) {
        return <div className="text-center py-4 text-red-500 text-sm">Error loading chart.</div>;
    }

    if (!categorySpending || categorySpending.length === 0) {
        return (
            <div className="py-4 text-gray-500">
                No expenses recorded yet.
            </div>
        );
    }

    // Logika transformacji danych na format Chart.js (przeniesiona)
    const chartData = {
        labels: categorySpending.map(item => item.category),
        datasets: [
            {
                data: categorySpending.map(item => parseFloat(item.totalAmount || 0)),
                backgroundColor: CHART_COLORS,
                hoverOffset: 15,
                borderWidth: 2,
                borderColor: '#ffffff',
            },
        ],
    };

    return (
        <div className="flex justify-center">
            <div className="w-full">
                <Doughnut
                    data={chartData}
                    options={{
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: { size: 12 }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    // Używamy funkcji formatCurrency przekazanej z komponentu-rodzica
                                    label: function(context) {
                                        let label = context.label || 'Other';
                                        if (label) {
                                            label += ': ';
                                        }
                                        const value = formatCurrency(context.parsed);
                                        return label + value;
                                    }
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
}