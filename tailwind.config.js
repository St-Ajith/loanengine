/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces — white is the default; subtle gray tints distinguish
        // sections without breaking the clean feel.
        surface: {
          DEFAULT: '#FFFFFF',
          page: '#FAFAFA',       // subtle warm-gray page tint
          muted: '#F5F6F8',
          accent: '#EEF2FF',     // soft indigo-tinted backdrop for the hero
          line: '#E5E7EB',
          hover: '#D1D5DB',
        },
        // Ink — modern near-black with a slight cool cast
        ink: {
          DEFAULT: '#0F172A',
          soft: '#334155',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        // Semantic colors
        principal: {
          DEFAULT: '#2563EB',    // modern electric blue, replaces the old navy
          deep: '#1E40AF',
          tint: '#DBEAFE',
        },
        interest: {
          DEFAULT: '#DC2626',    // clean red, replaces the old burgundy
          tint: '#FEE2E2',
        },
        savings: {
          DEFAULT: '#16A34A',
          tint: '#DCFCE7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        'display': '-0.02em',     // tighten big numbers for that modern feel
      },
    },
  },
  plugins: [],
};
