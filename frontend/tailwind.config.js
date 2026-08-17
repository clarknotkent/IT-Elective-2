/** @type {import('tailwindcss').Config} */

// Colours resolve through CSS custom properties holding raw channel
// triplets, so the palette can flip under prefers-color-scheme while
// alpha modifiers (text-ink/70) keep working.
const ch = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const ramp = (name, stops) =>
  Object.fromEntries(stops.map((s) => [s, ch(`${name}-${s}`)]));

// 1.10x density against the stock 0.25rem step.
const STEP = 0.275;
const spacing = { px: '1px' };
for (const k of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96]) {
  spacing[k] = `${+(STEP * k).toFixed(4)}rem`;
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    spacing,
    extend: {
      colors: {
        bg: ch('bg'),
        surface: ch('surface'),
        ink: ch('ink'),
        divider: 'rgb(var(--c-ink) / var(--divider-a))',

        neutral: ramp('neutral', [100, 200, 300, 400, 500, 600, 700, 800, 900]),
        accent: ramp('accent', [100, 200, 300, 400, 500, 600, 700, 800, 900]),
        sage: ramp('sage', [100, 200, 300, 400, 500, 600, 700, 800, 900]),
        clay: ramp('clay', [100, 200, 500, 700]),
        plum: ramp('plum', [100, 200, 500, 700]),

        'low-tint': ch('low-tint'),
        'low-ink': ch('low-ink'),
        'low-edge': ch('low-edge'),
        'in-tint': ch('in-tint'),
        'in-ink': ch('in-ink'),
        'in-edge': ch('in-edge'),
        'out-tint': ch('out-tint'),
        'out-ink': ch('out-ink'),
        'out-edge': ch('out-edge'),
        'danger-tint': ch('danger-tint'),
        'danger-ink': ch('danger-ink'),
        'danger-edge': ch('danger-edge'),
        'transfer-tint': ch('transfer-tint'),
        'transfer-ink': ch('transfer-ink'),
        'transfer-edge': ch('transfer-edge'),
      },
      fontFamily: {
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: '0.6875rem',    /* 11px - table headers, tags, meta */
        sm: '0.8125rem',    /* 13px - secondary body, captions */
        base: '0.875rem',   /* 14px - tables, form controls, buttons */
        md: '0.9375rem',    /* 15px - body copy */
        lg: '1.0625rem',    /* 17px - card titles */
        xl: '1.25rem',      /* 20px - dialog titles */
        '2xl': '1.5625rem', /* 25px - section headings */
        '3xl': '2rem',      /* 32px - sub-page headings */
        '4xl': '2.625rem',  /* 42px - page headings */
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '28px',
        xl: '32px',
        pill: '999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgb(46 43 37 / 0.14)',
        md: '0 3px 10px rgb(46 43 37 / 0.16)',
        lg: '0 12px 32px rgb(46 43 37 / 0.22)',
      },
    },
  },
  plugins: [],
};
