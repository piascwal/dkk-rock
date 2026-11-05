import { optimise } from './chrono';
/**
 * Des formes sans lissage, rangée de pixels par rangée de pixels : le canvas dessine les arcs avec de l'anticrénelage,
 * ce qui détonne à côté des sprites. Rayons et coordonnées sont arrondis au pixel du jeu.
 */

/** Un disque plein de rayon `r` (pixels), centré en (x, y). */
export function disque(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const R = Math.max(1, Math.round(r));
  for (let dy = -R; dy <= R; dy++) {
    const l = Math.round(Math.sqrt(R * R + R * 0.6 - dy * dy));
    ctx.fillRect(x - l, y + dy, l * 2 + 1, 1);
  }
}

/** Les disques déjà peints, par couleur puis par rayon et finesse (voir disquePeint). */
const disques = new Map<string, Map<number, HTMLCanvasElement>>();

/**
 * Un disque de couleur `couleur` (le même que `disque`) (voir chrono.ts : optimise), peint une fois pour toutes dans
 * une petite image à la finesse `d` de l'affichage, puis recopié d'un seul ordre de dessin au lieu de deux par rangée ; une
 * explosion en dessine des dizaines par image.
 */
export function disquePeint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  couleur: string,
  d: number,
): void {
  if (!optimise()) {
    ctx.fillStyle = couleur;
    disque(ctx, x, y, r);
    return;
  }
  const R = Math.max(1, Math.round(r));
  let parRayon = disques.get(couleur);
  if (!parRayon) disques.set(couleur, (parRayon = new Map()));
  const cle = R * 16 + d;
  let image = parRayon.get(cle);
  if (!image) {
    image = document.createElement('canvas');
    image.width = (2 * R + 3) * d;
    image.height = (2 * R + 1) * d;
    const c = image.getContext('2d')!;
    c.scale(d, d);
    c.fillStyle = couleur;
    disque(c, R + 1, R, R);
    parRayon.set(cle, image);
  }
  ctx.drawImage(image, x - R - 1, y - R, 2 * R + 3, 2 * R + 1);
}

/** Un anneau d'un pixel d'épaisseur de rayon `r`, centré en (x, y). */
export function anneau(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const R = Math.max(2, Math.round(r));
  const largeur = (dy: number) => Math.round(Math.sqrt(Math.max(0, R * R + R * 0.6 - dy * dy)));
  for (let dy = -R; dy <= R; dy++) {
    const l = largeur(dy);
    // le bout de rangée suit la rangée voisine pour que le contour reste continu
    const suivant = dy === R ? 0 : largeur(dy + 1);
    const precedent = dy === -R ? 0 : largeur(dy - 1);
    const reste = Math.max(1, l - Math.min(suivant, precedent));
    ctx.fillRect(x - l, y + dy, reste, 1);
    ctx.fillRect(x + l - reste + 1, y + dy, reste, 1);
  }
}

/** Une note de musique de 4 × 6 pixels (queue, tête, crochet), cernée de noir, dont le coin haut gauche est en (x, y). */
export function note(ctx: CanvasRenderingContext2D, x: number, y: number, couleur: string): void {
  const forme = (dx: number, dy: number, coul: string) => {
    ctx.fillStyle = coul;
    ctx.fillRect(x + 2 + dx, y + dy, 1, 5);
    ctx.fillRect(x + dx, y + 4 + dy, 3, 2);
    ctx.fillRect(x + 3 + dx, y + dy, 1, 2);
  };
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const)
    forme(dx, dy, '#000000');
  forme(0, 0, couleur);
}
