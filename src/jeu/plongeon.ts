import { MAX_JOUEURS, TICKS_PAR_SECONDE } from '../config';
import { Aleatoire } from '../moteur/maths';
import { C, EtatCommandes } from './commandes';
import type { EtapePlongeon, VuePlongeon } from './vue';

/** Le saut du pont des Tuves, le niveau du concours de plongeon (indice dans NIVEAUX) : juste après le pont, avant les Alpes. */
export const NIVEAU_PLONGEON = 13;

const SECONDE = TICKS_PAR_SECONDE;
const DT = 1 / SECONDE;
/** La hauteur du pont au-dessus de l'eau (m) : exagérée, c'est un souvenir de jeunesse. */
export const HAUTEUR_PONT = 60;
/** La durée de la chute, de l'impact (l'éclaboussure, ou la poussière) et de l'écran du score. */
export const DUREE_CHUTE = Math.round(3.4 * SECONDE);
export const DUREE_IMPACT = 2 * SECONDE;
const DUREE_RESULTAT = 5 * SECONDE;
const ATTENTE_APPUI = SECONDE;
/** La rivière, vue du pont : l'eau va de -EAU à +EAU (m), les berges au-delà ; le trou d'eau fait 2 × PROFOND de large. */
export const EAU = 12;
export const PROFOND = 3;
/** Le curseur de visée balaie de -VISEE à +VISEE (jusque sur les berges), en PERIODE_VISEE ticks pour un aller-retour. */
export const VISEE = 15;
const PERIODE_VISEE = Math.round(2.2 * SECONDE);
/** Le joueur se dirige en l'air (m/s²) ; le vent pousse plus fort que lui, le temps d'une rafale. */
const CONTROLE = 5;
const RAFALE = 7;
const DUREE_RAFALE = 0.8;
/** L'hirondelle qui traverse : à quelle distance elle bouscule le plongeur (m), et de combien (m/s). */
const PORTEE_OISEAU = 2.2;
const BOUSCULADE = 5;
/** Tendre les bras à moins de cette durée de l'eau : une entrée parfaite. */
const ENTREE_PARFAITE = 0.6 * SECONDE;

const VALIDE = C.SAUT | C.TIR;

/** Où l'on tombe : 1 dans le trou d'eau, 2 dans l'eau peu profonde, 3 sur la berge (0 : pas encore). */
export const ZONE = { PROFOND: 1, BAS: 2, BERGE: 3 } as const;
/** Comment on entre : 1 bras tendus au dernier moment, 2 bras tendus trop tôt, 3 à plat (0 : pas encore). */
export const ENTREE = { PARFAITE: 1, GAINEE: 2, PLAT: 3 } as const;

/** La note d'un plongeon (0 à 100) : la précision sur le trou d'eau, la blessure en eau peu profonde, l'entrée dans l'eau. */
export function note(x: number, fosse: number, entree: number): { zone: number; score: number } {
  if (Math.abs(x) > EAU) return { zone: ZONE.BERGE, score: 0 };
  const d = Math.abs(x - fosse);
  const profond = d <= PROFOND;
  // 100 au milieu du trou, 70 au bord ; au-delà, l'eau baisse, la note aussi, et les galets coûtent 10 points
  const precision = profond ? 100 - (d / PROFOND) * 30 : Math.max(5, 70 - (d - PROFOND) * 7) - 10;
  const bonus = entree === ENTREE.PARFAITE ? 10 : entree === ENTREE.PLAT ? -20 : 0;
  return {
    zone: profond ? ZONE.PROFOND : ZONE.BAS,
    score: Math.max(0, Math.min(100, Math.round(precision + bonus))),
  };
}

/** La hauteur du plongeur au-dessus de l'eau (m) : sur le pont, puis la chute qui accélère, puis l'eau (ou la berge). */
export function hauteurDe(etape: EtapePlongeon, minuteur: number): number {
  if (etape === 'visee' || etape === 'podium') return HAUTEUR_PONT;
  if (etape !== 'chute') return 0;
  const k = minuteur / DUREE_CHUTE;
  return HAUTEUR_PONT * k * k;
}

/** Ce que la rivière réserve à ce saut : le trou d'eau, deux rafales, une hirondelle. Le même pour l'hôte et pour le rendu. */
export function tirage(manche: number): {
  fosse: number;
  rafales: { t: number; force: number }[];
  oiseau: { t: number; x: number; sens: number };
} {
  const r = new Aleatoire(manche * 7919 + 13);
  const fosse = Math.round(r.entre(-(EAU - PROFOND - 2), EAU - PROFOND - 2) * 10) / 10;
  const signe = () => (r.suivant() < 0.5 ? -1 : 1);
  return {
    fosse,
    rafales: [
      { t: r.entre(0.3, 1.2), force: signe() * RAFALE },
      { t: r.entre(1.7, 2.5), force: signe() * RAFALE },
    ],
    // l'hirondelle passe près du trou d'eau : on la voit venir, il faut l'éviter puis revenir
    oiseau: { t: r.entre(1.2, 2.6), x: fosse + r.entre(-2, 2), sens: signe() },
  };
}

/** Le vent à `t` secondes du saut (m/s²), selon les rafales : il monte et retombe en douceur. */
export function vent(rafales: readonly { t: number; force: number }[], t: number): number {
  let f = 0;
  for (const r of rafales) {
    const u = (t - r.t) / DUREE_RAFALE;
    if (u > 0 && u < 1) f += r.force * Math.sin(u * Math.PI);
  }
  return f;
}

