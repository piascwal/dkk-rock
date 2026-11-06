import { VERSION } from '../version';

/**
 * L'œuf que lance Fadatchi (le kiwi) : l'image fournie, en 256 couleurs (sprites/oeuf.png, 9 Ko). Recadrée sur l'œuf et accentuée (les
 * poils, ce qui le distingue, ressortent), à peu près à sa taille en jeu. Tant qu'elle n'est pas chargée, le dessin en code de repli sert (voir dessins-tirs.ts).
 */

/** La taille de l'œuf en pixels du jeu, centré sur sa position. */
const LARGEUR = 9;
const HAUTEUR = 11;

let image: HTMLImageElement | null = null;

/** Lance le chargement (avec les autres planches). */
export function chargeOeuf(base: string): void {
  const img = new Image();
  img.onload = () => {
    image = img;
  };
  img.src = `${base}sprites/oeuf.png?v=${VERSION}`;
}

/** Dessine l'œuf à l'origine du repère courant ; faux si l'image n'est pas encore chargée. */
/** `x` : sa position dans le monde ; il roule sans glisser : il tourne d'un tour de plus tous les 2π rayons parcourus. */
export function dessineOeuf(ctx: CanvasRenderingContext2D, x = 0): boolean {
  if (!image) return false;
  ctx.rotate(x / (LARGEUR / 2));
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, -LARGEUR / 2, -HAUTEUR / 2, LARGEUR, HAUTEUR);
  ctx.imageSmoothingEnabled = false;
  return true;
}
