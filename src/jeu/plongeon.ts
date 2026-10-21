import { MAX_JOUEURS, TICKS_PAR_SECONDE } from '../config';
import { Aleatoire } from '../moteur/maths';
import { C, EtatCommandes } from './commandes';
import type { EtapePlongeon, VuePlongeon } from './vue';

/** Le saut du pont des Tuves, le niveau du concours de plongeon (indice dans NIVEAUX) : juste après le pont, avant les Alpes. */
export const NIVEAU_PLONGEON = 13;

/**
 * Le pont et les gorges, vus de face (en mètres) : x en travers (0 sous la clé de l'arche), y vers le bas (0 : le dessus du
 * tablier, HAUTEUR : la surface de la rivière). Les parois des gorges sont à ±GORGE ; la rivière couvre ±EAU, les berges au-delà ;
 * le trou d'eau fait 2 × PROFOND de large. Tom marche sur le parapet entre ±PARAPET.
 */
export const HAUTEUR = 60;
export const GORGE = 9;
export const EAU = 5.5;
export const PROFOND = 1.6;
export const PARAPET = 8;

const SECONDE = TICKS_PAR_SECONDE;
const DT = 1 / SECONDE;
/** Le survol du départ (la caméra remonte de la rivière au pont : on voit où est le trou d'eau), puis on peut sauter. */
export const DUREE_SURVOL = Math.round(2.4 * SECONDE);
export const DUREE_IMPACT = 2 * SECONDE;
const DUREE_RESULTAT = 5 * SECONDE;
const ATTENTE_APPUI = SECONDE;
/** La jauge d'élan : elle oscille, et l'élan du saut (m/s, en travers) est sa valeur au moment de l'appui. */
const ELAN = 3.2;
const PERIODE_JAUGE = Math.round(1.1 * SECONDE);
/** La chute : pesanteur, vitesse limite (bras repliés, bras tendus), contrôle en l'air (repliés, tendus), frottement. */
const PESANTEUR = 9;
const LIMITE = 12;
const LIMITE_BRAS = 16;
const CONTROLE = 8;
const CONTROLE_BRAS = 2.5;
const FROTTEMENT = 0.6;
const MAX_VX = 5.5;
/** Une branche heurtée : on perd sa vitesse, on est rejeté, on ne contrôle plus rien un instant, et 5 points. */
const SONNE = Math.round(0.3 * SECONDE);
/** Tendre les bras à moins de cette durée de l'eau : une entrée parfaite. */
const ENTREE_PARFAITE = Math.round(0.4 * SECONDE);
const VITESSE_OISEAU = 6;

const VALIDE = C.SAUT | C.TIR;

/** Où l'on tombe : 1 dans le trou d'eau, 2 dans l'eau peu profonde, 3 sur la berge (0 : pas encore). */
export const ZONE = { PROFOND: 1, BAS: 2, BERGE: 3 } as const;
/** Comment on entre : 1 bras tendus au dernier moment, 2 bras tendus trop tôt, 3 à plat (0 : pas encore). */
export const ENTREE = { PARFAITE: 1, GAINEE: 2, PLAT: 3 } as const;

/** La note d'un plongeon (0 à 100) : la précision sur le trou d'eau, la blessure en eau peu profonde, l'entrée, les éraflures. */
export function note(
  x: number,
  fosse: number,
  entree: number,
  eraflures = 0,
): { zone: number; score: number } {
  if (Math.abs(x) > EAU) return { zone: ZONE.BERGE, score: 0 };
  const d = Math.abs(x - fosse);
  const profond = d <= PROFOND;
  // 100 au milieu du trou, 70 à son bord ; au-delà, l'eau baisse vite, et les galets coûtent 10 points
  const precision = profond ? 100 - (d / PROFOND) * 30 : Math.max(0, 70 - (d - PROFOND) * 12) - 10;
  const bonus = entree === ENTREE.PARFAITE ? 10 : entree === ENTREE.PLAT ? -25 : 0;
  return {
    zone: profond ? ZONE.PROFOND : ZONE.BAS,
    score: Math.max(0, Math.min(100, Math.round(precision + bonus - 5 * eraflures))),
  };
}

export interface Branche {
  /** sa hauteur dans les gorges (m), le côté d'où elle sort (-1 : la paroi de gauche), sa longueur (m) */
  y: number;
  cote: number;
  longueur: number;
}
export interface Oiseau {
  /** sa hauteur (m), son sens (1 : vers la droite), le moment où il quitte la paroi (s après le saut) */
  y: number;
  sens: number;
  depart: number;
}
export interface CouloirVent {
  y: number;
  hauteur: number;
  /** m/s² : positif vers la droite */
  force: number;
}

