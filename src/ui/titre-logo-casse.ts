/**
 * Le logo de l'écran titre cassé morceau par morceau (pendant le spectacle de la batterie, voir titre-concert.ts). Le titre « DKK »
 * et le slogan sont des éléments de la page : chacun est découpé en cases, et chaque coup en fait disparaître les plus proches (un
 * masque CSS, `clip-path`, qui ne garde que les cases restantes) ; les éclats, eux, sont dessinés sur la toile. À la fin, le logo
 * revient d'un seul bloc (le masque retiré).
 */

interface Piece {
  el: HTMLElement;
  cols: number;
  lignes: number;
  restantes: Set<number>;
}

export interface LogoCasse {
  ecran: HTMLElement;
  pieces: Piece[];
  /** le temps qu'il tremble encore (s) */
  tremble: number;
}

/** Les ombres du titre débordent de sa boîte (12 pixels en bas à droite) : les cases la débordent aussi. */
const MARGE = 16;

export function nouveauLogo(ecran: HTMLElement): LogoCasse {
  const pieces: Piece[] = [];
  for (const [sel, cols, lignes] of [
    ['.logo', 5, 3],
    ['.slogan', 7, 1],
  ] as const) {
    const el = ecran.querySelector<HTMLElement>(sel);
    if (el)
      pieces.push({
        el,
        cols,
        lignes,
        restantes: new Set(Array.from({ length: cols * lignes }, (_, i) => i)),
      });
  }
  return { ecran, pieces, tremble: 0 };
}

/** Une case : son rectangle dans l'élément (pixels de sa boîte, marges comprises). */
function caseDe(p: Piece, i: number): [number, number, number, number] {
  const [w, h] = [p.el.offsetWidth + 2 * MARGE, p.el.offsetHeight + 2 * MARGE];
  const [c, l] = [i % p.cols, Math.floor(i / p.cols)];
  const [x0, x1] = [Math.round((c * w) / p.cols), Math.round(((c + 1) * w) / p.cols)];
  const [y0, y1] = [Math.round((l * h) / p.lignes), Math.round(((l + 1) * h) / p.lignes)];
  return [x0 - MARGE, y0 - MARGE, x1 - x0, y1 - y0];
}

/** Le masque : les cases restantes (aucune : rien de visible). */
function masque(p: Piece): void {
  const rects = [...p.restantes].map((i) => {
    const [x, y, w, h] = caseDe(p, i);
    return `M${x} ${y}h${w}v${h}h${-w}Z`;
  });
  p.el.style.clipPath = rects.length ? `path('${rects.join('')}')` : 'polygon(0 0, 0 0, 0 0)';
}

/** Un coup en (x, y) (pixels de la toile) : les `n` cases les plus proches disparaissent ; leurs rectangles (pour les éclats). */
export function casse(l: LogoCasse, x: number, y: number, n: number): [number, number, number, number][] {
  const boite = l.ecran.getBoundingClientRect();
  const proches: { p: Piece; i: number; d: number; r: [number, number, number, number] }[] = [];
  for (const p of l.pieces) {
    const b = p.el.getBoundingClientRect();
    for (const i of p.restantes) {
      const [cx, cy, w, h] = caseDe(p, i);
      const r: [number, number, number, number] = [b.left - boite.left + cx, b.top - boite.top + cy, w, h];
      proches.push({ p, i, d: Math.hypot(r[0] + w / 2 - x, r[1] + h / 2 - y) + Math.random() * 30, r });
    }
  }
  l.tremble = 0.25;
  return proches
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(({ p, i, r }) => {
      p.restantes.delete(i);
      masque(p);
      return r;
    });
}

/** Il tremble sous les coups (un pas de temps `dt`) ; `ampleur` en pixels. */
export function tremble(l: LogoCasse, dt: number, ampleur: number): void {
  l.tremble = Math.max(0, l.tremble - dt);
  const t = l.tremble > 0 ? ampleur : 0;
  for (const p of l.pieces)
    p.el.style.transform = t
      ? `translate(${(Math.random() * 2 - 1) * t}px, ${(Math.random() * 2 - 1) * t}px)`
      : '';
}

/** Le logo d'un seul bloc, comme neuf. */
export function repare(l: LogoCasse): void {
  for (const p of l.pieces) {
    p.restantes = new Set(Array.from({ length: p.cols * p.lignes }, (_, i) => i));
    [p.el.style.clipPath, p.el.style.transform] = ['', ''];
  }
  l.tremble = 0;
}
