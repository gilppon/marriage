/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Mono"', 'monospace'],
        serif: ['"Space Mono"', 'monospace'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        md3: {
          primary: '#FF8A80',
          secondary: '#3F51B5',
          background: '#0D0B14',
          surface: '#181524',
          accent: '#00E5FF',
        }
      }
    },
  },
  plugins: [],
}
