import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@example.com'); // Pre-fill for convenience
  const [password, setPassword] = useState('password'); // Pre-fill for convenience
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-bg">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h2.64m-13.5 0L12 14.25v6.75m0 0V21m0 0H9.75M12 21v-6.75m0 0H4.5m7.5 0H12m0 0V2.25m0 0c-.597 0-1.17.236-1.588.654l-4.5 4.5a.75.75 0 0 0 1.06 1.06L12 3.811l4.528 4.527a.75.75 0 0 0 1.06-1.06l-4.5-4.5A2.25 2.25 0 0 0 12 2.25Z" />
          </svg>
          <h1 className="mt-4 text-3xl font-bold font-poppins text-neutral-text-primary">Wholesale Shop Login</h1>
          <p className="mt-2 text-sm text-neutral-text-secondary">Access your management dashboard.</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-center text-error bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-text-primary">Email address</label>
            <div className="mt-1">
              <input 
                id="email" 
                name="email" 
                type="email" 
                autoComplete="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md shadow-sm appearance-none border-neutral-border placeholder-neutral-text-secondary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-text-primary">Password</label>
            <div className="mt-1">
              <input 
                id="password" 
                name="password" 
                type="password" 
                autoComplete="current-password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md shadow-sm appearance-none border-neutral-border placeholder-neutral-text-secondary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox"
                     className="w-4 h-4 rounded text-primary border-neutral-border focus:ring-primary" />
              <label htmlFor="remember-me" className="block ml-2 text-sm text-neutral-text-primary">Remember me</label>
            </div>
            <div className="text-sm">
              <Link to="#" className="font-medium text-primary hover:text-primary-light">Forgot your password?</Link>
            </div>
          </div>

          <div>
            <button 
              type="submit"
              disabled={loading}
              className="flex justify-center w-full px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 bg-primary border border-transparent rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <p className="mt-8 text-xs text-center text-neutral-text-secondary">
          &copy; {new Date().getFullYear()} Wholesale Shop Management. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
