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
