/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070b14',
          900: '#0b1329',
          850: '#101c3d',
          800: '#16244f',
          700: '#1e326e',
          600: '#2b448f',
        },
        brand: {
          blue: '#2563eb',
          cyan: '#0ea5e9',
          dark: '#0f172a',
          surface: '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
