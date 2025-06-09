import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Display a loading indicator while authentication status is being determined.
    // This prevents a flash of the login page or content before auth state is resolved.
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-bg z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <p className="ml-4 text-lg font-medium text-neutral-text-primary">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // User is not authenticated, redirect to the login page.
    // Pass the current location in state so the user can be redirected back
    // to their intended page after successful login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the child routes.
  return <Outlet />;
};

export default PrivateRoute;