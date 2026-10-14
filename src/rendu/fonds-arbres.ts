import { disque } from './formes-pixels';

/**
 * Les arbres des plans lointains, dessinés en pixels (rangée par rangée, sans lissage) : deux tons chacun, le côté
 * éclairé à gauche, comme les sprites. On peint sur la bande d'un plan de décor (voir fonds.ts).
 */

type Ctx = CanvasRenderingContext2D;

/** Une couleur #rrggbb mêlée à une autre, de 0 (elle-même) à 1 (l'autre). */
export function teinte(hex: string, vers: [number, number, number], k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const v = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c, i) => Math.round(c + (vers[i]! - c) * k));
  return `rgb(${v[0]},${v[1]},${v[2]})`;
}

/** Un sapin à étages ; `neige` le poudre de blanc. (x, y) : le pied du tronc. */
export function sapinPixel(c: Ctx, x: number, y: number, h: number, feuille: string, neige?: string): void {
  const clair = neige ?? teinte(feuille, [255, 255, 200], 0.28);
  const sombre = teinte(feuille, [0, 0, 20], 0.3);
  const etage = 5;
  const tronc = Math.max(2, Math.round(h * 0.12));
  c.fillStyle = '#4a3020';
  c.fillRect(x - 1, y - tronc, 2, tronc);
  for (let r = 0; r < h - tronc; r++) {
    const t = Math.floor(r / etage);
    const demi = 1 + t * 2 + Math.floor((r % etage) / 2);
    const yy = y - h + r;
    c.fillStyle = r % etage === 0 && neige ? neige : feuille;
    c.fillRect(x - demi, yy, demi * 2, 1);
    c.fillStyle = clair;
    c.fillRect(x - demi, yy, Math.max(1, Math.ceil(demi * 0.6)), 1);
    c.fillStyle = sombre;
    c.fillRect(x + Math.ceil(demi * 0.5), yy, Math.floor(demi * 0.5), 1);
  }
}

/** Un arbre rond : un tronc, une couronne de trois boules, un reflet. (x, y) : le pied du tronc. */
export function arbreRond(c: Ctx, x: number, y: number, h: number, feuille: string, tronc = '#4a3020'): void {
  const r = Math.max(4, Math.round(h * 0.3));
  const hautTronc = Math.round(h * 0.5);
  c.fillStyle = tronc;
  c.fillRect(x - 1, y - hautTronc, 2, hautTronc);
  const cy = y - hautTronc - Math.round(r * 0.5);
  const boules: [number, number, number][] = [
    [x, cy - Math.round(r * 0.3), r],
    [x - Math.round(r * 0.8), cy + Math.round(r * 0.2), Math.round(r * 0.8)],
    [x + Math.round(r * 0.8), cy + Math.round(r * 0.2), Math.round(r * 0.8)],
  ];
  c.fillStyle = teinte(feuille, [0, 0, 20], 0.3);
  for (const [bx, by, br] of boules) disque(c, bx + 1, by + 1, br);
  c.fillStyle = feuille;
  for (const [bx, by, br] of boules) disque(c, bx, by, br);
  c.fillStyle = teinte(feuille, [255, 255, 200], 0.28);
  for (const [bx, by, br] of boules)
    disque(c, bx - Math.round(br * 0.3), by - Math.round(br * 0.3), Math.round(br * 0.5));
}

/** Un palmier : un tronc qui se courbe, une touffe de palmes qui retombent. (x, y) : le pied du tronc. */
export function palmierPixel(
  c: Ctx,
  x: number,
  y: number,
  h: number,
  feuille: string,
  tronc = '#5a3a22',
): void {
  let hx = x;
  for (let i = 0; i < h; i++) {
    hx = x + Math.round(Math.sin((i / h) * Math.PI * 0.5) * h * 0.2);
    c.fillStyle = i % 4 === 0 ? teinte(tronc, [0, 0, 0], 0.25) : tronc;
    c.fillRect(hx, y - i, 2, 1);
  }
  const clair = teinte(feuille, [255, 255, 200], 0.3);
  const sombre = teinte(feuille, [0, 0, 20], 0.3);
  for (const a of [-2.9, -2.4, -1.9, -1.2, -0.7, -0.2]) {
    for (let t = 0; t < 15; t++) {
      const fx = hx + Math.round(Math.cos(a) * t);
      const fy = y - h + Math.round(Math.sin(a) * t * 0.6 + (t * t) / 38);
      c.fillStyle = feuille;
      c.fillRect(fx, fy, 2, 2);
      c.fillStyle = a < -1.5 ? clair : sombre;
      c.fillRect(fx, fy - 1, 2, 1);
    }
  }
}

/** Une brume légère au pied d'un plan : elle estompe la jonction avec le plan suivant. */
export function brume(c: Ctx, largeur: number, y0: number, y1: number, couleur: string): void {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, couleur);
  c.globalCompositeOperation = 'source-atop'; // seulement sur ce qui est déjà peint : pas de voile dans le ciel
  c.fillStyle = g;
  c.fillRect(0, y0, largeur, y1 - y0);
  c.globalCompositeOperation = 'source-over';
}
