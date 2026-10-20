/**
 * Le pré du Clos, vu de dessus : une grille de cases de 50 cm. Chaque case de pelouse a son état : 0 intacte, 1 herbe arrachée,
 * 2 terre, 3 boue. Les roues qui glissent la griffent ; le score est la part du pré qui n'est plus de la pelouse.
 *
 * Le rendu refait la même pelouse de son côté, à partir des positions de la voiture qu'il reçoit (voir rendu/drift.ts) : les deux
 * passent par `marqueVoiture`, ce qui garde le dessin et le pourcentage d'accord.
 */

/** Le pré, en mètres : sa largeur (x) et sa profondeur (y). */
export const PRE = { largeur: 56, profondeur: 40 };
/** La taille d'une case, en mètres. */
export const CASE = 0.5;
/** Le rayon de la trace d'une roue, en mètres. */
const RAYON_ROUE = 0.5;

/** Une position de la voiture : son centre (m) et son cap (radians, 0 vers +x). */
export interface Pose {
  x: number;
  y: number;
  cap: number;
}

export class Pelouse {
  readonly colonnes = Math.round(PRE.largeur / CASE);
  readonly rangees = Math.round(PRE.profondeur / CASE);
  readonly cases = new Uint8Array(this.colonnes * this.rangees);
  /** les cases qui ne sont plus de la pelouse */
  abimees = 0;

  /** L'état de la case sous (x, y), ou -1 hors du pré. */
  etat(x: number, y: number): number {
    const c = Math.floor(x / CASE);
    const r = Math.floor(y / CASE);
    if (c < 0 || r < 0 || c >= this.colonnes || r >= this.rangees) return -1;
    return this.cases[r * this.colonnes + c]!;
  }

  /** La part du pré saccagée, de 0 à 100. */
  get pourcent(): number {
    return (this.abimees / this.cases.length) * 100;
  }

  /** Griffe les cases d'un disque : chacune passe au moins à l'état `niveau` (une trace ne répare jamais). */
  griffe(x: number, y: number, niveau: number, rayon = RAYON_ROUE): void {
    const c0 = Math.max(0, Math.floor((x - rayon) / CASE));
    const c1 = Math.min(this.colonnes - 1, Math.floor((x + rayon) / CASE));
    const r0 = Math.max(0, Math.floor((y - rayon) / CASE));
    const r1 = Math.min(this.rangees - 1, Math.floor((y + rayon) / CASE));
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) {
        const dx = (c + 0.5) * CASE - x;
        const dy = (r + 0.5) * CASE - y;
        if (dx * dx + dy * dy > rayon * rayon) continue;
        const i = r * this.colonnes + c;
        const avant = this.cases[i]!;
        if (avant >= niveau) continue;
        if (avant === 0) this.abimees++;
        this.cases[i] = niveau;
      }
  }

  /** Une trace d'un point à l'autre : un disque tous les quarts de mètre. */
  trace(x0: number, y0: number, x1: number, y1: number, niveau: number): void {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.25));
    for (let k = 1; k <= n; k++) this.griffe(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, niveau);
  }
}

/** Les quatre roues d'une pose : arrière gauche, arrière droite, avant gauche, avant droite. */
export function roues(p: Pose): [number, number][] {
  const fx = Math.cos(p.cap);
  const fy = Math.sin(p.cap);
  // la gauche de la voiture : le cap tourné d'un quart de tour dans le sens direct
  const gx = -fy;
  const gy = fx;
  const pos = (avant: number, cote: number): [number, number] => [
    p.x + fx * avant + gx * cote,
    p.y + fy * avant + gy * cote,
  ];
  return [pos(-1.25, 0.72), pos(-1.25, -0.72), pos(1.2, 0.72), pos(1.2, -0.72)];
}

/**
 * Les traces de la voiture entre deux poses : les roues arrière dès qu'elles griffent (`griffe` > 0), les quatre roues quand la
 * voiture glisse franchement (`griffe` ≥ 2 : elle part en travers, les roues avant labourent aussi).
 */
export function marqueVoiture(pelouse: Pelouse, avant: Pose, apres: Pose, griffe: number): void {
  if (griffe <= 0) return;
  const a = roues(avant);
  const b = roues(apres);
  const n = griffe >= 2 ? 4 : 2;
  for (let i = 0; i < n; i++) pelouse.trace(a[i]![0], a[i]![1], b[i]![0], b[i]![1], griffe);
}
