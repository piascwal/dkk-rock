import { VERSION } from '../version';

/**
 * L'œuf que lance Fadatchi (le kiwi) : l'image fournie, en 256 couleurs (sprites/oeuf.png, 9 Ko). Dessinée réduite à sa taille
 * en jeu : le grain se voit ainsi. Tant qu'elle n'est pas chargée, le dessin en code de repli sert (voir dessins-tirs.ts).
 */

/** La taille de l'œuf en pixels du jeu, centré sur sa position. */
const LARGEUR = 24;
const HAUTEUR = 30;

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
export function dessineOeuf(ctx: CanvasRenderingContext2D): boolean {
  if (!image) return false;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, -LARGEUR / 2, -HAUTEUR / 2, LARGEUR, HAUTEUR);
  ctx.imageSmoothingEnabled = false;
  return true;
}
