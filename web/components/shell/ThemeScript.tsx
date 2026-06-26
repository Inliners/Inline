/**
 * Injected as an inline <script> in <head> so it runs synchronously
 * before any HTML is painted — eliminating the dark/light flash.
 */
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var p = window.location.pathname;
        var marketing = p === '/' || p === '/install' || p === '/privacy' || p === '/terms';
        if (marketing) {
          document.documentElement.classList.remove('dark');
          return;
        }
        var t = localStorage.getItem('inline-theme') || 'light';
        if (t === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      } catch(e) {}
    })();
  `
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
