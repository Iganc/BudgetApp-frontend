import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CreateBudgetPage() {
  const [name, setName] = useState('');
  // Ustawiamy domyślną datę startową na dzisiejszą datę
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
      // Wysyłamy endDate tylko jeśli checkbox jest zaznaczony ORAZ data jest wybrana
      endDate: hasEndDate && endDate ? endDate : null,
    };

    console.log('=== SENDING BUDGET ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('===================');

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData = { message: `Failed to create budget. Status: ${response.status}` };

        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.warn("Backend 400 response body was not valid JSON or was empty:", errorText);
        }

        console.error('Backend error:', errorData);
        // Jeśli backend zwróci wiadomość o błędzie walidacji, wyświetlamy ją
        throw new Error(errorData.message || `Failed to create budget. ${response.status}`);
      }

      navigate('/budgets');
    } catch (err) {
      console.error('Caught error:', err);
      setError(err.message);
    }
  };

  return (
      // Główny kontener wyśrodkowany
      <div className="flex justify-center items-center py-8">
        <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg border border-gray-100">

          <Link
              to="/budgets"
              className="inline-flex items-center px-2 py-1 font-semibold text-indigo-600 hover:text-indigo-800 transition duration-150 mb-6 rounded-md"
          >
            <span className="text-base mr-1.5">&larr;</span>
            Back to Budgets
          </Link>

          <h1 className="text-3xl font-light text-gray-800 mb-6">Create New Budget</h1>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Budget Name:</span>
              <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </label>

            {/* Start Date */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Start Date:</span>
              <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </label>

            {/* Checkbox for End Date */}
            <label className="flex items-center gap-2">
              <input
                  type="checkbox"
                  checked={hasEndDate}
                  onChange={(e) => {
                    setHasEndDate(e.target.checked);
                    if (!e.target.checked) setEndDate('');
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">Set end date (leave unchecked for unlimited duration)</span>
            </label>

            {/* End Date (Conditional) */}
            {hasEndDate && (
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">End Date:</span>
                  <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </label>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
            >
              Create Budget
            </button>
          </form>
        </div>
      </div>
  );
}