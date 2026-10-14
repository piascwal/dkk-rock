import { Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';
import type { Decor } from './themes';

/**
 * La vie du ciel : des nuages en pixels qui dérivent, des oiseaux qui battent des ailes. Tout est dessiné sans transparence ni
 * lissage ; les couleurs suivent le monde.
 */
interface Palette {
  /** le dessus du nuage, son ventre, son ombre */
  haut: string;
  corps: string;
  bas: string;
}

const NUAGES: Partial<Record<Decor, Palette>> = {
  pavillons: { haut: '#ffb08a', corps: '#c9739a', bas: '#7e4a86' },
  montagnes: { haut: '#ffffff', corps: '#e6f1fb', bas: '#b9d3ea' },
  pics: { haut: '#8aa3c4', corps: '#6a84a8', bas: '#4d6486' },
  palmiers: { haut: '#fff6dc', corps: '#ffd9a3', bas: '#f2a977' },
  immeubles: { haut: '#6a4f9e', corps: '#4d3a82', bas: '#372a63' },
  club: { haut: '#6a2a7e', corps: '#4a1a5e', bas: '#301044' },
};

/** Les mondes de plein ciel : des oiseaux y volent (couleur de leur silhouette). */
const OISEAUX: Partial<Record<Decor, string>> = {
  pavillons: '#2a1a3a',
  montagnes: '#25364f',
  pics: '#dfeaff',
  palmiers: '#5a2a2a',
};

const PERIODE = 1700;
const NB_NUAGES = 11;
const LARGEUR_MAX = 100;

/** Un nuage : un amas de disques, le dessus clair, le ventre plus sombre. */
function peintNuage(r: Aleatoire, pal: Palette, w: number): HTMLCanvasElement {
  const h = Math.round(w * 0.38) + 6;
  const toile = document.createElement('canvas');
  toile.width = w;
  toile.height = h;
  const c = toile.getContext('2d')!;
  const boules: [number, number, number][] = [];
  for (let x = 8; x < w - 8; x += r.entier(7, 12)) {
    const rayon = r.entier(5, 9) + Math.round(Math.min(x, w - x) / 9);
    boules.push([x, h - 8 - Math.round(rayon * 0.5), rayon]);
  }
  for (const [couleur, dy] of [
    [pal.bas, 2],
    [pal.corps, 0],
    [pal.haut, -2],
  ] as const) {
    c.fillStyle = couleur;
    for (const [x, y, rayon] of boules) disque(c, x, y + dy, couleur === pal.haut ? rayon - 2 : rayon);
  }
  // le dessous est plat, comme un vrai nuage de BD
  c.clearRect(0, h - 5, w, 5);
  return toile;
}

export class Ciel {
  private readonly nuages: {
    toile: HTMLCanvasElement;
    x: number;
    y: number;
    vitesse: number;
    profondeur: number;
  }[] = [];
  private readonly oiseau: string | undefined;

  constructor(decor: Decor) {
    const pal = NUAGES[decor];
    this.oiseau = OISEAUX[decor];
    if (!pal) return;
    const r = new Aleatoire(91);
    const formes = [0, 1, 2, 3].map(() => peintNuage(r, pal, r.entier(46, LARGEUR_MAX)));
    for (let i = 0; i < NB_NUAGES; i++) {
      const loin = i % 3 === 0;
      this.nuages.push({
        toile: formes[i % formes.length]!,
        x: (i * PERIODE) / NB_NUAGES + r.entier(0, 60),
        y: loin ? r.entier(6, 30) : r.entier(20, 70),
        vitesse: loin ? 0.012 : 0.03,
        profondeur: loin ? 0.04 : 0.08,
      });
    }
  }

  dessine(ctx: CanvasRenderingContext2D, camX: number, largeur: number, tick: number): void {
    for (const n of this.nuages) {
      const x = (((n.x + tick * n.vitesse - camX * n.profondeur) % PERIODE) + PERIODE) % PERIODE;
      for (let k = 0; x - k * PERIODE > -LARGEUR_MAX && k < 2; k++)
        if (x - k * PERIODE < largeur)
          ctx.drawImage(n.toile, Math.round(x - k * PERIODE) - LARGEUR_MAX / 2, n.y);
    }
  }

  /** Une volée de quatre oiseaux de temps en temps : de loin, quelques traits qui battent des ailes. */
  oiseaux(ctx: CanvasRenderingContext2D, camX: number, largeur: number, tick: number): void {
    if (!this.oiseau) return;
    ctx.fillStyle = this.oiseau;
    for (let v = 0; v < 3; v++) {
      const periode = 1500 + v * 400;
      const x = largeur + 30 - ((tick * (0.4 + v * 0.08) + v * 520 + camX * 0.1) % periode);
      if (x < -40 || x > largeur + 40) continue;
      for (let i = 0; i < 4; i++) {
        const bx = Math.round(x + i * 9 + (i % 2) * 3);
        const by = 28 + v * 17 + (i % 3) * 5 + Math.round(Math.sin((tick + v * 50) / 40 + i) * 2);
        const haut = Math.floor((tick + i * 5 + v * 3) / 10) % 2 === 0;
        // des ailes en V (levées) ou en chapeau (baissées), un pixel de corps au milieu
        ctx.fillRect(bx, by, 1, 1);
        for (const s of [-1, 1]) {
          ctx.fillRect(bx + s, by + (haut ? 0 : -1), 1, 1);
          ctx.fillRect(bx + s * 2, by + (haut ? -1 : 0), 1, 1);
          ctx.fillRect(bx + s * 3, by + (haut ? -2 : 1), 1, 1);
        }
      }
    }
  }
}
