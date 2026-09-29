/** Gestaltungsrahmen (Wireframes, Abschnitt 1): sehr dunkles, leicht kühles Neutral; ein einziger kühler Akzent; kein Regenbogen. */
export default {
  content: ['./index.html', './mod.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        grund: '#11141a',
        flaeche: '#191d25',
        flaeche2: '#222733',
        linie: '#2e3441',
        text: '#e8ecf2',
        leise: '#9aa3b2',
        akzent: '#5aa9ff',
        akzentdunkel: '#2f6fc0',
        warn: '#f0b429',
        gefahr: '#ff6b6b',
        gut: '#5fd0a4',
      },
      borderRadius: { xl2: '1.25rem' },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
      transitionDuration: { DEFAULT: '180ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
  },
  plugins: [],
};
