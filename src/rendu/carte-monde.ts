import { HAUTEUR_VUE } from '../config';
import { DUREE_CARTE, G } from '../jeu/vue';
import { Aleatoire, borne } from '../moteur/maths';
import { NIVEAUX } from '../niveaux';
import { arcDe, suivantDansArc, type DefArc } from '../niveaux/arcs';
import { C, SOLS, mer, type Px } from './carte-monde-decor';
import { imageDe } from './feuilles-images';
import { ecrit, ecritCentre } from './police';
import { THEMES } from './themes';

/**
 * La carte du monde entre deux niveaux, façon Super Mario Bros 3 : une île vue de dessus, une route qui serpente
 * d'étape en étape, une région par niveau (aux bords irréguliers) avec son sol et ses décors, et le van qui roule.
 * Elle se construit d'après l'arc et le thème de ses niveaux : un nouvel arc a sa carte tout seul, un nouveau thème doit
 * avoir son sol dans carte-monde-decor.ts (SOLS).
 */
const LT = 46; // largeur de la carte, en tuiles
const HT = 27;

interface Plan {
  /** la route : une ligne brisée (en tuiles), et la distance de chaque étape le long d'elle */
  route: [number, number][];
  etapes: number[];
  fond: HTMLCanvasElement;
}

const longueur = (r: [number, number][], i: number) =>
  Math.abs(r[i + 1]![0] - r[i]![0]) + Math.abs(r[i + 1]![1] - r[i]![1]);

/** Le point de la route à la distance `d` (en tuiles). */
function surRoute(route: [number, number][], d: number): [number, number] {
  for (let i = 0; i + 1 < route.length; i++) {
    const l = longueur(route, i);
    if (d <= l || i + 2 === route.length) {
      const t = l ? Math.min(1, d / l) : 0;
      return [
        route[i]![0] + (route[i + 1]![0] - route[i]![0]) * t,
        route[i]![1] + (route[i + 1]![1] - route[i]![1]) * t,
      ];
    }
    d -= l;
  }
  return route[0]!;
}

const plans = new Map<string, Plan>();

function plan(arc: DefArc): Plan {
  const deja = plans.get(arc.id);
  if (deja) return deja;
  // la route serpente : trois allers-retours sur l'île, avec des détours
  const route: [number, number][] = [
    [5, 21],
    [12, 21],
    [12, 17],
    [20, 17],
    [20, 21],
    [30, 21],
    [30, 18],
    [40, 18],
    [40, 12],
    [33, 12],
    [33, 8],
    [24, 8],
    [24, 12],
    [14, 12],
    [14, 6],
    [6, 6],
  ];
  let total = 0;
  for (let i = 0; i + 1 < route.length; i++) total += longueur(route, i);
  const n = arc.niveaux.length;
  const etapes = arc.niveaux.map((_, i) => Math.round((i * total) / Math.max(1, n - 1)));
  const pos = etapes.map((d) => surRoute(route, d));
  const r = new Aleatoire(arc.id.length * 31 + 5);

  // chaque case appartient à la région de l'étape la plus proche (bruitée : des bords irréguliers)
  const region: number[] = [];
  const surRouteOuPres = new Set<number>();
  for (let i = 0; i + 1 < route.length; i++) {
    const [ax, ay] = route[i]!;
    const [bx, by] = route[i + 1]!;
    for (let k = 0; k <= longueur(route, i); k++) {
      const t = k / Math.max(1, longueur(route, i));
      const x = Math.round(ax + (bx - ax) * t);
      const y = Math.round(ay + (by - ay) * t);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) surRouteOuPres.add((y + dy) * LT + x + dx);
    }
  }
  const toile = document.createElement('canvas');
  toile.width = LT * C;
  toile.height = HT * C;
  const c = toile.getContext('2d')!;
  const p: Px = (x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const ile = (x: number, y: number) => {
    const nx = (x - LT / 2) / (LT / 2 - 2.2);
    const ny = (y - HT / 2) / (HT / 2 - 2.2);
    return nx * nx * nx * nx + ny * ny * ny * ny + Math.sin(x * 1.3 + y * 0.7) * 0.08 < 1;
  };
  for (let y = 0; y < HT; y++)
    for (let x = 0; x < LT; x++) {
      let mieux = 0;
      let dmin = Infinity;
      pos.forEach(([px, py], k) => {
        const d = Math.hypot(px - x, py - y) + Math.sin(x * 0.9 + k) * 0.7 + Math.cos(y * 1.1 - k) * 0.7;
        if (d < dmin) [dmin, mieux] = [d, k];
      });
      region.push(mieux);
    }
  // sol, côtes et décors
  const occupe = new Set<number>();
  for (let y = 0; y < HT; y++)
    for (let x = 0; x < LT; x++) {
      if (!ile(x, y)) continue;
      const sol = SOLS[THEMES[NIVEAUX[arc.niveaux[region[y * LT + x]!]!]!.theme].decor];
      p(x * C, y * C, C, C, (x + y) % 2 ? sol.clair : sol.sombre);
    }
  // la plage autour de l'île : un liseré de sable et d'écume
  for (let y = 0; y < HT; y++)
    for (let x = 0; x < LT; x++) {
      if (!ile(x, y)) continue;
      for (const [dx, dy] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ] as const) {
        if (ile(x + dx, y + dy)) continue;
        const bx = x * C + (dx > 0 ? C - 2 : 0);
        const by = y * C + (dy > 0 ? C - 2 : 0);
        p(bx, by, dx ? 2 : C, dy ? 2 : C, '#f6e7b8');
      }
    }
  for (let y = 1; y < HT - 2; y++)
    for (let x = 1; x < LT - 2; x++) {
      const k = y * LT + x;
      const libre = (i: number) =>
        ile(i % LT, Math.floor(i / LT)) && !surRouteOuPres.has(i) && !occupe.has(i);
      if (!libre(k) || r.suivant() > 0.42) continue;
      const sol = SOLS[THEMES[NIVEAUX[arc.niveaux[region[k]!]!]!.theme].decor];
      const grand =
        [k, k + 1, k + LT, k + LT + 1].every(libre) && region[k + LT + 1] === region[k] && r.suivant() < 0.35;
      if (grand) {
        r.choix(sol.grands)(p, x * C, y * C);
        for (const i of [k, k + 1, k + LT, k + LT + 1]) occupe.add(i);
      } else {
        r.choix(sol.petits)(p, x * C, y * C, r);
        occupe.add(k);
      }
    }
  // la route : un chemin clair bordé de sombre, en pointillés au milieu
  for (const pass of [0, 1])
    for (let i = 0; i + 1 < route.length; i++) {
      const [ax, ay] = route[i]!;
      const [bx, by] = route[i + 1]!;
      const x0 = Math.min(ax, bx) * C + C / 2;
      const y0 = Math.min(ay, by) * C + C / 2;
      const w = Math.abs(bx - ax) * C;
      const h = Math.abs(by - ay) * C;
      if (pass === 0) p(x0 - 3, y0 - 3, w + 6, h + 6, '#4a2e12');
      else {
        p(x0 - 2, y0 - 2, w + 4, h + 4, '#f2dca4');
        for (let k = 0; k <= Math.max(w, h); k += 4) p(x0 + (w ? k : 0), y0 + (h ? k : 0), 1, 1, '#c8a868');
      }
    }
  const pl = { route, etapes, fond: toile };
  plans.set(arc.id, pl);
  return pl;
}

