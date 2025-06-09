/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#3B82F6',        // Blue
        'primary-light': '#60A5FA', // Lighter Blue
        accent: '#10B981',          // Green (for CTAs, success)
        'neutral-bg': '#F9FAFB',      // Light Background
        'neutral-border': '#E5E7EB',  // Borders/Dividers
        'neutral-text-secondary': '#6B7280', // Secondary Text/Icons
        'neutral-text-primary': '#1F2937',   // Primary Text
        success: '#22C55E',         // Green (for success messages)
        warning: '#F59E0B',         // Orange (for warnings, low stock)
        error: '#EF4444',           // Red (for errors, destructive actions)
      }
    },
  },
  plugins: [],
}
