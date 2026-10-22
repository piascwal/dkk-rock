import { MAX_JOUEURS, TICKS_PAR_SECONDE } from '../config';
import { C, EtatCommandes } from './commandes';
import {
  boutsArc,
  LONGUEUR,
  LUNE_R,
  LUNE_X,
  LUNE_Y,
  parcours,
  PLAFOND,
  posEtoile,
  posMeteore,
  ROCHER_ARC,
  SOL,
  vitesse,
  type Parcours,
} from './reve-parcours';
import { PILES_RECENTES, type EtapeReve, type VueReve } from './vue-reve';

/** Le rêve de JBT, le niveau du mini-jeu (indice dans NIVEAUX) : entre la Ville Autotunée et le Club Infini. */
export const NIVEAU_REVE = 14;

const SECONDE = TICKS_PAR_SECONDE;
const DT = 1 / SECONDE;
export const DUREE_DECOLLAGE = Math.round(1.6 * SECONDE);
export const DUREE_REVEIL = Math.round(2.6 * SECONDE);
export const DUREE_LUNE = 3 * SECONDE;
export const DUREE_RESULTAT = 6 * SECONDE;
const ATTENTE_APPUI = SECONDE;
/** Le vol : la poussée quand on tient le bouton, la pesanteur sinon, la vitesse verticale la plus grande. */
const POUSSEE = 640;
const PESANTEUR = 540;
const VMAX = 200;
export const VIES = 3;
const INVULNERABLE = Math.round(1.4 * SECONDE);
/** Le bonus pour avoir atteint la lune, et ce que vaut une pile en or. */
export const BONUS_LUNE = 100;
const OR = 10;
/** La hauteur de JBT, de son centre à ses bords : il ne sort jamais du ciel. */
const DEMI_HAUTEUR = 8;
/** JBT se plante dans la lune quand son centre est là : la tête et les épaules dedans, le reste dehors. */
export const PLANTE_X = LUNE_X - LUNE_R - 10;
/** JBT, allongé, la tête à droite : trois cercles (devant, milieu, derrière : dx, dy, rayon) suffisent à le toucher. */
const CORPS: readonly (readonly [number, number, number])[] = [
  [13, 0, 5],
  [1, 0, 6],
  [-13, 1, 5],
];

const VALIDE = C.SAUT | C.TIR;
const VOLE = VALIDE | C.HAUT;

/** La distance d'un point (px, py) au segment [(x1, y1), (x2, y2)]. */
function auSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
}

/**
 * Le rêve de JBT (un mini-jeu façon Jetpack Joyride) : JBT, en super-héros, traverse le ciel de nuit à toute vitesse pour
 * retrouver la pleine lune qu'il a perdue de vue. On tient le bouton pour monter, on lâche pour descendre ; on ramasse les
 * piles alcalines, on évite les arcs électriques, les météorites et les étoiles filantes. Trois chocs et JBT se réveille en
 * sursaut ; au bout du ciel, il plante sa tête dans la lune. Chaque joueur vole à son tour ; les piles (et la lune) font le score.
 */
export class ConcoursReve {
  etape: EtapeReve = 'decollage';
  tours: number[];
  tour = 0;
  manche = 0;
  minuteur = 0;
  distance = 0;
  y = (PLAFOND + SOL) / 2;
  vy = 0;
  pousse = false;
  plante = false;
  vies = VIES;
  invulnerable = 0;
  piles = 0;
  collectees: number[] = [];
  score = 0;
  scores: (number | null)[] = Array(MAX_JOUEURS).fill(null);
  fini = false;
  private prises = new Set<number>();
  private prochaine = 0;
  private alea: Parcours = parcours(0);
  private readonly commandes = Array.from({ length: MAX_JOUEURS }, () => new EtatCommandes());

  constructor(
    sieges: readonly number[],
    readonly miniJeu: boolean,
  ) {
    this.tours = sieges.length ? [...sieges] : [0];
    this.nouveauVol();
  }

