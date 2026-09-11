/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        union: {
          bg: '#0a0b0e',
          surface: '#12141a',
          card: '#161922',
          border: '#222836',
          borderHover: '#323b4e',
          text: '#f1f5f9',
          muted: '#8e9bb0',
          accent: '#6366f1',
          accentCyan: '#06b6d4',
          accentGreen: '#10b981',
          accentAmber: '#f59e0b',
          accentRose: '#ef4444'
        }
      }
    },
  },
  plugins: [],
};
