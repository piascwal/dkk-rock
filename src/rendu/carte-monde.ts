import { HAUTEUR_VUE } from '../config';
import { DUREE_CARTE, G } from '../jeu/vue';
import { Aleatoire } from '../moteur/maths';
import { NIVEAUX } from '../niveaux';
import { arcDe, suivantDansArc, type DefArc } from '../niveaux/arcs';
import { imageDe } from './feuilles-images';
import { ecritCentre } from './police';
import { THEMES, type Decor } from './themes';

/**
 * La carte du monde, entre deux niveaux : la région de chaque niveau de l'arc (prairie, montagne, neige, plage, ville,
 * club), une route qui les relie et le van qui roule de l'un à l'autre. Elle se construit d'après l'arc et le thème de
 * ses niveaux : un nouvel arc a sa carte sans rien dessiner, mais un nouveau thème doit avoir sa région ici (REGIONS).
 */

type Px = (x: number, y: number, w: number, h: number, c: string) => void;
type Region = (p: Px, x0: number, x1: number, h: number, r: Aleatoire) => void;

const REGIONS: Record<Decor, Region> = {
  pavillons: (p, x0, x1, h, r) => {
    p(x0, 0, x1 - x0, h, '#4f8f3a');
    for (let i = 0; i < (x1 - x0) / 5; i++) p(r.entier(x0, x1), r.entier(0, h), 1, 1, '#3d7a2c');
    for (let i = 0; i < 4; i++) {
      const x = r.entier(x0 + 2, x1 - 8);
      const y = r.entier(12, h - 12);
      p(x, y, 6, 4, '#e8d8b8');
      p(x - 1, y - 2, 8, 2, '#b8322a');
      p(x + 2, y + 2, 2, 2, '#5a3a22');
    }
    for (let i = 0; i < 6; i++) p(r.entier(x0, x1 - 3), r.entier(4, h - 6), 3, 3, '#2e6b22');
  },
  montagnes: (p, x0, x1, h, r) => {
    p(x0, 0, x1 - x0, h, '#6aa84f');
    for (let i = 0; i < 5; i++) {
      const cx = r.entier(x0, x1);
      const cy = r.entier(10, h - 10);
      for (let k = 0; k < 8; k++) p(cx - 8 + k, cy - k / 2, 16 - 2 * k, 1, k > 5 ? '#8fc46f' : '#4f8a3a');
    }
    for (let i = 0; i < 3; i++) {
      const x = r.entier(x0 + 2, x1 - 6);
      const y = r.entier(14, h - 14);
      p(x, y, 5, 3, '#8a5a2b');
      p(x - 1, y - 2, 7, 2, '#5e3b1a');
    }
  },
  pics: (p, x0, x1, h, r) => {
    p(x0, 0, x1 - x0, h, '#e6f0fb');
    for (let i = 0; i < 6; i++) {
      const cx = r.entier(x0 + 4, x1 - 4);
      const cy = r.entier(16, h - 8);
      for (let k = 0; k < 12; k++) p(cx - k, cy - 12 + k, 2 * k + 1, 1, k < 4 ? '#ffffff' : '#8d96a5');
    }
    for (let i = 0; i < (x1 - x0) / 4; i++) p(r.entier(x0, x1), r.entier(0, h), 1, 1, '#c4d6ec');
  },
  palmiers: (p, x0, x1, h, r) => {
    const mer = Math.round(h * 0.35);
    p(x0, 0, x1 - x0, mer, '#3fa7f2');
    p(x0, mer, x1 - x0, h - mer, '#e8cf8a');
    for (let i = 0; i < (x1 - x0) / 6; i++) p(r.entier(x0, x1 - 3), r.entier(2, mer - 2), 3, 1, '#a8dcff');
    p(x0, mer, x1 - x0, 1, '#fff4d0');
    for (let i = 0; i < 4; i++) {
      const x = r.entier(x0 + 3, x1 - 3);
      const y = r.entier(mer + 8, h - 6);
      p(x, y - 4, 1, 5, '#8a5a2b');
      p(x - 2, y - 5, 5, 1, '#2e8b57');
      p(x - 1, y - 6, 3, 1, '#2e8b57');
    }
  },
  immeubles: (p, x0, x1, h, r) => {
    p(x0, 0, x1 - x0, h, '#7d7f8a');
    for (let y = 6; y < h; y += 14) p(x0, y, x1 - x0, 2, '#5d5f68');
    for (let i = 0; i < 7; i++) {
      const x = r.entier(x0 + 1, x1 - 8);
      const y = r.entier(4, h - 12);
      p(x, y, 7, 8, '#4a4c56');
      for (let k = 0; k < 4; k++) p(x + 1 + (k % 2) * 3, y + 1 + Math.floor(k / 2) * 3, 2, 2, '#ffd23f');
    }
  },
  club: (p, x0, x1, h, r) => {
    p(x0, 0, x1 - x0, h, '#2a1440');
    for (let i = 0; i < (x1 - x0) / 2; i++)
      p(r.entier(x0, x1), r.entier(0, h), 1, 1, r.choix(['#ff4fd8', '#3fe0ff']));
    const x = Math.round((x0 + x1) / 2) - 4;
    p(x, 10, 8, h - 30, '#14081f');
    for (let y = 14; y < h - 22; y += 4) p(x + 2, y, 4, 1, '#ff4fd8');
  },
};

