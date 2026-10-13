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

/** Dessine la carte : `niveau` est celui qu'on vient de finir, `page` les ticks du trajet vers le suivant. */
export function dessineCarteMonde(
  ctx: CanvasRenderingContext2D,
  largeur: number,
  niveau: number,
  page: number,
  tick: number,
): void {
  const arc = arcDe(niveau);
  const pl = plan(arc);
  const i = arc.niveaux.indexOf(niveau);
  const suivant = suivantDansArc(niveau);
  const j = suivant === null ? i : arc.niveaux.indexOf(suivant);
  // le trajet : un temps d'arrêt, la route (accélération puis freinage), l'arrivée
  const t = borne((page / DUREE_CARTE - 0.12) / 0.7, 0, 1);
  const d = pl.etapes[i]! + (pl.etapes[j]! - pl.etapes[i]!) * t * t * (3 - 2 * t);
  const [vx, vy] = surRoute(pl.route, d);
  const vanX = vx * C + C / 2;
  const vanY = vy * C + C / 2;
  // la caméra suit le van, sans sortir de la carte
  const camX = Math.round(borne(vanX - largeur / 2, 0, Math.max(0, LT * C - largeur)));
  const camY = Math.round(borne(vanY - HAUTEUR_VUE / 2, 0, Math.max(0, HT * C - HAUTEUR_VUE)));
  ctx.fillStyle = '#2f86d8';
  ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
  const p: Px = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  // la mer qui scintille, puis l'île
  for (let gy = Math.floor(camY / C); gy <= (camY + HAUTEUR_VUE) / C; gy++)
    for (let gx = Math.floor(camX / C); gx <= (camX + largeur) / C; gx++)
      mer(p, gx * C - camX, gy * C - camY, tick, gx, gy);
  ctx.drawImage(pl.fond, -camX, -camY);
  // les étapes : faites (or, coche), la prochaine (clignote), les autres (cartes numérotées)
  pl.etapes.forEach((e, k) => {
    const [ex, ey] = surRoute(pl.route, e);
    const x = ex * C + C / 2 - camX;
    const y = ey * C + C / 2 - camY;
    const faite = k <= i;
    const cible = k === j && Math.floor(tick / 15) % 2 === 0;
    p(x - 6, y - 6, 12, 12, '#1a0f0a');
    p(x - 5, y - 5, 10, 10, faite ? '#e0701f' : cible ? '#ff4fd8' : '#2a3a8a');
    p(x - 5, y - 5, 10, 2, faite ? '#ffd23f' : cible ? '#ffa8ec' : '#4a5ab0');
    ecrit(ctx, String(k + 1), x - 1, y - 2, '#ffffff');
  });
  // le van, sa poussière
  const roule = t > 0 && t < 1;
  if (roule)
    for (let k = 1; k <= 4; k++) {
      ctx.globalAlpha = 0.6 - k * 0.12;
      p(vanX - camX - 10 - k * 3, vanY - camY - 1 + ((tick + k) % 3) - 1, 2, 2, '#e9e2d0');
    }
  ctx.globalAlpha = 1;
  const img = imageDe(G.VAN);
  const saut = roule && Math.floor(tick / 4) % 2 ? -1 : 0;
  if (img) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      Math.round(vanX - camX - 10),
      Math.round(vanY - camY - 13 + saut),
      20,
      12,
    );
    ctx.imageSmoothingEnabled = false;
  }
  // le bandeau du haut
  p(0, 0, largeur, 11, 'rgba(10,5,12,0.75)');
  const def = suivant === null ? null : NIVEAUX[suivant];
  ecritCentre(ctx, def ? `En route : ${def.titre}` : arc.titre, largeur / 2, 3, '#ffd23f');
}
