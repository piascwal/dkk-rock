import { HAUTEUR_VUE } from '../config';
import { PRE } from '../jeu/drift-pelouse';
import { FOCALE, HAUTEUR, HORIZON, type Regard } from './drift-sol';

/**
 * La lisière du pré du Clos : une haie, une rangée d'arbres et la maison, plantées tout autour, à quelques mètres de la clôture.
 * Ce n'est pas un panorama à l'infini : chaque colonne de l'écran lance un rayon jusqu'à la lisière (un rectangle autour du
 * pré), qui grandit quand on s'en approche, comme les murs des vieux jeux en 3D. Sa texture est peinte une fois.
 */

/** La lisière est plantée à ce recul de la clôture (m), haute de ce qu'il faut pour les grands arbres (m). */
export const RECUL_LISIERE = 5;
const HAUT_LISIERE = 12;
/** Les pixels de texture par mètre de lisière. */
const PX_M = 8;

const X0 = -RECUL_LISIERE;
const X1 = PRE.largeur + RECUL_LISIERE;
const Y0 = -RECUL_LISIERE;
const Y1 = PRE.profondeur + RECUL_LISIERE;
const LONG_X = X1 - X0;
const LONG_Y = Y1 - Y0;
/** Le tour de la lisière, en mètres : le sud (de x0 à x1), l'est, le nord (de x1 à x0), l'ouest. */
const TOUR = 2 * (LONG_X + LONG_Y);
/** La maison du Clos, sur la lisière nord (face au départ), un peu à gauche : la position de son milieu (x, en mètres). */
const X_MAISON = 22;

/** Garde la caméra en deçà de la lisière : derrière la voiture qui longe la clôture, elle ne passe pas dans les arbres. */
export function borneCamera(x: number, y: number): [number, number] {
  return [Math.min(X1 - 0.8, Math.max(X0 + 0.8, x)), Math.min(Y1 - 0.8, Math.max(Y0 + 0.8, y))];
}

export class Lisiere {
  private texels: Uint32Array | null = null;
  private tw = 0;
  private th = 0;

  /**
   * Dessine la lisière dans le tampon `px` (toute la vue, une case par pixel), par-dessus le sol déjà peint : un rayon par
   * colonne, jusqu'au rectangle de la lisière, puis la colonne de texture à la bonne hauteur. Le transparent laisse voir le ciel.
   */
  dessine(
    px: Uint32Array,
    largeur: number,
    regard: Regard,
    brumeA: (z: number) => number,
    brume: number[],
  ): void {
    if (!this.texels) this.peins();
    const t = this.texels!;
    const dx = Math.cos(regard.cap);
    const dy = Math.sin(regard.cap);
    for (let s = 0; s < largeur; s++) {
      const k = (s + 0.5 - largeur / 2) / FOCALE;
      // la direction du rayon, à une unité d'avancée dans l'axe de la caméra : son paramètre est la profondeur z
      const rx = dx + dy * k;
      const ry = dy - dx * k;
      const zx = rx > 1e-9 ? (X1 - regard.x) / rx : rx < -1e-9 ? (X0 - regard.x) / rx : Infinity;
      const zy = ry > 1e-9 ? (Y1 - regard.y) / ry : ry < -1e-9 ? (Y0 - regard.y) / ry : Infinity;
      const z = Math.min(zx, zy);
      if (!Number.isFinite(z) || z <= 0.05) continue;
      const hx = regard.x + rx * z;
      const hy = regard.y + ry * z;
      const u =
        zx < zy
          ? rx > 0
            ? LONG_X + (hy - Y0)
            : 2 * LONG_X + LONG_Y + (Y1 - hy)
          : ry > 0
            ? LONG_X + LONG_Y + (X1 - hx)
            : hx - X0;
      const col = ((Math.floor(u * PX_M) % this.tw) + this.tw) % this.tw;
      const bas = HORIZON + (HAUTEUR * FOCALE) / z;
      const haut = HORIZON - ((HAUT_LISIERE - HAUTEUR) * FOCALE) / z;
      const f = brumeA(z);
      const g = 1 - f;
      for (let y = Math.max(0, Math.ceil(haut)); y <= Math.min(HAUTEUR_VUE - 1, Math.floor(bas)); y++) {
        const ligne = Math.min(this.th - 1, Math.floor(((y + 0.5 - haut) / (bas - haut)) * this.th));
        const c = t[ligne * this.tw + col]!;
        if (c >>> 24 === 0) continue;
        px[y * largeur + s] =
          0xff000000 |
          (Math.round(((c >> 16) & 255) * g + brume[2]! * f) << 16) |
          (Math.round(((c >> 8) & 255) * g + brume[1]! * f) << 8) |
          Math.round((c & 255) * g + brume[0]! * f);
      }
    }
  }

