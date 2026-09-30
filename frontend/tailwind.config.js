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
      fontFamily: {
        // Nutzer-App: eigene Schriften, im Paket mitgeliefert — kein Abruf bei Dritten
        display: ['"Bricolage Grotesque Variable"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem' },
      keyframes: {
        auftritt: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        hochfahren: { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        einblenden: { from: { opacity: '0' }, to: { opacity: '1' } },
        radar: { from: { transform: 'scale(0.3)', opacity: '0.9' }, to: { transform: 'scale(1)', opacity: '0' } },
      },
      animation: {
        auftritt: 'auftritt 320ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        hochfahren: 'hochfahren 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        einblenden: 'einblenden 200ms ease-out both',
        radar: 'radar 3.3s cubic-bezier(0.2, 0.6, 0.3, 1) infinite both',
      },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
      transitionDuration: { DEFAULT: '180ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
  },
  plugins: [],
};