/** Les positions des niveaux de l'arc sur la carte : de gauche à droite, la route ondule. */
function points(arc: DefArc, largeur: number): [number, number][] {
  const n = arc.niveaux.length;
  const marge = 22;
  return arc.niveaux.map((_, i) => [
    Math.round(marge + (i * (largeur - 2 * marge)) / Math.max(1, n - 1)),
    Math.round(HAUTEUR_VUE * 0.56 + Math.sin(i * 1.9) * HAUTEUR_VUE * 0.16),
  ]);
}

const fonds = new Map<string, HTMLCanvasElement>();

/** Le fond de la carte (régions, route), dessiné une fois par arc et par largeur d'écran. */
function fond(arc: DefArc, largeur: number): HTMLCanvasElement {
  const cle = `${arc.id}-${largeur}`;
  const deja = fonds.get(cle);
  if (deja) return deja;
  const toile = document.createElement('canvas');
  toile.width = largeur;
  toile.height = HAUTEUR_VUE;
  const c = toile.getContext('2d')!;
  const p: Px = (x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const pts = points(arc, largeur);
  const r = new Aleatoire(7);
  arc.niveaux.forEach((niv, i) => {
    const x0 = i === 0 ? 0 : Math.round((pts[i - 1]![0] + pts[i]![0]) / 2);
    const x1 = i === pts.length - 1 ? largeur : Math.round((pts[i]![0] + pts[i + 1]![0]) / 2);
    REGIONS[THEMES[NIVEAUX[niv]!.theme].decor](p, x0, x1, HAUTEUR_VUE, r);
    // frontière en damier : les régions se fondent l'une dans l'autre
    if (i > 0) {
      const g = c.getImageData(x0 - 3, 0, 3, HAUTEUR_VUE);
      for (let y = 0; y < HAUTEUR_VUE; y++)
        for (let k = 0; k < 3; k++) if ((y + k) % 2) c.putImageData(g, x0, 0, k, y, 1, 1);
    }
  });
  // la route : un chemin de terre, en pointillés
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i]!;
    const [bx, by] = pts[i + 1]!;
    const n = Math.ceil(Math.hypot(bx - ax, by - ay));
    for (let k = 0; k <= n; k++) {
      const x = ax + ((bx - ax) * k) / n;
      const y = ay + ((by - ay) * k) / n;
      p(x - 1, y - 1, 3, 3, '#3a2a1a');
      if (k % 4 < 2) p(x, y, 1, 1, '#f0e0b0');
    }
  }
  p(0, 0, largeur, 2, '#120914');
  p(0, HAUTEUR_VUE - 2, largeur, 2, '#120914');
  p(0, 0, 2, HAUTEUR_VUE, '#120914');
  p(largeur - 2, 0, 2, HAUTEUR_VUE, '#120914');
  fonds.set(cle, toile);
  return toile;
}

/** Dessine la carte : `niveau` est celui qu'on vient de finir, `page` les ticks du trajet vers le suivant. */
export function dessineCarteMonde(
  ctx: CanvasRenderingContext2D,
  largeur: number,
  niveau: number,
  page: number,
  tick: number,
): void {
  const arc = arcDe(niveau);
  const pts = points(arc, largeur);
  ctx.drawImage(fond(arc, largeur), 0, 0);
  const i = arc.niveaux.indexOf(niveau);
  const suivant = suivantDansArc(niveau);
  const j = suivant === null ? i : arc.niveaux.indexOf(suivant);
  // les étapes : faites (or), la prochaine (clignote), les autres (gris)
  pts.forEach(([x, y], k) => {
    const faite = k <= i;
    const cible = k === j && Math.floor(tick / 15) % 2 === 0;
    ctx.fillStyle = '#120914';
    ctx.fillRect(x - 4, y - 4, 9, 9);
    ctx.fillStyle = faite ? '#ffd23f' : cible ? '#ff4fd8' : '#9a9aa6';
    ctx.fillRect(x - 3, y - 3, 7, 7);
    ecritCentre(ctx, String(k + 1), x + 1, y - 13, faite ? '#ffd23f' : '#ffffff');
  });
  // le trajet : un temps d'arrêt, la route (accélération puis freinage), l'arrivée
  const t = Math.min(1, Math.max(0, (page / DUREE_CARTE - 0.12) / 0.7));
  const lisse = t * t * (3 - 2 * t);
  const [ax, ay] = pts[i]!;
  const [bx, by] = pts[j]!;
  const x = ax + (bx - ax) * lisse;
  const y = ay + (by - ay) * lisse;
  const roule = t > 0 && t < 1;
  // la poussière derrière le van
  if (roule)
    for (let k = 1; k <= 4; k++) {
      ctx.globalAlpha = 0.5 - k * 0.1;
      ctx.fillStyle = '#d9d4c7';
      ctx.fillRect(Math.round(x - 12 - k * 3), Math.round(y - 2 + ((tick + k) % 3) - 1), 2, 2);
    }
  ctx.globalAlpha = 1;
  const img = imageDe(G.VAN);
  const saut = roule && Math.floor(tick / 4) % 2 ? -1 : 0;
  if (img) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, img.width, img.height, Math.round(x - 11), Math.round(y - 12 + saut), 22, 13);
    ctx.imageSmoothingEnabled = false;
  } else {
    ctx.fillStyle = '#efe6cc';
    ctx.fillRect(Math.round(x - 8), Math.round(y - 9 + saut), 16, 7);
  }
  const def = suivant === null ? null : NIVEAUX[suivant];
  if (def) ecritCentre(ctx, `En route : ${def.titre}`, largeur / 2, 6, '#ffffff');
}