  /** Peint la texture de la lisière : une haie au pied, des arbres ronds et des peupliers, la maison du Clos au nord. */
  private peins(): void {
    const w = Math.round(TOUR * PX_M);
    const h = HAUT_LISIERE * PX_M;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d')!;
    let graine = 11;
    const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
    const rect = (x: number, y: number, l: number, hh: number, couleur: string) => {
      g.fillStyle = couleur;
      for (const d of [0, -w, w]) g.fillRect(Math.round(x + d), Math.round(y), Math.round(l), Math.round(hh));
    };
    // un disque en pixels (pas de bord adouci)
    const disque = (cx: number, cy: number, r: number, couleur: string) => {
      for (let yy = -r; yy <= r; yy++) {
        const l = Math.round(Math.sqrt(r * r - yy * yy));
        rect(cx - l, cy + yy, 2 * l + 1, 1, couleur);
      }
    };
    const sol = h; // le pied de la lisière, en bas de la texture
    // les arbres : un tronc, un houppier de quelques disques, deux verts et un reflet
    for (let x = 0; x < w; x += 18 + Math.floor(hasard() * 26)) {
      if (hasard() < 0.18) {
        // un peuplier, haut et étroit
        rect(x - 1, sol - 30, 3, 30, '#4a3320');
        for (let k = 0; k < 6; k++) disque(x, sol - 34 - k * 9, 7 - Math.abs(k - 2), '#2a5e27');
        continue;
      }
      const r = 12 + Math.floor(hasard() * 10);
      const cy = sol - 30 - Math.floor(hasard() * 22);
      rect(x - 2, cy, 5, sol - cy, '#4a3320');
      const vert = hasard() < 0.5 ? '#2f6b2a' : '#3c7d31';
      disque(x, cy, r, vert);
      disque(x - r / 2, cy + 4, Math.round(r * 0.7), vert);
      disque(x + r / 2, cy + 3, Math.round(r * 0.7), vert);
      disque(x - 3, cy - r / 3, Math.round(r * 0.45), '#4f9a3c');
    }
    // la haie au pied, opaque : on ne voit pas le pré qui continue derrière
    for (let x = 0; x < w; x += 6)
      disque(x, sol - 9, 8 + Math.floor(hasard() * 5), hasard() < 0.5 ? '#2c6427' : '#356f2e');
    rect(0, sol - 8, w, 8, '#2a5a25');
    // la maison du Clos : murs de pierre, toit de tuiles, une porte et deux fenêtres (dix mètres de large)
    const m = (LONG_X + LONG_Y + (X1 - X_MAISON)) * PX_M - 40;
    rect(m, sol - 48, 80, 48, '#b9a582');
    for (let i = 0; i < 40; i++) rect(m + 2 + hasard() * 72, sol - 46 + hasard() * 44, 6, 3, '#9c8a6b');
    for (let k = 0; k < 28; k++)
      rect(m - 6 + k * 1.6, sol - 48 - k, 92 - k * 3.2, 1, k % 3 ? '#b8492e' : '#a63c26');
    rect(m + 34, sol - 20, 12, 20, '#5b3a22');
    rect(m + 10, sol - 38, 12, 11, '#3b4a5a');
    rect(m + 58, sol - 38, 12, 11, '#3b4a5a');
    rect(m + 10, sol - 33, 12, 1, '#e8e0cc');
    rect(m + 58, sol - 33, 12, 1, '#e8e0cc');
    this.tw = w;
    this.th = h;
    this.texels = new Uint32Array(g.getImageData(0, 0, w, h).data.buffer);
  }
}
