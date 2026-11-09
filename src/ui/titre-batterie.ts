import { BPM } from '../config';
import { dessineDecorFeuille } from '../rendu/feuilles-images';
import { FEUILLES_DECOR } from '../rendu/feuilles-objets';
import { saute, type Acteur, type Scene } from './titre-physique';

/**
 * La batterie de l'écran titre en scène (voir titre-scene.ts) : un décor posé sur la scène, dans le plus grand espace libre entre
 * le logo, les boutons et les enceintes (on ne monte pas dessus). De temps en temps, JBT y va : il disparaît derrière (le héros
 * n'est plus sur la scène), joue tranquille au tempo (des notes s'envolent, les cymbales scintillent), s'emballe, puis pète un
 * câble : la grosse caisse se fend, crève, il la soulève, arrache le charleston et le lance ; éclats et baguettes volent. Un nuage
 * de fumée, la batterie est comme neuve, et JBT en ressort d'un bond. Les images : public/sprites/batterie.png
 * (outils/prepare-batterie.py), une par ligne.
 */

/** La planche : une image de 256 × 247 par ligne ; JBT debout y mesure 220 pixels (il y a la taille d'un héros). */
const [LARGEUR, HAUTEUR, DEBOUT] = [256, 247, 220];
/** Un peu plus grande qu'un héros (c'est le décor de la scène), sur une estrade de batteur : elle dépasse du public. */
const GRANDEUR = 1.2;
const ESTRADE = 0.3;
const VIDE = 0;
const BATTEMENT = 60 / BPM;

/** Le spectacle : chaque étape jusqu'à quand (s), ses images (une par temps) ; `casse` : les éclats volent. */
const ETAPES: { fin: number; images: number[]; secoue?: boolean; casse?: string[] }[] = [
  { fin: 7.7, images: [1, 2, 1, 3] }, // il joue, tranquille
  { fin: 10.2, images: [4, 4, 1, 4], secoue: true }, // il s'emballe
  { fin: 11.8, images: [5], secoue: true, casse: ['#e9e3cf', '#cfc6aa', '#3b2a1e'] }, // la grosse caisse se fend
  { fin: 13.4, images: [6], secoue: true, casse: ['#e9e3cf', '#c9a23a', '#5a4330'] }, // elle crève, une cymbale à la main
  { fin: 14.8, images: [7], secoue: true, casse: ['#3b2a1e', '#5a4330', '#d9b36a'] }, // il la soulève
  { fin: 16.6, images: [8], secoue: true, casse: ['#9aa0a6', '#5d6268', '#e8c45a'] }, // il arrache le charleston
];
const FIN = ETAPES[ETAPES.length - 1]!.fin;
/** Les cymbales (pixels de la planche) : elles scintillent sur les temps. */
const CYMBALES = [
  [72, 38],
  [200, 36],
  [30, 75],
  [220, 82],
] as const;
const NOTES = ['#ffd23f', '#ff2e93', '#00c2d1', '#ffffff'];

interface Morceau {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t0: number;
  vie: number;
  couleur: string;
  forme: 'eclat' | 'note' | 'etincelle' | 'fumee' | 'cymbale';
  taille: number;
}

export interface Batterie {
  /** où elle est posée (milieu, en pixels) et son échelle ; `place` : faux s'il n'y a pas la place */
  x: number;
  k: number;
  place: boolean;
  phase: 'attente' | 'approche' | 'spectacle';
  /** le temps avant le prochain spectacle, puis le temps du spectacle (s) */
  attente: number;
  t: number;
  etape: number;
  temps: number;
  morceaux: Morceau[];
}

const hasard = (a: number, b: number) => a + Math.random() * (b - a);

export const nouvelleBatterie = (): Batterie => ({
  x: 0,
  k: 0,
  place: false,
  phase: 'attente',
  attente: hasard(9, 14),
  t: 0,
  etape: -1,
  temps: -1,
  morceaux: [],
});