/** Ce que les gorges réservent à ce saut : le trou d'eau, les branches, les hirondelles, le vent. Le même pour l'hôte et l'écran. */
export function tirage(manche: number): {
  fosse: number;
  branches: Branche[];
  oiseaux: Oiseau[];
  vents: CouloirVent[];
} {
  const r = new Aleatoire(manche * 7919 + 13);
  const signe = () => (r.suivant() < 0.5 ? -1 : 1);
  const fosse = Math.round(r.entre(-(EAU - PROFOND - 1), EAU - PROFOND - 1) * 10) / 10;
  const branches: Branche[] = [];
  let cote = signe();
  for (let y = 7 + r.entre(0, 2); y < HAUTEUR - 5; y += r.entre(3.2, 5.5)) {
    branches.push({ y, cote, longueur: r.entre(2.5, 6.2) });
    cote = r.suivant() < 0.7 ? -cote : cote;
  }
  const oiseaux: Oiseau[] = [0, 1, 2].map((k) => ({
    y: 14 + k * 13 + r.entre(-3, 3),
    sens: signe(),
    depart: 0.6 + k * 1.3 + r.entre(-0.3, 0.3),
  }));
  const vents: CouloirVent[] = [0, 1, 2].map((k) => ({
    y: 10 + k * 15 + r.entre(0, 6),
    hauteur: r.entre(4, 7),
    force: signe() * r.entre(6, 10),
  }));
  return { fosse, branches, oiseaux, vents };
}

/** Où est l'hirondelle `o` à `t` secondes du saut (m, en travers). */
export const xOiseau = (o: Oiseau, t: number): number =>
  -o.sens * (GORGE + 1) + o.sens * VITESSE_OISEAU * (t - o.depart);

/** La jauge d'élan, de -1 à 1, après `vise` ticks. */
export const jaugeDe = (vise: number): number => Math.sin((vise / PERIODE_JAUGE) * 2 * Math.PI);

/**
 * Le concours de plongeon du pont des Tuves (un mini-jeu), vu de face, façon Doodle Jump à l'envers : chaque joueur, à son tour,
 * voit la caméra remonter de la rivière au pont (le trou d'eau est en bas, à retenir), choisit sa place sur le parapet, saute (la
 * jauge d'élan le lance plus ou moins de travers), puis tombe soixante mètres entre les parois : des branches de figuier sortent
 * des falaises, des hirondelles traversent, des couloirs de vent poussent ; il se dirige, tend les bras au dernier moment, et
 * touche l'eau... ou la berge. La note (la précision) gagne.
 */
export class ConcoursPlongeon {
  etape: EtapePlongeon = 'visee';
  tours: number[];
  tour = 0;
  manche = 0;
  minuteur = 0;
  /** les ticks passés sur le parapet (le survol, puis la jauge d'élan) */
  vise = 0;
  /** les ticks depuis le saut */
  temps = 0;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  /** les bras tendus : à combien de ticks du saut (-1 : pas encore) */
  bras = -1;
  eraflures = 0;
  zone = 0;
  entree = 0;
  score = 0;
  scores: (number | null)[] = Array(MAX_JOUEURS).fill(null);
  fini = false;
  private sonne = 0;
  private touchees = new Set<number>();
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

