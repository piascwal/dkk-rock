import { TICKS_PAR_SECONDE } from '../config';
import {
  BORD_GRAVIER,
  BORD_VIBREUR,
  LONGUEUR_TOUR,
  MUR,
  POINTS_TRACE,
  distanceA,
  projette,
  surTrace,
} from './kart-piste';

/**
 * Une voiture du Grand Prix de la Sarré, vue de dessus : un cap, une vitesse en deux composantes (vers l'avant, et de côté : la
 * glisse, que la tenue de route amortit plus ou moins vite), la surface sous les roues (l'asphalte, les vibreurs, le gravier,
 * l'herbe), le mur de pneus. Et ce que les bonus lui font : le turbo, l'écrasement par le marteau, la glissade sur l'huile, le saut
 * du ressort, le bouclier.
 */

const DT = 1 / TICKS_PAR_SECONDE;

/** Les cinq pilotes, dans l'ordre des héros (JBT, JBM, JBG, Mat, Tom) : leur voiture, et ses notes (vitesse, tenue, poids). */
export const PILOTES = ['JBT', 'JBM', 'JBG', 'MAT', 'TOM'] as const;
export const VOITURES = ['CLIO', 'XANTIA', 'MÉGANE', 'CORSA', 'RENAULT 11'] as const;
export const NOTES: readonly (readonly [number, number, number])[] = [
  [3, 4, 3],
  [4, 3, 3],
  [3, 3, 4],
  [3, 5, 2],
  [5, 2, 4],
];

/** Les bonus, dans leur caisse « ? » : on en garde un, et on le lance (TIR). */
export const BONUS_KART = ['turbo', 'huile', 'marteau', 'bouclier', 'ressort'] as const;
export type BonusKart = (typeof BONUS_KART)[number];
const SECONDE = TICKS_PAR_SECONDE;
export const DUREES_KART = {
  turbo: Math.round(1.6 * SECONDE),
  ecrase: Math.round(1.1 * SECONDE),
  glisse: Math.round(0.8 * SECONDE),
  saut: Math.round(0.8 * SECONDE),
  bouclier: 6 * SECONDE,
};
/** Le rayon d'une voiture, pour les chocs entre elles. */
export const RAYON = 9;

export interface CommandesKart {
  gauche: boolean;
  droite: boolean;
  gaz: boolean;
  frein: boolean;
}

export class VoitureKart {
  x = 0;
  y = 0;
  a = 0;
  vx = 0;
  vy = 0;
  /** l'indice du tracé le plus proche, la distance au milieu de la piste */
  i = 0;
  d = 0;
  /** la distance courue depuis la ligne (négative sur la grille) : le tour, la place s'en déduisent */
  avance = 0;
  bonus = -1;
  turbo = 0;
  ecrase = 0;
  glisse = 0;
  saut = 0;
  bouclier = 0;
  /** le tick où il a passé la ligne pour la dernière fois (-1 : pas encore) ; éliminé de la manche (à plusieurs) */
  arrivee = -1;
  elimine = false;
  /** un coup reçu, à faire sonner par le concours (et à oublier) */
  choc = false;

  constructor(readonly pilote: number) {}

  get vitesseMax(): number {
    return 150 + 15 * NOTES[this.pilote]![0];
  }

  get tenue(): number {
    return 4 + 1.6 * NOTES[this.pilote]![1];
  }

  get poids(): number {
    return NOTES[this.pilote]![2];
  }

  get vitesse(): number {
    return Math.hypot(this.vx, this.vy);
  }

  /** Pose la voiture (la grille, ou le regroupement d'une manche) : immobile, cap donné, la distance courue au point du tracé. */
  pose(x: number, y: number, a: number, i: number, avance: number): void {
    Object.assign(this, { x, y, a, i, avance, vx: 0, vy: 0, ecrase: 0, glisse: 0, saut: 0, turbo: 0 });
    this.d = projette(x, y, i).d;
  }

