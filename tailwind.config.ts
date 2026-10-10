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
        slate: {
          750: '#1e293b',
          850: '#0f172a',
          950: '#020617',
        },
        indigo: {
          950: '#0c0620',
        },
      },
      fontSize: {
        xs: 'clamp(11px, 1.3vw, 16px)',
        sm: 'clamp(13px, 1.6vw, 20px)',
        base: 'clamp(14px, 1.7vw, 22px)',
        lg: 'clamp(16px, 1.9vw, 26px)',
        xl: 'clamp(18px, 2.1vw, 30px)',
        '2xl': 'clamp(20px, 2.3vw, 34px)',
        '3xl': 'clamp(24px, 2.8vw, 40px)',
        '4xl': 'clamp(28px, 3.2vw, 48px)',
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s infinite',
        ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        spin: 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
