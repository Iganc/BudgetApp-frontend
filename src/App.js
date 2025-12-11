import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import BudgetsPage from './pages/BudgetsPage';
import BudgetDetailsPage from './pages/BudgetDetailsPage';
import CreateBudgetPage from './pages/CreateBudgetPage';
import CreateTransactionPage from './pages/CreateTransactionPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';


function Navigation() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        // Nawigacja: białe tło (bg-white), lekki cień (shadow-sm), akcent Indygo (indigo-600)
        <nav className="flex items-center gap-6 px-8 py-4 border-b border-gray-100 bg-white shadow-sm sticky top-0 z-10">

            {/* Logo/Nazwa Aplikacji */}
            <Link to={isAuthenticated() ? "/budgets" : "/"} className="text-xl font-bold text-gray-800 hover:text-indigo-600 transition duration-150">
                BudgetApp
            </Link>

            {isAuthenticated() ? (
                <>
                    {/* Przycisk Logout: Używamy stałego paddingu py-2 px-4 */}
                    <button
                        onClick={handleLogout}
                        className="ml-auto px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 shadow-md"
                    >
                        Logout
                    </button>
                </>
            ) : (
                // Linki dla niezalogowanego
                <div className="ml-auto flex gap-4">

                    {/* LOGIN: Minimalistyczny wygląd przycisku (transparentny) o tej samej wysokości co Register/Logout */}
                    <Link
                        to="/login"
                        className="px-4 py-2 text-sm text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition duration-150"
                    >
                        Login
                    </Link>

                    {/* REGISTER: Akcentowany przycisk o tej samej wysokości co Logout/Login */}
                    <Link
                        to="/register"
                        className="px-4 py-2 text-sm bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition duration-150"
                    >
                        Register
                    </Link>

                </div>
            )}
        </nav>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Navigation />
                <main className="mx-auto max-w-6xl p-4 sm:px-6 lg:px-8">
                    <Routes>

                        <Route
                            path="/"
                            element={
                                <ProtectedRoute fallbackPath="/login">
                                    <Navigate to="/budgets" replace />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* BudgetsPage jest teraz domyślnym miejscem docelowym dla zalogowanych */}
                        <Route path="/budgets" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />

                        <Route path="/budgets/new" element={<ProtectedRoute><CreateBudgetPage /></ProtectedRoute>} />
                        <Route path="/budgets/:id" element={<ProtectedRoute><BudgetDetailsPage /></ProtectedRoute>} />
                        <Route path="/transactions/new" element={<ProtectedRoute><CreateTransactionPage /></ProtectedRoute>} />
                    </Routes>
                </main>
            </Router>
        </AuthProvider>
    );
}