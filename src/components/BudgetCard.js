// src/components/BudgetCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function BudgetCard({ budget, onEdit, onDelete }) {
    const [busy, setBusy] = useState(false);

    // Funkcja pomocnicza do formatowania daty (jeśli jest potrzebna, użyjemy domyślnego formatowania JS)
    const formatDate = (dateString) => {
        // Zakładamy, że dateString to format ISO (YYYY-MM-DD), więc wystarczy go wyświetlić.
        return dateString;
    };

    const formattedStartDate = formatDate(budget.startDate);
    const formattedEndDate = budget.endDate ? formatDate(budget.endDate) : null;

    return (
        // KARTA: białe tło, cień, zaokrąglenie, padding
        <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition duration-300 flex flex-col gap-3 h-full">

            {/* NAGŁÓWEK KARTY Z PRZYCISKAMI AKCJI */}
            <div className="flex justify-between items-start gap-3">
                {/* NAZWA BUDŻETU - akcent Indygo, pogrubienie */}
                <Link
                    to={`/budgets/${budget.id}`}
                    className="text-lg font-bold text-indigo-600 hover:text-indigo-700 transition leading-snug"
                >
                    {budget.name ?? `Budget ${budget.id}`}
                </Link>

                {/* Przyciski Edit/Delete (Minimalistyczne) */}
                <div className="flex gap-2 text-sm">
                    <button
                        onClick={() => { setBusy(true); Promise.resolve(onEdit(budget)).finally(() => setBusy(false)); }}
                        disabled={busy}
                        aria-label="Edit budget"
                        className="text-gray-500 hover:text-indigo-600 transition disabled:opacity-50"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => { if (window.confirm('Delete this budget?')) { setBusy(true); Promise.resolve(onDelete(budget)).finally(() => setBusy(false)); } }}
                        disabled={busy}
                        aria-label="Delete budget"
                        className="text-red-500 hover:text-red-700 transition disabled:opacity-50"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* ZMIANA: Elegancki Zakres Dat */}
            <div className="text-sm text-gray-500 pt-1">
                {formattedStartDate}
                {formattedEndDate ? (
                    <span className="ml-1 font-medium">&mdash; {formattedEndDate}</span>
                ) : (
                    <span className="ml-1 font-medium"> &mdash; Unlimited</span>
                )}
            </div>
            {/* KONIEC ZMIANY */}

            {budget.description &&
                <div className="text-sm text-gray-500 italic mt-auto">
                    {budget.description}
                </div>
            }
        </div>
    );
}