/**
 * Le concours de plongeon du pont des Tuves (un mini-jeu) : chaque joueur, à son tour, vise le trou d'eau depuis le parapet (un
 * curseur balaie la rivière), saute, se dirige pendant la chute (le vent souffle, une hirondelle passe), tend les bras au dernier
 * moment, et touche l'eau... ou la berge. La note (la précision) gagne. Dans l'histoire, le podium passé, on repart vers les
 * Alpes ; lancé depuis le menu des mini-jeux, on rejoue.
 */
export class ConcoursPlongeon {
  etape: EtapePlongeon = 'visee';
  tours: number[];
  tour = 0;
  manche = 0;
  minuteur = 0;
  /** le temps passé à viser (le curseur balaie) */
  private vise = 0;
  x = 0;
  vx = 0;
  /** les bras tendus, et à combien de l'eau (en ticks) on les a tendus (-1 : pas encore) */
  bras = -1;
  zone = 0;
  entree = 0;
  score = 0;
  scores: (number | null)[] = Array(MAX_JOUEURS).fill(null);
  fini = false;
  private alea = tirage(0);
  private readonly commandes = Array.from({ length: MAX_JOUEURS }, () => new EtatCommandes());

  constructor(
    sieges: readonly number[],
    readonly miniJeu: boolean,
  ) {
    this.tours = sieges.length ? [...sieges] : [0];
    this.nouveauSaut();
  }

  get siege(): number {
    return this.tours[this.tour]!;
  }

  /** Où est le curseur de visée, en mètres. */
  get visee(): number {
    return VISEE * Math.sin((this.vise / PERIODE_VISEE) * 2 * Math.PI);
  }

  /** Le temps écoulé depuis le saut, en secondes. */
  get temps(): number {
    return this.etape === 'chute' ? (DUREE_CHUTE - this.minuteur) * DT : 0;
  }

  /** La hauteur au-dessus de l'eau (m). */
  get hauteur(): number {
    return hauteurDe(this.etape, this.minuteur);
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
      case 'visee':
        // on saute là où l'on voit le curseur : il n'avance qu'ensuite
        if (k.appuye(VALIDE)) {
          this.x = this.visee;
          this.vx = 0;
          this.etape = 'chute';
          this.minuteur = DUREE_CHUTE;
          son('saut');
        } else this.vise++;
        break;
      case 'chute':
        this.chute(k, son);
        if (this.minuteur === 0) this.touche(son);
        break;
      case 'impact':
        if (this.minuteur === 0) {
          this.etape = 'resultat';
          this.minuteur = DUREE_RESULTAT;
        }
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

  /** Un pas de chute : le joueur se dirige, le vent pousse, l'hirondelle bouscule ; un appui tend les bras. */
  private chute(k: EtatCommandes, son: (nom: string) => void): void {
    const t = this.temps;
    this.vx += (k.horizontal * CONTROLE + vent(this.alea.rafales, t)) * DT;
    this.vx *= 0.985;
    this.x += this.vx * DT;
    const o = this.alea.oiseau;
    if (Math.abs(t - o.t) < DT / 2 + 1e-9 && Math.abs(this.x - o.x) < PORTEE_OISEAU) {
      this.vx += o.sens * BOUSCULADE;
      son('rebond');
    }
    if (this.bras < 0 && k.appuye(VALIDE)) this.bras = this.minuteur;
  }

  /** Le plongeur touche l'eau (ou la berge) : la note, et le meilleur score du joueur. */
  private touche(son: (nom: string) => void): void {
    const eau = Math.abs(this.x) <= EAU;
    this.entree = !eau
      ? 0
      : this.bras < 0
        ? ENTREE.PLAT
        : this.bras <= ENTREE_PARFAITE
          ? ENTREE.PARFAITE
          : ENTREE.GAINEE;
    const n = note(this.x, this.alea.fosse, this.entree);
    this.zone = n.zone;
    this.score = n.score;
    const avant = this.scores[this.siege];
    if (avant === null || avant === undefined || n.score > avant) this.scores[this.siege] = n.score;
    this.etape = 'impact';
    this.minuteur = DUREE_IMPACT;
    son(eau ? 'plouf' : 'chute');
  }

  /** Un saut neuf : le joueur suivant monte sur le parapet ; la rivière change (le trou d'eau, le vent, l'hirondelle). */
  private nouveauSaut(): void {
    this.manche = (this.manche + 1) % 256;
    this.alea = tirage(this.manche);
    this.etape = 'visee';
    this.minuteur = 0;
    this.vise = 0;
    this.x = 0;
    this.vx = 0;
    this.bras = -1;
    this.zone = 0;
    this.entree = 0;
    this.score = 0;
  }

  private tourSuivant(presents: readonly number[]): void {
    do this.tour++;
    while (this.tour < this.tours.length && !presents.includes(this.siege));
    if (this.tour < this.tours.length) return this.nouveauSaut();
    this.tour = Math.max(0, this.tours.length - 1);
    this.etape = 'podium';
    this.minuteur = ATTENTE_APPUI;
  }

  private recommence(presents: readonly number[]): void {
    this.tours = presents.length ? [...presents] : [0];
    this.tour = 0;
    this.scores = Array(MAX_JOUEURS).fill(null);
    this.nouveauSaut();
  }

  vue(): VuePlongeon {
    return {
      etape: this.etape,
      siege: this.siege,
      manche: this.manche,
      miniJeu: this.miniJeu,
      minuteur: this.minuteur,
      x: this.x,
      visee: this.visee,
      vent: vent(this.alea.rafales, this.temps) / RAFALE,
      bras: this.bras >= 0,
      zone: this.zone,
      entree: this.entree,
      score: this.score,
      scores: [...this.scores],
    };
  }
}