/** La pose dans le plus grand espace libre au sol (entre les blocs qui touchent sa hauteur), réduite s'il est étroit. */
export function placeBatterie(b: Batterie, s: Scene): void {
  const k = (s.hh * GRANDEUR) / DEBOUT;
  const haut = s.sol - s.hh * ESTRADE - HAUTEUR * k;
  const pris = s.blocs
    .filter((o) => o.y1 > haut && o.y0 < s.sol)
    .map((o) => [o.x0, o.x1] as const)
    .sort((a, c) => a[0] - c[0]);
  let [g, d, debut] = [0, 0, 0];
  for (const [x0, x1] of [...pris, [s.W, s.W] as const]) {
    if (x0 - debut > d - g) [g, d] = [debut, x0];
    debut = Math.max(debut, x1);
  }
  b.k = k * Math.min(1, (d - g) / (LARGEUR * k * 1.04));
  b.place = b.k >= k * 0.6 && !!FEUILLES_DECOR['batterie'];
  b.x = (g + d) / 2;
}

/** Un point de la planche (pixels de l'image) en pixels de l'écran. */
const ecran = (b: Batterie, s: Scene, px: number, py: number) =>
  [b.x + (px - LARGEUR / 2) * b.k, s.sol - s.hh * ESTRADE - (HAUTEUR - py) * b.k] as const;

function lance(b: Batterie, m: Omit<Morceau, 't0'>): void {
  if (b.morceaux.length < 160) b.morceaux.push({ ...m, t0: b.t });
}

function eclats(b: Batterie, s: Scene, couleurs: string[], n: number): void {
  for (let i = 0; i < n; i++) {
    const [x, y] = ecran(b, s, hasard(60, 196), hasard(90, 200));
    const a = hasard(-Math.PI * 0.9, -Math.PI * 0.1);
    const v = s.hh * hasard(2, 5);
    const couleur = couleurs[i % couleurs.length]!;
    lance(b, {
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      vie: 1.4,
      couleur,
      forme: 'eclat',
      taille: hasard(1.5, 3.5),
    });
  }
}

/** Une gerbe d'éclats qui jaillit de (x, y) (les autres casseurs : titre-concert.ts). */
export function gerbe(b: Batterie, s: Scene, x: number, y: number, couleurs: string[], n: number): void {
  for (let i = 0; i < n; i++) {
    const a = hasard(-Math.PI * 0.95, -Math.PI * 0.05);
    const v = s.hh * hasard(1.5, 4);
    const couleur = couleurs[i % couleurs.length]!;
    lance(b, {
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      vie: 1.2,
      couleur,
      forme: 'eclat',
      taille: hasard(1.5, 3),
    });
  }
}

/** Un nuage de fumée sur un rectangle de l'écran. */
export function nuage(
  b: Batterie,
  s: Scene,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  n: number,
): void {
  for (let i = 0; i < n; i++) {
    const [vx, vy] = [hasard(-0.6, 0.6) * s.hh, hasard(-0.7, -0.1) * s.hh];
    const [x, y] = [hasard(x0, x1), hasard(y0, y1)];
    lance(b, {
      x,
      y,
      vx,
      vy,
      vie: hasard(1, 1.6),
      couleur: '#c8c0d0',
      forme: 'fumee',
      taille: s.hh * hasard(0.15, 0.3),
    });
  }
}

function fumee(b: Batterie, s: Scene, n: number): void {
  for (let i = 0; i < n; i++) {
    const [x, y] = ecran(b, s, hasard(30, 226), hasard(60, 230));
    const [vx, vy] = [hasard(-0.6, 0.6) * s.hh, hasard(-0.7, -0.1) * s.hh];
    lance(b, {
      x,
      y,
      vx,
      vy,
      vie: hasard(1, 1.6),
      couleur: '#c8c0d0',
      forme: 'fumee',
      taille: s.hh * hasard(0.15, 0.3),
    });
  }
}

