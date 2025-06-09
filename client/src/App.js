import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import ReportsPage from './pages/ReportsPage';
import PrivateRoute from './utils/PrivateRoute';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Optional: If you want to show a global loading spinner during initial auth check
  // if (isLoading) {
  //   return <div className="flex items-center justify-center min-h-screen bg-neutral-bg"><div className="text-xl text-neutral-text-primary">Loading Application...</div></div>;
  // }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        {/* <Route path="/orders/:orderId" element={<OrderDetailPage />} /> */}
        <Route path="/reports" element={<ReportsPage />} />
        {/* Default authenticated route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} /> 
      </Route>

      {/* Fallback for any other route - could be a 404 page */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
