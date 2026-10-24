import type { Pinceau } from './pinceau';

/**
 * Les personnages dessinés en code (les gens de l'International Tour, en attendant leurs planches) font des dizaines de
 * rectangles par image ; dans un monde sombre, chacun recevait en plus son propre flou (la lueur, voir dessin-entites.ts),
 * de quoi faire ramer un téléphone. Ici, on enregistre les rectangles d'un dessin, on les peint une fois sur une petite toile,
 * et les images suivantes identiques ne coûtent plus qu'un `drawImage` (et un seul flou).
 */

type Rect = [number, number, number, number, string];

interface Image {
  toile: HTMLCanvasElement;
  x: number;
  y: number;
}

/** Au-delà, on vide tout : quelques centaines d'images de personnages, quelques mégaoctets au plus. */
const MAX_IMAGES = 400;
const images = new Map<string, Image>();

/** Peint `dessin` (pieds en (0, 0)) sur `ctx`, depuis le cache si la même image a déjà été dessinée. */
export function dessineEnCache(ctx: CanvasRenderingContext2D, dessin: (p: Pinceau) => void): void {
  const rects: Rect[] = [];
  dessin((x, y, w, h, couleur) => {
    if (w > 0 && h > 0) rects.push([x, y, w, h, couleur]);
  });
  if (!rects.length) return;
  // la clé : les rectangles eux-mêmes (deux compteurs d'animation qui donnent la même image partagent la toile)
  const cle = rects.join(';');
  let image = images.get(cle);
  if (!image) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [x, y, w, h] of rects) {
      x0 = Math.min(x0, Math.floor(x));
      y0 = Math.min(y0, Math.floor(y));
      x1 = Math.max(x1, Math.ceil(x + w));
      y1 = Math.max(y1, Math.ceil(y + h));
    }
    const toile = document.createElement('canvas');
    toile.width = x1 - x0;
    toile.height = y1 - y0;
    const c = toile.getContext('2d')!;
    c.translate(-x0, -y0);
    for (const [x, y, w, h, couleur] of rects) {
      c.fillStyle = couleur;
      c.fillRect(x, y, w, h);
    }
    if (images.size >= MAX_IMAGES) images.clear();
    image = { toile, x: x0, y: y0 };
    images.set(cle, image);
  }
  ctx.drawImage(image.toile, image.x, image.y);
}
