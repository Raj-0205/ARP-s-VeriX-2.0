/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          darkest: '#0a0a0a',
          dark: '#121212',
          medium: '#1e1e1e',
          light: '#2a2a2a',
        },
        electric: {
          blue: '#00E5FF',
          red: '#FF3131',
          yellow: '#FFD700',
          green: '#39FF14',
        },
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 229, 255, 0.4)',
        'neon-red': '0 0 15px rgba(255, 49, 49, 0.4)',
        'neon-yellow': '0 0 15px rgba(255, 215, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
