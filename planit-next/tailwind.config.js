/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Updated light-mode friendly blue palette (from darker slate blue to near-white)
        primary: {
          50: '#F6FAFC',   // near-white tint
          100: '#EAF2F7',  // very light blue
          200: '#D9E6EF',  // soft pale blue
          300: '#C3D6E3',  // light muted blue
          400: '#A5C2D4',  // medium light blue
          500: '#89AEC5',  // base brand tone
          600: '#6F95AE',  // darker for hover/action
          700: '#5F89A5',  // accent emphasis
          800: '#4C7089',  // headings / strong accents
          900: '#3A566B',  // darkest shade for high contrast text
          950: '#2B3F4F',  // ultra dark (rare usage)
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}