/** Le côté où regarde le van (1 : à droite), et les particules de ses pneus (en pixels de la carte). */
let cap = 1;
let crissements: { x: number; y: number; vx: number; vy: number; vie: number; c: string }[] = [];

/** L'état d'une étape sur la carte : faite (orange), la cible (rose qui clignote), ouverte (bleue), fermée (grise). */
export type EtatEtape = 'faite' | 'cible' | 'ouverte' | 'fermee';

const COULEURS_ETAPE: Record<EtatEtape, [string, string]> = {
  faite: ['#e0701f', '#ffd23f'],
  cible: ['#ff4fd8', '#ffa8ec'],
  ouverte: ['#2a3a8a', '#4a5ab0'],
  fermee: ['#3a3440', '#55505c'],
};

/** Où se trouvent le van et la caméra, le van étant à la position `pos` (en étapes : 2,5 = entre la 3e et la 4e). */
function cadrage(arc: DefArc, largeur: number, hauteur: number, pos: number) {
  const pl = plan(arc);
  const a = Math.floor(borne(pos, 0, pl.etapes.length - 1));
  const b = Math.min(pl.etapes.length - 1, a + 1);
  const d = pl.etapes[a]! + (pl.etapes[b]! - pl.etapes[a]!) * (pos - a);
  const [vx, vy] = surRoute(pl.route, d);
  const vanX = vx * C + C / 2;
  const vanY = vy * C + C / 2;
  const camX = Math.round(borne(vanX - largeur / 2, 0, Math.max(0, LT * C - largeur)));
  const camY = Math.round(borne(vanY - hauteur / 2, 0, Math.max(0, HT * C - hauteur)));
  return { pl, vanX, vanY, camX, camY, d };
}

/** L'étape sous le point (x, y) de l'écran, ou -1 (pour la choisir du doigt). */
export function etapeTouchee(
  arc: DefArc,
  largeur: number,
  hauteur: number,
  pos: number,
  x: number,
  y: number,
): number {
  const { pl, camX, camY } = cadrage(arc, largeur, hauteur, pos);
  return pl.etapes.findIndex((e) => {
    const [ex, ey] = surRoute(pl.route, e);
    return Math.abs(ex * C + C / 2 - camX - x) < 10 && Math.abs(ey * C + C / 2 - camY - y) < 10;
  });
}

