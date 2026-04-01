import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' },
        // iPad and above in portrait
        'portrait:lg': { 'raw': '(min-width: 768px) and (orientation: portrait)' },
        // iPad and above in landscape
        'landscape:lg': { 'raw': '(min-width: 1024px) and (orientation: landscape)' },
        // Large landscape (desktop, large landscape tablets)
        'landscape:2xl': { 'raw': '(min-width: 1280px) and (orientation: landscape)' },
      },
    },
  },
  plugins: [],
} satisfies Config;
