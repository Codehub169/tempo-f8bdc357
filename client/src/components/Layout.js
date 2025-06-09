import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Layout component
 * Provides the basic structure for authenticated pages, including Sidebar and Header.
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The content to be rendered within the main section.
 * @param {string} props.pageTitle - The title of the current page, passed to the Header.
 */
const Layout = ({ children, pageTitle }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-bg">
      {/* Sidebar component */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 h-screen overflow-y-auto">
        {/* Header component, displays page title and user info */}
        <Header title={pageTitle} />

        {/* Page-specific content rendered here */}
        <div className="p-6 space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
