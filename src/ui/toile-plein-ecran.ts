/**
 * Cale une toile plein écran sur une hauteur de `hauteur` pixels du jeu, agrandis d'un facteur entier (netteté au pixel
 * près), et renvoie sa largeur en pixels du jeu. Servent l'intro et les animations de recrue.
 */
export function calibreToile(
  toile: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  hauteur: number,
): number {
  const k = Math.max(1, Math.floor((innerHeight * (devicePixelRatio || 1)) / hauteur));
  const w = Math.round((hauteur * innerWidth) / innerHeight);
  toile.width = w * k;
  toile.height = hauteur * k;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return w;
}
