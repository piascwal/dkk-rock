import { HAUTEUR_VUE } from '../config';
import { PRE, type Pelouse } from '../jeu/drift-pelouse';

/**
 * Le pré du Clos vu de derrière la voiture : le sol est projeté rangée par rangée (comme le « mode 7 » des vieilles consoles)
 * dans une image hors écran, puis posé sous l'horizon ; au-dessus, le ciel et un panorama à 360° (la rangée d'arbres, la maison
 * du Clos) qui défile avec le cap de la caméra.
 */

/** La caméra : à `HAUTEUR` mètres du sol, sa focale en pixels du jeu, et la rangée de l'horizon. */
export const HAUTEUR = 2.6;
export const FOCALE = 170;
export const HORIZON = 58;

/** Où regarde la caméra : sa position au sol (m) et son cap (radians). */
export interface Regard {
  x: number;
  y: number;
  cap: number;
}

type Rvb = [number, number, number];
const hex = (h: string): Rvb => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
/** La pelouse tondue (deux bandes), puis l'herbe arrachée, la terre, la boue. */
const TONTE: [Rvb, Rvb] = [hex('#5fae3e'), hex('#6cbc48')];
const ABIMEE: Rvb[] = [hex('#5fae3e'), hex('#a3a14c'), hex('#8a6236'), hex('#5c3b21')];
const PRE_SAUVAGE = hex('#4b8b36');
const LOIN = hex('#3f7a30');
const CLOTURE = hex('#7a5230');
const POTEAU = hex('#4e321c');
const BRUME = hex('#c9e2d6');
const FLEURS: Rvb[] = [hex('#ffe066'), hex('#ffffff'), hex('#ff8fb1')];

