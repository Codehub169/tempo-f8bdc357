import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth(); // Added user to potentially use it later if needed
  const location = useLocation();

  useEffect(() => {
    // If user becomes unauthenticated (e.g. due to token expiry checked by AuthContext or logout elsewhere),
    // ensure the flag is cleared for the next authenticated session.
    if (!isLoading && !isAuthenticated) {
      sessionStorage.removeItem('hasSeenDashboard');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    // Display a loading indicator while authentication status is being determined.
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-bg z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <p className="ml-4 text-lg font-medium text-neutral-text-primary">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // User is not authenticated, redirect to the login page.
    // Pass the current location so the user can be redirected back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, check if dashboard has been seen in this session.
  // This ensures the user sees the dashboard at least once per session after login.
  const hasSeenDashboard = sessionStorage.getItem('hasSeenDashboard') === 'true';

  if (!hasSeenDashboard) {
    if (location.pathname !== '/dashboard') {
      // If not seen dashboard and trying to access another private page,
      // redirect to dashboard first. Mark that dashboard will be seen.
      sessionStorage.setItem('hasSeenDashboard', 'true');
      return <Navigate to="/dashboard" state={{ from: location }} replace />;
    } else {
      // If landing directly on dashboard (e.g., after the redirect above or direct navigation),
      // mark it as seen.
      sessionStorage.setItem('hasSeenDashboard', 'true');
    }
  }

  // User is authenticated and dashboard requirement is met,
  // render the child routes.
  return <Outlet />;
};

export default PrivateRoute;