  /** Un pas de conduite. `vmax` : un coup de pouce (le retard des pilotes de l'ordinateur), 1 d'ordinaire. */
  avanceUnPas(k: CommandesKart, coupDePouce = 1): void {
    const ca = Math.cos(this.a);
    const sa = Math.sin(this.a);
    let av = this.vx * ca + this.vy * sa; // vers l'avant
    let cote = -this.vx * sa + this.vy * ca; // de côté : la glisse
    const libre = this.ecrase === 0 && this.glisse === 0;
    const surface = this.saut > 0 ? 0 : Math.abs(this.d);
    const freinSol = surface > BORD_GRAVIER ? 2.4 : surface > BORD_VIBREUR ? 1.5 : 0;
    const vmax =
      this.vitesseMax *
      coupDePouce *
      (this.turbo > 0 ? 1.45 : 1) *
      (freinSol > 2 ? 0.45 : freinSol > 1 ? 0.6 : 1);
    const accel = (this.turbo > 0 ? 320 : 200 - 10 * this.poids) * (freinSol ? 0.7 : 1);
    if (libre && k.gaz) av = Math.min(Math.max(av, 0) + accel * DT, Math.max(av, vmax));
    else if (libre && k.frein) av = Math.max(av - 320 * DT, -60);
    av -= av * (0.7 + freinSol) * DT;
    if (av > vmax) av -= (av - vmax) * 3 * DT;
    // tourner : d'autant plus vite qu'on roule (pas sur place), à l'envers en marche arrière
    if (libre) {
      const sens = (k.droite ? 1 : 0) - (k.gauche ? 1 : 0);
      this.a += sens * 3.1 * DT * Math.min(1, Math.abs(av) / 70) * Math.sign(av || 1);
    }
    if (this.glisse > 0) this.a += 9 * DT; // la voiture tourne sur elle-même, dans l'huile
    if (this.ecrase > 0) av *= 0.9;
    cote *= Math.exp(-(freinSol > 2 ? this.tenue * 0.5 : this.tenue) * DT);
    const na = Math.cos(this.a);
    const nb = Math.sin(this.a);
    this.vx = av * na - cote * nb;
    this.vy = av * nb + cote * na;
    this.x += this.vx * DT;
    this.y += this.vy * DT;
    for (const n of ['turbo', 'ecrase', 'glisse', 'saut', 'bouclier'] as const) if (this[n] > 0) this[n]--;
    this.suitLaPiste();
  }

  /** Où il en est sur la piste : la distance courue (d'un point du tracé au suivant), et le mur de pneus, qui le renvoie. */
  private suitLaPiste(): void {
    const p = projette(this.x, this.y, this.i);
    let pas = p.i - this.i;
    if (pas > POINTS_TRACE / 2) pas -= POINTS_TRACE;
    if (pas < -POINTS_TRACE / 2) pas += POINTS_TRACE;
    let metres = distanceA(p.i) - distanceA(this.i);
    if (pas > 0 && metres < 0) metres += LONGUEUR_TOUR;
    if (pas < 0 && metres > 0) metres -= LONGUEUR_TOUR;
    this.avance += metres;
    this.i = p.i;
    this.d = p.d;
    if (Math.abs(p.d) > MUR) {
      // le mur de pneus : on est remis contre lui, et on rebondit en perdant de la vitesse
      const t = surTrace(p.i, Math.sign(p.d) * MUR);
      this.x = t.x;
      this.y = t.y;
      const nx = -Math.sin(t.a) * Math.sign(p.d);
      const ny = Math.cos(t.a) * Math.sign(p.d);
      const vn = this.vx * nx + this.vy * ny;
      if (vn > 0) {
        this.vx -= 1.6 * vn * nx;
        this.vy -= 1.6 * vn * ny;
        this.vx *= 0.6;
        this.vy *= 0.6;
        if (vn > 60) this.choc = true;
      }
      this.d = Math.sign(p.d) * MUR;
    }
  }

  /** Le marteau, l'huile : sans effet sous le bouclier, ni en l'air (le saut du ressort). */
  subit(effet: 'ecrase' | 'glisse'): boolean {
    if (this.bouclier > 0 || this.saut > 0) return false;
    this[effet] = DUREES_KART[effet];
    this.choc = true;
    return true;
  }
}

/** Deux voitures qui se touchent : chacune est repoussée selon son poids, et elles échangent un peu de leur vitesse. */
export function heurte(a: VoitureKart, b: VoitureKart): boolean {
  if (a.saut > 0 || b.saut > 0 || a.elimine || b.elimine) return false;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d >= 2 * RAYON || d === 0) return false;
  const nx = dx / d;
  const ny = dy / d;
  const recouvre = 2 * RAYON - d;
  const ka = b.poids / (a.poids + b.poids);
  a.x -= nx * recouvre * ka;
  a.y -= ny * recouvre * ka;
  b.x += nx * recouvre * (1 - ka);
  b.y += ny * recouvre * (1 - ka);
  const vr = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (vr < 0) {
    a.vx += vr * nx * ka;
    a.vy += vr * ny * ka;
    b.vx -= vr * nx * (1 - ka);
    b.vy -= vr * ny * (1 - ka);
  }
  return -vr > 50;
}
