/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // โทนสีหลักของแอป: slate blue + sage green + neutral อบอุ่น
        slateblue: {
          50: '#f4f6fb',
          100: '#e7ecf6',
          200: '#c9d5eb',
          300: '#9db4d9',
          400: '#6b8dc3',
          500: '#4a6fae',
          600: '#3a5892',
          700: '#314a77',
          800: '#2c3f63',
          900: '#283754',
        },
        sage: {
          50: '#f4f8f4',
          100: '#e5efe6',
          200: '#cbe0cd',
          300: '#a4c8a8',
          400: '#77a97d',
          500: '#548c5b',
          600: '#417049',
          700: '#36593c',
          800: '#2e4833',
          900: '#273c2c',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans Thai"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