  get siege(): number {
    return this.tours[this.tour]!;
  }

  /** Le parcours de ce vol. */
  get ciel(): Parcours {
    return this.alea;
  }

  maj(bits: ArrayLike<number>, presents: readonly number[], son: (nom: string) => void): void {
    for (let s = 0; s < MAX_JOUEURS; s++) this.commandes[s]!.avance(bits[s] ?? 0);
    if (this.etape !== 'podium' && !presents.includes(this.siege)) {
      this.tourSuivant(presents);
      return;
    }
    const k = this.commandes[this.siege]!;
    if (this.minuteur > 0) this.minuteur--;
    switch (this.etape) {
      case 'decollage':
        if (this.minuteur === 0 || k.appuye(VALIDE)) this.etape = 'vol';
        break;
      case 'vol':
        this.vol(k, son);
        break;
      case 'lune':
        this.lune(son);
        break;
      case 'reveil':
        // il tombe de son lit, et du ciel
        this.vy = Math.min(VMAX, this.vy + PESANTEUR * DT);
        this.y = Math.min(SOL + 40, this.y + this.vy * DT);
        if (this.minuteur === 0) this.termine(false);
        break;
      case 'resultat':
        if (this.minuteur === 0 || (this.minuteur < DUREE_RESULTAT - ATTENTE_APPUI && k.appuye(VALIDE)))
          this.tourSuivant(presents);
        break;
      case 'podium':
        if (this.minuteur === 0 && presents.some((s) => this.commandes[s]!.appuye(VALIDE))) {
          if (this.miniJeu) this.recommence(presents);
          else this.fini = true;
        }
        break;
    }
  }

  /** Un pas de vol : monter ou descendre, avancer, ramasser les piles, se cogner. */
  private vol(k: EtatCommandes, son: (nom: string) => void): void {
    this.pousse = k.tenu(VOLE);
    this.vy = Math.max(-VMAX, Math.min(VMAX, this.vy + (this.pousse ? -POUSSEE : PESANTEUR) * DT));
    this.y += this.vy * DT;
    if (this.y < PLAFOND + DEMI_HAUTEUR || this.y > SOL - DEMI_HAUTEUR) {
      this.y = Math.max(PLAFOND + DEMI_HAUTEUR, Math.min(SOL - DEMI_HAUTEUR, this.y));
      this.vy = 0;
    }
    const avant = this.distance;
    this.distance += vitesse(this.distance) * DT;
    // une étoile filante part : on l'entend siffler
    if (this.alea.etoiles.some((e) => e.x > avant && e.x <= this.distance)) son('fuse');
    if (this.invulnerable > 0) this.invulnerable--;
    this.ramasse(son);
    if (this.invulnerable === 0 && this.heurte()) {
      this.vies--;
      this.invulnerable = INVULNERABLE;
      this.vy = -this.vy * 0.4;
      son('zap');
      if (this.vies <= 0) {
        this.etape = 'reveil';
        this.minuteur = DUREE_REVEIL;
        this.pousse = false;
        son('reveil');
        return;
      }
    }
    if (this.distance >= LONGUEUR) {
      this.etape = 'lune';
      this.pousse = false;
    }
  }

  /** JBT touche-t-il le cercle (cx, cy, r) ? */
  private touche(cx: number, cy: number, r: number): boolean {
    return CORPS.some(([dx, dy, rr]) => Math.hypot(this.distance + dx - cx, this.y + dy - cy) < r + rr);
  }

  private ramasse(son: (nom: string) => void): void {
    const piles = this.alea.piles;
    while (this.prochaine < piles.length && piles[this.prochaine]!.x < this.distance - 30) this.prochaine++;
    for (let i = this.prochaine; i < piles.length && piles[i]!.x < this.distance + 30; i++) {
      const p = piles[i]!;
      if (this.prises.has(i) || !this.touche(p.x, p.y, 5)) continue;
      this.prises.add(i);
      this.collectees.push(i);
      if (this.collectees.length > PILES_RECENTES) this.collectees.shift();
      this.piles += p.or ? OR : 1;
      son(p.or ? 'ramasse' : 'tintement');
    }
  }

