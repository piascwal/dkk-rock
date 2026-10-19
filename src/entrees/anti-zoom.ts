/**
 * Empêche le zoom du navigateur sur iPad (Safari ignore `user-scalable=no`) : un double ou triple tapotement sur le jeu
 * ne doit ni zoomer la page, ni déclencher un zoom du pincement. Les taps sur les boutons restent normaux.
 */
export function installeAntiZoom(): void {
  // le pincement à deux doigts (Safari) : toujours annulé
  for (const nom of ['gesturestart', 'gesturechange', 'gestureend'] as const)
    document.addEventListener(nom, (e) => e.preventDefault(), { passive: false });

  // le double tapotement : un second toucher dans les 300 ms, à peu près au même endroit, est annulé
  let dernier = 0;
  let x = 0;
  let y = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const t = e.changedTouches[0];
      if (!t) return;
      const maintenant = performance.now();
      const proche = Math.hypot(t.clientX - x, t.clientY - y) < 30;
      if (maintenant - dernier < 300 && proche) e.preventDefault();
      dernier = maintenant;
      x = t.clientX;
      y = t.clientY;
    },
    { passive: false },
  );
}
