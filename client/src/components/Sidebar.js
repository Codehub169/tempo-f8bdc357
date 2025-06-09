import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChartBarIcon,
  CubeIcon,
  ShoppingCartIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

/**
 * Sidebar component
 * Provides navigation links for the application.
 */
const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', href: '/', icon: ChartBarIcon },
    { name: 'Products', href: '/products', icon: CubeIcon },
    { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
    { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
  ];

  // CSS classes for active and inactive NavLink states
  const navLinkClasses = ({ isActive }) =>
    `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 transform ${isActive
      ? 'bg-primary text-white'
      : 'text-neutral-text-secondary hover:bg-primary-light hover:text-white'
    }`;

  return (
    <aside className="flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto bg-white border-r border-neutral-border rtl:border-r-0 rtl:border-l">
      {/* Logo and application name */}
      <NavLink to="/" className="flex items-center mb-8 space-x-2">
        <svg className="w-10 h-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h2.64m-13.5 0L12 14.25v6.75m0 0V21m0 0H9.75M12 21v-6.75m0 0H4.5m7.5 0H12m0 0V2.25m0 0c-.597 0-1.17.236-1.588.654l-4.5 4.5a.75.75 0 0 0 1.06 1.06L12 3.811l4.528 4.527a.75.75 0 0 0 1.06-1.06l-4.5-4.5A2.25 2.25 0 0 0 12 2.25Z" />
        </svg>
        <span className="text-2xl font-bold font-poppins text-neutral-text-primary">Wholesale<span className="text-primary">App</span></span>
      </NavLink>

      <div className="flex flex-col justify-between flex-1">
        {/* Navigation links */}
        <nav className="-mx-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={navLinkClasses}
              end={item.href === '/'} // Ensure exact match for dashboard link
            >
              <item.icon className="w-5 h-5" />
              <span className="mx-2">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout button removed */}
      </div>
    </aside>
  );
};

export default Sidebar;