/** Un bruit fixe par case : de petites variations de teinte, les fleurs du pré. */
const bruit = (c: number, r: number): number => {
  let h = (c * 374761393 + r * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export class SolDrift {
  private toile: HTMLCanvasElement | null = null;
  private image: ImageData | null = null;
  private panorama: HTMLCanvasElement | null = null;

  /** Le ciel, le panorama, puis le sol, sur toute la largeur de la vue. */
  dessine(ctx: CanvasRenderingContext2D, largeur: number, regard: Regard, pelouse: Pelouse): void {
    const ciel = ctx.createLinearGradient(0, 0, 0, HORIZON);
    ciel.addColorStop(0, '#3f9be6');
    ciel.addColorStop(1, '#c4e6f7');
    ctx.fillStyle = ciel;
    ctx.fillRect(0, 0, largeur, HORIZON);
    this.dessinePanorama(ctx, largeur, regard.cap);
    this.dessineSol(ctx, largeur, regard, pelouse);
  }

  private dessinePanorama(ctx: CanvasRenderingContext2D, largeur: number, cap: number): void {
    const p = (this.panorama ??= peinsPanorama());
    // un objet à l'azimut α est dessiné en x = largeur / 2 + (cap - α) × focale ; le panorama met α = -u / focale en u
    const tour = p.width;
    let x0 = (((largeur / 2 + cap * FOCALE) % tour) + tour) % tour;
    x0 -= tour;
    for (let x = x0; x < largeur; x += tour) ctx.drawImage(p, Math.round(x), HORIZON - p.height);
  }

  private dessineSol(ctx: CanvasRenderingContext2D, largeur: number, regard: Regard, pelouse: Pelouse): void {
    const hauteur = HAUTEUR_VUE - HORIZON;
    if (!this.toile || this.toile.width !== largeur) {
      this.toile = document.createElement('canvas');
      this.toile.width = largeur;
      this.toile.height = hauteur;
      this.image = this.toile.getContext('2d')!.createImageData(largeur, hauteur);
    }
    const img = this.image!;
    const px = new Uint32Array(img.data.buffer);
    const dx = Math.cos(regard.cap);
    const dy = Math.sin(regard.cap);
    // la droite de la caméra : son cap tourné d'un quart de tour dans le sens indirect
    const rx = dy;
    const ry = -dx;
    for (let r = 0; r < hauteur; r++) {
      const z = (HAUTEUR * FOCALE) / (r + 0.5);
      const brume = Math.min(0.8, Math.max(0, (z - 22) / 90));
      const cx = regard.x + dx * z;
      const cy = regard.y + dy * z;
      const pas = z / FOCALE;
      for (let s = 0; s < largeur; s++) {
        const lat = (s + 0.5 - largeur / 2) * pas;
        const c = couleur(cx + rx * lat, cy + ry * lat, pelouse);
        const k = 1 - brume;
        px[r * largeur + s] =
          0xff000000 |
          (Math.round(c[2] * k + BRUME[2] * brume) << 16) |
          (Math.round(c[1] * k + BRUME[1] * brume) << 8) |
          Math.round(c[0] * k + BRUME[0] * brume);
      }
    }
    this.toile!.getContext('2d')!.putImageData(img, 0, 0);
    ctx.drawImage(this.toile!, 0, HORIZON);
  }
}

/** La couleur du sol en (x, y), en mètres. */
function couleur(x: number, y: number, pelouse: Pelouse): Rvb {
  const etat = pelouse.etat(x, y);
  const c = Math.floor(x * 2);
  const r = Math.floor(y * 2);
  const b = bruit(c, r);
  if (etat > 0) return nuance(ABIMEE[etat]!, b);
  if (etat === 0) return nuance(TONTE[Math.floor(y / 2.5) & 1]!, b);
  // la clôture, juste autour du pré : des lisses de bois et un poteau tous les deux mètres
  const dehors = Math.max(-x, x - PRE.largeur, -y, y - PRE.profondeur);
  if (dehors < 0.35) {
    const long = x < 0 || x > PRE.largeur ? y : x;
    return long - Math.floor(long / 2) * 2 < 0.25 ? POTEAU : CLOTURE;
  }
  if (b < 0.012) return FLEURS[Math.floor(b * 250) % 3]!;
  return nuance(dehors > 30 ? LOIN : PRE_SAUVAGE, b);
}

/** Une petite variation de teinte, fixe pour chaque case. */
const nuance = (c: Rvb, b: number): Rvb => {
  const d = Math.round((b - 0.5) * 14);
  return [c[0] + d, c[1] + d, c[2] + d];
};

/**
 * Le panorama, peint une fois : un tour complet (2π × focale pixels de large), des collines au loin, une rangée d'arbres, de
 * grands peupliers, des nuages, et la maison du Clos (pierre et tuiles rouges) devant, un peu à gauche du départ.
 */
function peinsPanorama(): HTMLCanvasElement {
  const tour = Math.round(2 * Math.PI * FOCALE);
  const haut = 52;
  const c = document.createElement('canvas');
  c.width = tour;
  c.height = haut;
  const g = c.getContext('2d')!;
  let graine = 7;
  const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  const rect = (x: number, y: number, w: number, h: number, couleur: string) => {
    g.fillStyle = couleur;
    for (const dx of [0, -tour, tour]) g.fillRect(Math.round(x + dx), Math.round(y), w, h);
  };
  // des nuages, haut dans le ciel
  for (let i = 0; i < 14; i++) {
    const x = hasard() * tour;
    const y = 2 + hasard() * 12;
    for (let k = 0; k < 5; k++)
      rect(x + k * 6 - 6, y + (k % 2 ? 0 : 2), 14, 6, k % 2 ? '#ffffff' : '#eef7fc');
  }
  // les collines bleutées du lointain
  for (let x = 0; x < tour; x += 2) {
    const h = 8 + Math.sin(x / 70) * 4 + Math.sin(x / 23) * 2;
    rect(x, haut - h - 10, 2, h + 10, '#8fbfa6');
  }
  // la rangée d'arbres : des houppiers ronds, deux verts, un tronc
  for (let x = 0; x < tour; x += 7 + Math.floor(hasard() * 6)) {
    const h = 12 + hasard() * 14;
    const l = 9 + Math.floor(hasard() * 8);
    const vert = hasard() < 0.5 ? '#2f6b2a' : '#3c7d31';
    rect(x + l / 2 - 1, haut - 5, 2, 5, '#4a3320');
    rect(x, haut - h, l, h - 3, vert);
    rect(x + 2, haut - h - 2, l - 4, 3, vert);
    rect(x + 2, haut - h + 1, 3, 3, '#4f9a3c');
  }
  // de grands peupliers, ici et là
  for (let i = 0; i < 6; i++) {
    const x = hasard() * tour;
    rect(x, haut - 40, 5, 37, '#2a5e27');
    rect(x + 1, haut - 44, 3, 4, '#2a5e27');
    rect(x + 2, haut - 3, 1, 3, '#4a3320');
  }
  // la maison du Clos : murs de pierre, toit de tuiles, une porte et deux fenêtres
  const m = (((-(Math.PI / 2 + 0.45) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * FOCALE;
  rect(m, haut - 22, 30, 22, '#b9a582');
  for (let i = 0; i < 18; i++) rect(m + 1 + hasard() * 27, haut - 21 + hasard() * 20, 3, 2, '#9c8a6b');
  for (let k = 0; k < 9; k++) rect(m - 2 + k, haut - 22 - k, 34 - 2 * k, 1, k % 2 ? '#a63c26' : '#b8492e');
  rect(m + 13, haut - 9, 5, 9, '#5b3a22');
  rect(m + 4, haut - 17, 5, 5, '#3b4a5a');
  rect(m + 21, haut - 17, 5, 5, '#3b4a5a');
  return c;
}
