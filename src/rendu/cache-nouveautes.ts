/**
 * Les images des nouveautés qu'il faut tourner ou rogner (le tourbillon du téléporteur) : dessinées une fois
 * dans une petite toile, à 6 pixels par pixel du jeu, puis reprises telles quelles à chaque image (tourner ou rogner une grande
 * image à chaque image coûte plusieurs fois le dessin d'un sprite ; voir CLAUDE.md, la fluidité sur téléphone).
 */
const ECHELLE = 6;
const toiles = new Map<string, HTMLCanvasElement>();

/**
 * La toile de `w` × `h` pixels du jeu (origine en haut à gauche) pour `cle`, faite par `dessine` la première fois. Rien si la
 * planche n'est pas encore chargée (`dessine` répond faux) : elle sera faite à l'image suivante.
 */
export function enCache(
  cle: string,
  w: number,
  h: number,
  dessine: (ctx: CanvasRenderingContext2D) => boolean,
): HTMLCanvasElement | null {
  let toile = toiles.get(cle);
  if (toile) return toile;
  toile = document.createElement('canvas');
  toile.width = w * ECHELLE;
  toile.height = h * ECHELLE;
  const ctx = toile.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.scale(ECHELLE, ECHELLE);
  if (!dessine(ctx)) return null;
  toiles.set(cle, toile);
  return toile;
}
