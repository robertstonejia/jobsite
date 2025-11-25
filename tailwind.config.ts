import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b8c7ff',
          400: '#94a3ff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4553b8',
          800: '#364196',
          900: '#2a3475',
        },
        secondary: {
          500: '#764ba2',
        }
      },
    },
  },
  plugins: [],
}
export default config