/** Un temps du jeu tranquille : une note s'envole, une cymbale scintille. */
function surLeTemps(b: Batterie, s: Scene, fort: boolean): void {
  const [cx, cy] = CYMBALES[Math.floor(Math.random() * CYMBALES.length)]!;
  const [x, y] = ecran(b, s, cx, cy);
  for (let i = 0; i < (fort ? 7 : 4); i++) {
    const a = (i / (fort ? 7 : 4)) * 2 * Math.PI + Math.random();
    const v = s.hh * hasard(0.8, 1.6);
    const couleur = i % 2 ? '#fff3b0' : '#e8c45a';
    lance(b, {
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      vie: 0.35,
      couleur,
      forme: 'etincelle',
      taille: 1.5,
    });
  }
  const [nx, ny] = ecran(b, s, hasard(80, 176), hasard(10, 40));
  const couleur = NOTES[Math.floor(Math.random() * NOTES.length)]!;
  lance(b, {
    x: nx,
    y: ny,
    vx: hasard(-0.4, 0.4) * s.hh,
    vy: -s.hh * 0.7,
    vie: 1.4,
    couleur,
    forme: 'note',
    taille: 1,
  });
}

/** JBT sur la scène, la batterie : qui y va, le spectacle, la sortie. Avant la chorégraphie (titre-choregraphie.ts). */
export function joueBatterie(b: Batterie, s: Scene, acteurs: Acteur[], dt: number): void {
  b.t += dt;
  const jbt = acteurs.find((a) => a.nom === 'jbt');
  for (const m of b.morceaux) {
    if (m.forme === 'eclat' || m.forme === 'cymbale') m.vy += s.hh * 9 * dt;
    [m.x, m.y] = [m.x + m.vx * dt, m.y + m.vy * dt];
    // les éclats et le charleston rebondissent sur la scène
    if ((m.forme === 'eclat' || m.forme === 'cymbale') && m.y > s.sol && m.vy > 0)
      [m.y, m.vy, m.vx] = [s.sol, -m.vy * 0.35, m.vx * 0.6];
  }
  b.morceaux = b.morceaux.filter((m) => b.t - m.t0 < m.vie && m.x > -50 && m.x < s.W + 50);
  if (!jbt) return;
  if (b.phase === 'attente') {
    b.attente -= dt;
    if (b.attente <= 0 && b.place && jbt.etat === 'sol') {
      // il y va : comme pour changer de côté (titre-choregraphie.ts), par-dessus ce qui le gêne
      [b.phase, jbt.objectif, jbt.tx, jbt.grimpe, jbt.minuteur] = ['approche', b.x, b.x, true, 14];
    }
    return;
  }
  if (b.phase === 'approche') {
    const arrive = jbt.etat === 'sol' && Math.abs(jbt.y - s.sol) < 2 && Math.abs(jbt.x - b.x) < s.hh * 0.5;
    if (arrive && b.place) {
      // il passe derrière : le héros quitte la scène, le batteur apparaît dans un petit nuage
      [jbt.etat, jbt.objectif, jbt.tx, jbt.grimpe] = ['batterie', null, null, false];
      [b.phase, b.t, b.etape, b.temps, b.morceaux] = ['spectacle', 0, -1, -1, []];
      fumee(b, s, 6);
    } else if (jbt.objectif === null && jbt.etat !== 'tenu')
      [b.phase, b.attente] = ['attente', hasard(6, 10)];
    return;
  }
  // le spectacle (les autres : titre-concert.ts)
  const etape = ETAPES.findIndex((e) => b.t < e.fin);
  if (etape !== b.etape && etape >= 0) {
    b.etape = etape;
    const e = ETAPES[etape]!;
    if (e.casse) eclats(b, s, e.casse, 16);
    // il lance le charleston : il part de sa main, en tournoyant
    if (etape === ETAPES.length - 1) {
      const [x, y] = ecran(b, s, 40, 60);
      const vx = (b.x > s.W / 2 ? -1 : 1) * s.hh * 4;
      lance(b, { x, y, vx, vy: -s.hh * 4.5, vie: 3, couleur: '#e8c45a', forme: 'cymbale', taille: 1 });
    }
  }
  const temps = Math.floor(b.t / BATTEMENT);
  if (temps !== b.temps) {
    b.temps = temps;
    const e = ETAPES[Math.max(0, b.etape)]!;
    if (!e.casse) surLeTemps(b, s, !!e.secoue);
    else if (temps % 2 === 0) eclats(b, s, e.casse, 4);
  }
  if (b.t >= FIN || !b.place) {
    // un nuage de fumée : la batterie est comme neuve, et JBT en ressort d'un bond
    fumee(b, s, 18);
    [jbt.x, jbt.y, jbt.etat, jbt.tx, jbt.lance, jbt.minuteur] = [b.x, s.sol, 'sol', null, false, 1.5];
    saute(s, jbt, 1.3, (b.x > s.W / 2 ? -1 : 1) * s.hh * 2);
    [b.phase, b.attente, b.etape] = ['attente', hasard(32, 48), -1];
  }
}

