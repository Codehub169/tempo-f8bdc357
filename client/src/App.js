import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import ReportsPage from './pages/ReportsPage';
// import { useAuth } from './contexts/AuthContext'; // isLoading is available but not used for a global spinner here

function App() {
  // const { isLoading } = useAuth(); // isLoading might still be used from AuthContext for an initial load feel

  // Optional: If you want to show a global loading spinner during initial auth check
  // if (isLoading) {
  //   return <div className="flex items-center justify-center min-h-screen bg-neutral-bg"><div className="text-xl text-neutral-text-primary">Loading Application...</div></div>;
  // }

  return (
    <Routes>
      {/* All routes are now public */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      {/* <Route path="/orders/:orderId" element={<OrderDetailPage />} /> */}
      <Route path="/reports" element={<ReportsPage />} />
      
      {/* Default route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} /> 

      {/* Fallback for any other route - now always redirects to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
