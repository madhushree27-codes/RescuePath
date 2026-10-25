/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        emergency: {
          red: "#EF4444",
          amber: "#F59E0B",
          green: "#10B981",
          blue: "#3B82F6",
          dark: "#0F172A"
        }
      }
    }
  },
  plugins: []
};