/** La batterie (derrière les héros) : seule, ou JBT qui en joue. */
export function dessineBatterie(ctx: CanvasRenderingContext2D, b: Batterie, s: Scene): void {
  if (!b.place) return;
  const e = b.phase === 'spectacle' && b.etape >= 0 ? ETAPES[b.etape]! : null;
  const image = e ? e.images[Math.max(0, b.temps) % e.images.length]! : VIDE;
  // elle tremble quand il s'emballe
  const secousse = e?.secoue ? s.hh * 0.02 : 0;
  // l'estrade : un plateau sombre, son bord éclairé, une rangée de petites lampes qui battent la mesure
  const [l, h] = [LARGEUR * b.k * 0.92, s.hh * ESTRADE];
  const [x0, y0] = [Math.round(b.x - l / 2), Math.round(s.sol - h)];
  ctx.fillStyle = '#17121c';
  ctx.fillRect(x0, y0, Math.round(l), Math.ceil(h) + 1);
  ctx.fillStyle = '#4a3a58';
  ctx.fillRect(x0, y0, Math.round(l), Math.max(2, Math.round(h * 0.12)));
  const u = Math.max(2, Math.round(s.hh / 40));
  const n = Math.max(3, Math.floor(l / (u * 6)));
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = (i + Math.max(0, b.temps)) % 2 ? '#ffb43a' : '#6a4a20';
    ctx.fillRect(Math.round(x0 + ((i + 0.5) * l) / n - u / 2), Math.round(y0 + h * 0.45), u, u);
  }
  ctx.save();
  ctx.translate(
    Math.round(b.x + hasard(-1, 1) * secousse),
    Math.round(s.sol - s.hh * ESTRADE + hasard(-1, 1) * secousse),
  );
  ctx.scale(b.k, b.k);
  dessineDecorFeuille(ctx, 'batterie', image);
  ctx.restore();
}

/** Les notes, étincelles, éclats, fumée et le charleston lancé (devant les héros). */
export function dessineEffetsBatterie(ctx: CanvasRenderingContext2D, b: Batterie, s: Scene): void {
  const u = Math.max(1, s.hh / 45);
  for (const m of b.morceaux) {
    const age = (b.t - m.t0) / m.vie;
    ctx.globalAlpha = Math.max(0, m.forme === 'fumee' ? 0.55 * (1 - age) : 1 - age * age);
    ctx.fillStyle = m.couleur;
    const [x, y] = [Math.round(m.x), Math.round(m.y)];
    if (m.forme === 'note') {
      // une croche : la tête, la hampe, le crochet
      ctx.fillRect(x, y, 3 * u, 2 * u);
      ctx.fillRect(x + 2 * u, y - 6 * u, u, 7 * u);
      ctx.fillRect(x + 3 * u, y - 6 * u, 2 * u, u);
      ctx.fillRect(x + 4 * u, y - 5 * u, u, 2 * u);
    } else if (m.forme === 'fumee') {
      ctx.beginPath();
      ctx.arc(x, y, m.taille * (0.6 + age * 0.8), 0, Math.PI * 2);
      ctx.fill();
    } else if (m.forme === 'cymbale') {
      // un disque doré qui tournoie (vu de plus en plus de profil), cerclé de sombre
      const r = 22 * b.k;
      const ry = Math.max(0.12, Math.abs(Math.cos(b.t * 9))) * r * 0.45;
      for (const [c, d] of [
        ['#3a2e10', u],
        [m.couleur, 0],
      ] as const) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(x, y, r + d, ry + d, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(x - r * 0.5, y - ry * 0.4, r * 0.4, Math.max(1, ry * 0.25));
    } else ctx.fillRect(x, y, m.taille * u, m.taille * u);
  }
  ctx.globalAlpha = 1;
}
