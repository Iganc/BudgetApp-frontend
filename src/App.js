import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import BudgetsPage from './pages/BudgetsPage';
import BudgetDetailsPage from './pages/BudgetDetailsPage';
import CreateBudgetPage from './pages/CreateBudgetPage';
import CreateTransactionPage from './pages/CreateTransactionPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

function Dashboard() {
  return <div>Dashboard (todo)</div>;
}

function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 12, alignItems: 'center' }}>
      <Link to="/">Home</Link>
      {isAuthenticated() ? (
        <>
          <Link to="/budgets">Budgets</Link>
          <button onClick={handleLogout} style={{ marginLeft: 'auto', padding: '4px 12px' }}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ marginLeft: 'auto' }}>Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <main style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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