/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#F8F4ED',
          200: '#F0E9DC',
        },
        sage: {
          50: '#F0F5F1',
          100: '#DCE9DE',
          200: '#B8D3BC',
          300: '#8FBC97',
          400: '#6BA877',
          500: '#4F8A5B',
          600: '#3D6E48',
          700: '#2F5638',
          800: '#234029',
        },
        sand: {
          50: '#FBF7F0',
          100: '#F5EDE0',
          200: '#E8D9C4',
          300: '#D4BFA0',
          400: '#BFA37B',
          500: '#A8895E',
        },
        clay: {
          50: '#FAF1ED',
          100: '#F2DDD4',
          200: '#E5BAA9',
          300: '#D49A85',
          400: '#C17B65',
          500: '#A6624E',
        },
        sky: {
          50: '#EFF6FB',
          100: '#D7EAF5',
          200: '#AED0EA',
          300: '#84B5DB',
          400: '#5E97C9',
          500: '#4478AD',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