/** Dessine la carte de l'arc, le van à la position `pos` (en étapes), chaque étape dans son état. */
export function dessineCarte(
  ctx: CanvasRenderingContext2D,
  largeur: number,
  hauteur: number,
  arc: DefArc,
  pos: number,
  etats: readonly EtatEtape[],
  titre: string,
  tick: number,
  /** 1 : il roule vers les étapes suivantes, -1 : vers les précédentes, 0 : arrêté */
  sens: number,
): void {
  const { pl, vanX, vanY, camX, camY, d } = cadrage(arc, largeur, hauteur, pos);
  const roule = sens !== 0;
  // le van regarde où il va : sur une portion verticale de la route, il garde son dernier côté
  if (roule) {
    const [ax] = surRoute(pl.route, d);
    const [bx] = surRoute(pl.route, d + sens * 0.6);
    if (Math.abs(bx - ax) > 0.01) cap = bx > ax ? 1 : -1;
  }
  const p: Px = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  // la mer qui scintille, puis l'île
  for (let gy = Math.floor(camY / C); gy <= (camY + hauteur) / C; gy++)
    for (let gx = Math.floor(camX / C); gx <= (camX + largeur) / C; gx++)
      mer(p, gx * C - camX, gy * C - camY, tick, gx, gy);
  ctx.drawImage(pl.fond, -camX, -camY);
  pl.etapes.forEach((e, k) => {
    const [ex, ey] = surRoute(pl.route, e);
    const x = ex * C + C / 2 - camX;
    const y = ey * C + C / 2 - camY;
    const etat = etats[k] ?? 'fermee';
    const [fond, haut] = COULEURS_ETAPE[etat === 'cible' && Math.floor(tick / 15) % 2 ? 'ouverte' : etat];
    p(x - 6, y - 6, 12, 12, '#1a0f0a');
    p(x - 5, y - 5, 10, 10, fond);
    p(x - 5, y - 5, 10, 2, haut);
    ecrit(ctx, String(k + 1), x - 1, y - 2, etat === 'fermee' ? '#8a8492' : '#ffffff');
  });
  // les pneus qui crissent : gomme et poussière projetées par les roues arrière, traces au sol
  if (roule) {
    const rx = vanX - cap * 7;
    for (let k = 0; k < 3; k++)
      crissements.push({
        x: rx,
        y: vanY - 1,
        vx: -cap * (0.4 + Math.random() * 0.9),
        vy: -Math.random() * 0.7,
        vie: 14 + Math.random() * 14,
        c: ['#4a4a50', '#8a8a92', '#e9e2d0', '#cfc6b0'][Math.floor(Math.random() * 4)]!,
      });
    crissements.push({ x: rx, y: vanY + 1, vx: 0, vy: 0, vie: 40, c: '#2a2026' });
  }
  for (const c of crissements) {
    c.x += c.vx;
    c.y += c.vy;
    if (c.vx) c.vy += 0.03; // les traces au sol, elles, ne bougent pas
    c.vie--;
    ctx.globalAlpha = Math.min(1, c.vie / 12);
    p(c.x - camX, c.y - camY, c.vx ? 1 : 2, 1, c.c);
  }
  crissements = crissements.filter((c) => c.vie > 0);
  ctx.globalAlpha = 1;
  const img = imageDe(G.VAN);
  const saut = roule && Math.floor(tick / 4) % 2 ? -1 : 0;
  if (img) {
    ctx.save();
    ctx.translate(Math.round(vanX - camX), Math.round(vanY - camY - 13 + saut));
    ctx.scale(cap, 1); // le sprite regarde à droite : on le retourne pour aller à gauche
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, img.width, img.height, -10, 0, 20, 12);
    ctx.imageSmoothingEnabled = false;
    ctx.restore();
  }
  if (titre) {
    p(0, 0, largeur, 11, 'rgba(10,5,12,0.75)');
    ecritCentre(ctx, titre, largeur / 2, 3, '#ffd23f');
  }
}

/** Entre deux niveaux : `niveau` est celui qu'on vient de finir, `page` les ticks du trajet vers le suivant. */
export function dessineCarteMonde(
  ctx: CanvasRenderingContext2D,
  largeur: number,
  niveau: number,
  page: number,
  tick: number,
): void {
  const arc = arcDe(niveau);
  const i = arc.niveaux.indexOf(niveau);
  const suivant = suivantDansArc(niveau);
  const j = suivant === null ? i : arc.niveaux.indexOf(suivant);
  // le trajet : un temps d'arrêt, la route (accélération puis freinage), l'arrivée
  const t = borne((page / DUREE_CARTE - 0.08) / 0.82, 0, 1);
  const pos = i + (j - i) * t * t * (3 - 2 * t);
  const etats = arc.niveaux.map((_, k): EtatEtape => (k <= i ? 'faite' : k === j ? 'cible' : 'ouverte'));
  const def = suivant === null ? null : NIVEAUX[suivant];
  ctx.fillStyle = '#2f86d8';
  ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
  dessineCarte(
    ctx,
    largeur,
    HAUTEUR_VUE,
    arc,
    pos,
    etats,
    def ? `En route : ${def.titre}` : arc.titre,
    tick,
    t > 0 && t < 1 ? Math.sign(j - i) : 0,
  );
}
