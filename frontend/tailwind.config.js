/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1220',
          light: '#141D31',
          border: '#1F2A40',
        },
        canvas: '#F4F5F9',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#111827',
          muted: '#5B6472',
          faint: '#94A0B2',
        },
        line: '#E3E5EC',
        brand: {
          DEFAULT: '#0F6B5C',
          dark: '#0B4F44',
          light: '#E4F2EF',
        },
        signal: {
          todo: '#94A3B8',
          progress: '#3D6FB4',
          review: '#C8772D',
          completed: '#1F8F6B',
          urgent: '#C0392B',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 0 rgba(15, 23, 42, 0.03)',
        panel: '0 4px 24px rgba(11, 18, 32, 0.08)',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