  /** Un arc électrique, une météorite ou une étoile filante touche-t-il JBT ? */
  private heurte(): boolean {
    const d = this.distance;
    for (const a of this.alea.arcs) {
      if (Math.abs(a.x - d) > a.longueur / 2 + 30) continue;
      const [x1, y1, x2, y2] = boutsArc(a, d);
      if (this.touche(x1, y1, ROCHER_ARC) || this.touche(x2, y2, ROCHER_ARC)) return true;
      if (CORPS.some(([dx, dy, rr]) => auSegment(d + dx, this.y + dy, x1, y1, x2, y2) < rr + 2)) return true;
    }
    for (const m of this.alea.meteores) {
      const p = posMeteore(m, d);
      if (Math.abs(p.x - d) < 40 && this.touche(p.x, p.y, m.rayon - 2)) return true;
    }
    for (const e of this.alea.etoiles) {
      const p = posEtoile(e, d);
      if (p && Math.abs(p.x - d) < 30 && this.touche(p.x, p.y, 4)) return true;
    }
    return false;
  }

  /** Au bout du ciel : JBT file droit sur la lune et y plante sa tête ; le temps de reprendre ses esprits, le score. */
  private lune(son: (nom: string) => void): void {
    if (this.plante) {
      if (this.minuteur === 0) this.termine(true);
      return;
    }
    this.y += (LUNE_Y + 6 - this.y) * 0.06;
    this.distance = Math.min(PLANTE_X, this.distance + 150 * DT);
    if (this.distance >= PLANTE_X) {
      this.plante = true;
      this.minuteur = DUREE_LUNE;
      son('boum');
    }
  }

  /** Le vol est fini : la lune (avec son bonus) ou le réveil ; le meilleur score du joueur. */
  private termine(lune: boolean): void {
    this.score = this.piles + (lune ? BONUS_LUNE : 0);
    const avant = this.scores[this.siege];
    if (avant === null || avant === undefined || this.score > avant) this.scores[this.siege] = this.score;
    this.etape = 'resultat';
    this.minuteur = DUREE_RESULTAT;
  }

  /** Un vol neuf : le joueur suivant s'endort ; le ciel change (les obstacles, les piles). */
  private nouveauVol(): void {
    this.manche = (this.manche + 1) % 256;
    this.alea = parcours(this.manche);
    this.etape = 'decollage';
    this.minuteur = DUREE_DECOLLAGE;
    this.distance = 0;
    this.y = (PLAFOND + SOL) / 2;
    this.vy = 0;
    this.pousse = false;
    this.plante = false;
    this.vies = VIES;
    this.invulnerable = 0;
    this.piles = 0;
    this.collectees = [];
    this.score = 0;
    this.prises = new Set();
    this.prochaine = 0;
  }

  private tourSuivant(presents: readonly number[]): void {
    do this.tour++;
    while (this.tour < this.tours.length && !presents.includes(this.siege));
    if (this.tour < this.tours.length) return this.nouveauVol();
    this.tour = Math.max(0, this.tours.length - 1);
    this.etape = 'podium';
    this.minuteur = ATTENTE_APPUI;
  }

  private recommence(presents: readonly number[]): void {
    this.tours = presents.length ? [...presents] : [0];
    this.tour = 0;
    this.scores = Array(MAX_JOUEURS).fill(null);
    this.nouveauVol();
  }

  vue(): VueReve {
    return {
      etape: this.etape,
      siege: this.siege,
      manche: this.manche,
      miniJeu: this.miniJeu,
      minuteur: this.minuteur,
      distance: this.distance,
      y: this.y,
      vy: this.vy,
      pousse: this.pousse,
      plante: this.plante,
      vies: this.vies,
      invulnerable: this.invulnerable,
      piles: this.piles,
      collectees: [...this.collectees],
      score: this.score,
      scores: [...this.scores],
    };
  }
}
