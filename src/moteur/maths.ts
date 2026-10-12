/** Petits outils mathématiques sans dépendance. */

export const borne = (v: number, min: number, max: number): number => (v < min ? min : v > max ? max : v);

export const signe = (v: number): -1 | 0 | 1 => (v > 0 ? 1 : v < 0 ? -1 : 0);

export const interpole = (a: number, b: number, t: number): number => a + (b - a) * t;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const chevauche = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const distance = (ax: number, ay: number, bx: number, by: number): number =>
  Math.hypot(bx - ax, by - ay);

/** Générateur pseudo-aléatoire reproductible (mulberry32) : mêmes graines, mêmes niveaux décorés. */
export class Aleatoire {
  private etat: number;

  constructor(graine = 1) {
    this.etat = graine >>> 0 || 1;
  }

  /** Nombre dans [0, 1[. */
  suivant(): number {
    this.etat = (this.etat + 0x6d2b79f5) >>> 0;
    let t = this.etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  entre(min: number, max: number): number {
    return min + (max - min) * this.suivant();
  }

  entier(min: number, max: number): number {
    return Math.floor(this.entre(min, max + 1));
  }

  choix<T>(liste: readonly T[]): T {
    return liste[Math.floor(this.suivant() * liste.length)]!;
  }
}

/** Bruit déterministe d'une case (pour décorer les tuiles sans rien stocker). */
export function bruit(x: number, y: number, graine = 0): number {
  let h = (x * 374761393 + y * 668265263 + graine * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
