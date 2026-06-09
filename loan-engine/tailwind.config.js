/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paper background — cool off-white, deliberately not warm cream
        paper: {
          DEFAULT: '#F4F3EE',
          dim: '#ECEBE4',
          line: '#DCDAD0',
        },
        // Ink — near-black with the slightest blue cast for screen comfort
        ink: {
          DEFAULT: '#13161A',
          soft: '#3A3F46',
          muted: '#6B7079',
          faint: '#9CA0A8',
        },
        // Principal — what you actually own. Deep, confident.
        principal: {
          DEFAULT: '#1E3A8A',
          soft: '#3B5BDB',
          tint: '#DDE3F5',
        },
        // Interest — what you pay to borrow. Signals cost without alarm.
        interest: {
          DEFAULT: '#9F1239',
          soft: '#BE185D',
          tint: '#F5DDE5',
        },
        // Savings — only used for positive deltas, never decoration.
        savings: {
          DEFAULT: '#15803D',
          tint: '#D7EBDD',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontFeatureSettings: {
        tabular: '"tnum", "lnum"',
      },
    },
  },
  plugins: [],
};
