import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext'; // To get user info

/**
 * Header component
 * Displays the page title, notification icon, and user avatar.
 * @param {object} props - The component's props.
 * @param {string} props.title - The title of the current page.
 */
const Header = ({ title }) => {
  const { user } = useAuth(); // Get user information

  // Generate a simple avatar URL based on user's email or a default name
  const avatarName = user?.email ? user.email.split('@')[0] : 'Admin User';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=3B82F6&color=fff&font-size=0.5`;

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Page title */}
        <h1 className="text-2xl font-semibold font-poppins text-neutral-text-primary">
          {title || 'Dashboard'} {/* Default title if none provided */}
        </h1>
        
        {/* Right-side icons and user avatar */}
        <div className="flex items-center space-x-3">
          {/* Notification button */}
          <button 
            className="p-1.5 text-neutral-text-secondary rounded-full hover:bg-neutral-border hover:text-neutral-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            aria-label="View notifications"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="w-6 h-6" />
          </button>
          
          {/* User avatar */}
          <img 
            className="w-8 h-8 rounded-full" 
            src={avatarUrl} 
            alt="User avatar" 
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
