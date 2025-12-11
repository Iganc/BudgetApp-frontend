import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('Attempting login with:', email);
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful, token received:', data.token ? 'yes' : 'no');

      login(data.token);
      console.log('Token saved, navigating to /budgets');
      navigate('/budgets');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      // Kontener: Centrowanie na ekranie, górny padding
      <div className="flex justify-center pt-8 pb-12">
        {/* KARTA: Białe tło, cień, ograniczona szerokość */}
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">

          <h1 className="text-3xl font-light text-gray-800 mb-6 border-b border-gray-200 pb-3">
            Login to BudgetApp
          </h1>

          <form onSubmit={handleLogin} className="flex flex-col space-y-5">

            {/* Email */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email:</span>
              <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  // Klasy Tailwind dla Inputu
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150"
              />
            </label>

            {/* Password */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Password:</span>
              <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150"
              />
            </label>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</div>}

            {/* Przycisk Login */}
            <button
                type="submit"
                disabled={loading}
                // Przycisk: pełna szerokość, tło akcentu, duży, pogrubiony
                className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out mt-4 disabled:opacity-50 disabled:bg-indigo-400"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
  );
}