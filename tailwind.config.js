/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', '"Noto Sans JP"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Noto Sans KR"', '"Noto Sans JP"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        md3: {
          primary: '#D4AF37',
          secondary: '#3F51B5',
          background: '#0D0B18',
          surface: '#141221',
          accent: '#F3E5AB',
        }
      }
    },
  },
  plugins: [],
}