  /** Le trou d'eau de ce saut (m, en travers). */
  get fosse(): number {
    return this.alea.fosse;
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
        this.parapet(k, son);
        break;
      case 'chute':
        this.chute(k, son);
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

  /** Sur le parapet : le survol (un appui le passe), puis Tom choisit sa place et saute, lancé par la jauge d'élan. */
  private parapet(k: EtatCommandes, son: (nom: string) => void): void {
    if (this.vise < DUREE_SURVOL) {
      this.vise = k.appuye(VALIDE) ? DUREE_SURVOL : this.vise + 1;
      return;
    }
    this.x = Math.max(-PARAPET, Math.min(PARAPET, this.x + k.horizontal * 3 * DT));
    if (k.appuye(VALIDE)) {
      // on saute avec l'élan que la jauge montre au moment de l'appui
      this.vx = jaugeDe(this.vise) * ELAN;
      this.vy = -3;
      this.etape = 'chute';
      this.temps = 0;
      son('saut');
    } else this.vise++;
  }

  /** Un pas de chute : la pesanteur, le joueur qui se dirige, le vent, les branches, les hirondelles ; un appui tend les bras. */
  private chute(k: EtatCommandes, son: (nom: string) => void): void {
    this.temps++;
    const t = this.temps * DT;
    const bras = this.bras >= 0;
    if (!bras && k.appuye(VALIDE)) this.bras = this.temps;
    const pilote = this.sonne > 0 ? 0 : k.horizontal * (bras ? CONTROLE_BRAS : CONTROLE);
    if (this.sonne > 0) this.sonne--;
    let ax = pilote - this.vx * FROTTEMENT;
    for (const v of this.alea.vents) if (this.y > v.y && this.y < v.y + v.hauteur) ax += v.force;
    this.vx = Math.max(-MAX_VX, Math.min(MAX_VX, this.vx + ax * DT));
    this.vy = Math.min(bras ? LIMITE_BRAS : LIMITE, this.vy + PESANTEUR * DT);
    this.x += this.vx * DT;
    this.y += this.vy * DT;
    // les parois : on rebondit dessus
    if (Math.abs(this.x) > GORGE - 0.6) {
      this.x = Math.sign(this.x) * (GORGE - 0.6);
      this.vx = -this.vx * 0.3;
    }
    this.alea.branches.forEach((b, i) => {
      if (this.touchees.has(i) || b.y < this.y - 1.7 || b.y > this.y) return;
      const bout = b.cote * (GORGE - b.longueur);
      const dedans = b.cote < 0 ? this.x - 0.4 < bout : this.x + 0.4 > bout;
      if (!dedans) return;
      // la branche cède sous le poids : on y laisse sa vitesse, on glisse vers le bout le plus proche, et on s'y érafle
      this.touchees.add(i);
      this.eraflures++;
      this.vy *= 0.3;
      const versLeBout = Math.abs(this.x - bout) < b.longueur / 2;
      this.vx = (versLeBout ? -b.cote : b.cote) * 3.5;
      this.sonne = SONNE;
      son('aie');
    });
    this.alea.oiseaux.forEach((o, i) => {
      const cle = 100 + i;
      if (
        this.touchees.has(cle) ||
        Math.abs(this.y - 0.8 - o.y) > 1 ||
        Math.abs(this.x - xOiseau(o, t)) > 0.9
      )
        return;
      this.touchees.add(cle);
      this.vx += o.sens * 5;
      son('picore');
    });
    if (this.y >= HAUTEUR) this.touche(son);
  }

  /** Tom touche l'eau (ou la berge) : la note, et le meilleur score du joueur. */
  private touche(son: (nom: string) => void): void {
    this.y = HAUTEUR;
    const eau = Math.abs(this.x) <= EAU;
    const avant = this.bras < 0 ? -1 : this.temps - this.bras;
    this.entree = !eau
      ? 0
      : avant < 0
        ? ENTREE.PLAT
        : avant <= ENTREE_PARFAITE
          ? ENTREE.PARFAITE
          : ENTREE.GAINEE;
    const n = note(this.x, this.alea.fosse, this.entree, this.eraflures);
    this.zone = n.zone;
    this.score = n.score;
    const avantScore = this.scores[this.siege];
    if (avantScore === null || avantScore === undefined || n.score > avantScore)
      this.scores[this.siege] = n.score;
    this.etape = 'impact';
    this.minuteur = DUREE_IMPACT;
    son(eau ? 'plouf' : 'chute');
  }

  /** Un saut neuf : le joueur suivant monte sur le parapet ; les gorges changent (le trou d'eau, les branches, le vent...). */
  private nouveauSaut(): void {
    this.manche = (this.manche + 1) % 256;
    this.alea = tirage(this.manche);
    this.etape = 'visee';
    this.minuteur = 0;
    this.vise = 0;
    this.temps = 0;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.bras = -1;
    this.eraflures = 0;
    this.zone = 0;
    this.entree = 0;
    this.score = 0;
    this.sonne = 0;
    this.touchees = new Set();
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
      vise: this.vise,
      temps: this.temps,
      x: this.x,
      y: this.y,
      vx: this.vx,
      bras: this.bras >= 0,
      eraflures: this.eraflures,
      zone: this.zone,
      entree: this.entree,
      score: this.score,
      scores: [...this.scores],
    };
  }
}
