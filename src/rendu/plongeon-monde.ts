import { HAUTEUR } from '../jeu/plongeon';

/**
 * Le repère du décor du plongeon (voir plongeon-gorge.ts) : S pixels par mètre ; l'image couvre ±XM en travers, de YH (le ciel,
 * au-dessus du pont) à YB (le lit de la rivière) ; px et py passent des mètres aux pixels de l'image.
 */
export const S = 14;
export const XM = 14;
export const YH = -16;
export const YB = HAUTEUR + 6;
export const LARGEUR_MONDE = 2 * XM * S;
export const HAUTEUR_MONDE = (YB - YH) * S;

export const px = (x: number): number => Math.round((x + XM) * S);
export const py = (y: number): number => Math.round((y - YH) * S);

export function rect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  couleur: string,
): void {
  c.fillStyle = couleur;
  c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

/** Une couleur entre `a` (k = 0) et `b` (k = 1). */
export const mele = (a: [number, number, number], b: [number, number, number], k: number): string =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i]! - v) * Math.max(0, Math.min(1, k)))).join(',')})`;
