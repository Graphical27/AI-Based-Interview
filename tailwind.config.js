p/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#00F2C3',
          secondary: '#00D4AA'
        },
        surface: '#111111',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif']
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg,#00F2C3,#00D4AA)'
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        slideDown: 'slideDown 0.2s ease-out'
      }
    }
  },
  plugins: []
}