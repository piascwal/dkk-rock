import { bruit } from '../moteur/maths';

/**
 * Les outils des tuiles en haute définition (voir tuiles-hd.ts) : une toile de 16 × D pixels d'art par tuile, peinte pixel par
 * pixel en quelques tons (pas de dégradé lisse : du pixel art plus fin, pas du dessin vectoriel), avec un peu d'irrégularité.
 */

/** pixels d'art par pixel du jeu */
export const D = 4;
/** côté de la toile d'une tuile */
export const N = 16 * D;
/** le contour sombre, partout le même */
export const CONTOUR = '#24160c';

/** Un pinceau sur une toile : `p` remplit un rectangle en pixels d'art, `pj` en pixels du jeu. */
export class Pinceau {
  constructor(
    readonly c: CanvasRenderingContext2D,
    /** décalage vertical (le débord des touffes au-dessus de la tuile) */
    readonly dy = 0,
  ) {}

  p(x: number, y: number, w: number, h: number, couleur: string): void {
    this.c.fillStyle = couleur;
    this.c.fillRect(Math.round(x), Math.round(y) + this.dy, Math.round(w), Math.round(h));
  }

  /** Efface un rectangle (pour découper un coin, un bout de planche). */
  efface(x: number, y: number, w: number, h: number): void {
    this.c.clearRect(Math.round(x), Math.round(y) + this.dy, Math.round(w), Math.round(h));
  }

  /** Des points épars d'une couleur, tirés d'un bruit fixe (la même tuile donne toujours le même grain). */
  grain(couleur: string, nombre: number, graine: number, taille = 1, x0 = 0, y0 = 0, w = N, h = N): void {
    for (let i = 0; i < nombre; i++) {
      const x = x0 + Math.floor(bruit(i, graine, 41) * (w - taille));
      const y = y0 + Math.floor(bruit(graine, i, 43) * (h - taille));
      this.p(x, y, taille, taille, couleur);
    }
  }
}

/** Une couleur #rrggbb éclaircie (k > 0) ou assombrie (k < 0), de -1 à 1. */
export function teinte(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const vers = k > 0 ? 255 : 0;
  const a = Math.abs(k);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (vers - v) * a));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/**
 * Découpe un coin arrondi en vraie courbe (un quart de cercle de rayon `r` pixels d'art), au coin (gauche|droite, haut|bas) de
 * la tuile ; `liseré` : une ligne sombre le long de la courbe, pour qu'elle se lise sur le fond.
 */
export function coinRond(pi: Pinceau, gauche: boolean, haut: boolean, r: number, lisere?: string): void {
  for (let i = 0; i < r; i++) {
    // la largeur à retirer sur la ligne i (depuis le bord) : ce qui est hors du cercle
    const dy = r - i - 0.5;
    const garde = Math.sqrt(Math.max(0, r * r - dy * dy));
    const retire = Math.ceil(r - garde);
    if (retire <= 0) continue;
    const y = haut ? i : N - 1 - i;
    const x = gauche ? 0 : N - retire;
    pi.efface(x, y, retire, 1);
    if (lisere) pi.p(gauche ? retire : N - retire - 1, y, 1, 1, lisere);
  }
}

/** Un nombre de 0 à 1, fixe pour une case et un usage (pour varier les tuiles : une marche cassée, une brique ébréchée). */
export const hasard = (tx: number, ty: number, usage: number): number => bruit(tx, ty, usage);
