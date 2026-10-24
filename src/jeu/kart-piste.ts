/**
 * La piste du karting de la Sarré (le Grand Prix de la Sarré, un mini-jeu) : une courbe fermée (Catmull-Rom par des points de
 * passage), échantillonnée à pas réguliers. Tout est en pixels du monde ; la simulation s'en sert (la surface sous une voiture, sa
 * progression sur le tour), le rendu aussi (il la peint). Rien ne touche au DOM.
 */

/** Les points de passage, dans le sens de la course. */
const POINTS: readonly (readonly [number, number])[] = [
  [140, 210],
  [330, 110],
  [640, 100],
  [890, 160],
  [950, 340],
  [820, 450],
  [610, 400],
  [470, 480],
  [570, 610],
  [830, 650],
  [790, 790],
  [430, 800],
  [190, 720],
  [100, 480],
];
/** La largeur de l'asphalte ; au-delà, les vibreurs, le gravier, puis l'herbe et le mur de pneus. */
export const LARGEUR_PISTE = 58;
export const BORD_VIBREUR = LARGEUR_PISTE / 2 + 4;
export const BORD_GRAVIER = LARGEUR_PISTE / 2 + 13;
/** Le mur de pneus : on ne s'éloigne pas plus du milieu de la piste. */
export const MUR = LARGEUR_PISTE / 2 + 36;
/** La taille du monde (le rendu y peint la piste et son décor). */
export const MONDE_L = 1060;
export const MONDE_H = 920;

const N = 1400;

function catmull(t: number): [number, number] {
  const n = POINTS.length;
  const i = Math.floor(t) % n;
  const u = t - Math.floor(t);
  const p = (k: number) => POINTS[(i + k + n) % n]!;
  const [p0, p1, p2, p3] = [p(-1), p(0), p(1), p(2)];
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}

/** Le tracé : N points le long du milieu de la piste, et la longueur parcourue jusqu'à chacun. */
export const TRACE: readonly (readonly [number, number])[] = Array.from({ length: N }, (_, k) =>
  catmull((k / N) * POINTS.length),
);
const CUMUL: number[] = [0];
for (let k = 1; k <= N; k++) {
  const [x0, y0] = TRACE[k - 1]!;
  const [x1, y1] = TRACE[k % N]!;
  CUMUL.push(CUMUL[k - 1]! + Math.hypot(x1 - x0, y1 - y0));
}
/** La longueur d'un tour (pixels). */
export const LONGUEUR_TOUR = CUMUL[N]!;

/** Un point du tracé à l'indice `i` (modulo N), sa direction, et le point décalé de `decal` vers la droite de la course. */
export function surTrace(i: number, decal = 0): { x: number; y: number; a: number } {
  const k = ((Math.round(i) % N) + N) % N;
  const [x0, y0] = TRACE[k]!;
  const [x1, y1] = TRACE[(k + 4) % N]!;
  const a = Math.atan2(y1 - y0, x1 - x0);
  return { x: x0 - Math.sin(a) * decal, y: y0 + Math.cos(a) * decal, a };
}

/** Le même, à une fraction `f` du tour. */
export const surPiste = (f: number, decal = 0) => surTrace(f * N, decal);

/**
 * Où en est un point par rapport à la piste : l'indice du tracé le plus proche (cherché autour de `pres`, la dernière position
 * connue : une voiture n'avance pas de plus de quelques points par pas), la distance au milieu (signée : positive à droite).
 */
export function projette(x: number, y: number, pres: number): { i: number; d: number } {
  let meilleur = pres;
  let dist = Infinity;
  for (let k = -40; k <= 40; k++) {
    const i = (((pres + k) % N) + N) % N;
    const [px, py] = TRACE[i]!;
    const d = (px - x) ** 2 + (py - y) ** 2;
    if (d < dist) {
      dist = d;
      meilleur = i;
    }
  }
  const t = surTrace(meilleur);
  const signe = -Math.sin(t.a) * (x - t.x) + Math.cos(t.a) * (y - t.y) >= 0 ? 1 : -1;
  return { i: meilleur, d: Math.sqrt(dist) * signe };
}

/** La même recherche sur tout le tracé (au départ, ou après une téléportation). */
export function projetteLoin(x: number, y: number): { i: number; d: number } {
  let meilleur = 0;
  let dist = Infinity;
  for (let i = 0; i < N; i += 4) {
    const [px, py] = TRACE[i]!;
    const d = (px - x) ** 2 + (py - y) ** 2;
    if (d < dist) {
      dist = d;
      meilleur = i;
    }
  }
  return projette(x, y, meilleur);
}

/** La distance parcourue sur le tour, à l'indice `i`. */
export const distanceA = (i: number): number => CUMUL[((i % N) + N) % N]!;
export const POINTS_TRACE = N;

/** La courbure du tracé autour de l'indice `i` (l'angle dont il tourne sur `portee` points, en radians, signé). */
export function virage(i: number, portee = 60): number {
  const a = surTrace(i).a;
  const b = surTrace(i + portee).a;
  return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}

/** La ligne de départ, et les caisses de bonus (fraction du tour, décalage sur la largeur). */
export const DEPART = 0.02;
export const CAISSES: readonly (readonly [number, number])[] = [0.09, 0.31, 0.56, 0.8].flatMap((f) =>
  [-16, 0, 16].map((d) => [f, d] as const),
);

/** La place `k` sur la grille de départ : deux par rang, en quinconce, derrière la ligne. */
export function grille(k: number, origine = DEPART * N): { x: number; y: number; a: number; i: number } {
  const i = origine - 14 - Math.floor(k / 2) * 22 - (k % 2) * 8;
  return { ...surTrace(i, k % 2 ? 12 : -12), i: ((Math.round(i) % N) + N) % N };
}
