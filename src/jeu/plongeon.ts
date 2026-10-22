import { MAX_JOUEURS, TICKS_PAR_SECONDE } from '../config';
import { Aleatoire } from '../moteur/maths';
import { C, EtatCommandes } from './commandes';
import type { EtapePlongeon, VuePlongeon } from './vue';

/** Le saut du pont des Tuves, le niveau du concours de plongeon (indice dans NIVEAUX) : juste après le pont, avant les Alpes. */
export const NIVEAU_PLONGEON = 13;

/**
 * Le pont et les gorges, vus de face (en mètres) : x en travers (0 sous la clé de l'arche), y vers le bas (0 : le dessus du
 * tablier, HAUTEUR : la surface de la rivière). Les parois des gorges sont à ±GORGE ; la rivière couvre ±EAU, les berges au-delà ;
 * le trou d'eau fait 2 × PROFOND de large. Tom marche sur le parapet entre ±PARAPET ; le pont est en dos d'âne, pointu à la
 * clé : à `x`, le tablier est `pente(x)` mètres plus bas.
 */
export const HAUTEUR = 60;
export const GORGE = 9;
export const EAU = 5.5;
export const PROFOND = 1.6;
export const PARAPET = 8;
/** Le dos d'âne : le tablier descend de PENTE mètres par mètre de part et d'autre de la clé. */
export const PENTE = 0.42;
export const pente = (x: number): number => PENTE * Math.abs(x);

const SECONDE = TICKS_PAR_SECONDE;
const DT = 1 / SECONDE;
/** Le survol du départ (la caméra remonte de la rivière au pont : on voit où est le trou d'eau), puis on peut sauter. */
export const DUREE_SURVOL = Math.round(2.4 * SECONDE);
export const DUREE_IMPACT = 2 * SECONDE;
export const DUREE_RESULTAT = 5 * SECONDE;
const ATTENTE_APPUI = SECONDE;
/**
 * La détente des jambes, comme un élastique qu'on tend : tant qu'on tire le joystick vers le bas, la tension monte en MONTEE ;
 * tenue au-delà, les jambes flanchent et elle retombe en LACHE, puis remonte. Au lâcher, Tom part vers le haut d'autant plus
 * fort (IMPULSION m/s à pleine tension), et de travers à l'opposé de là où l'on a tiré (ELAN m/s), comme une fronde.
 * Trop peu de tension, il bascule du parapet sans élan et ne contrôle rien un moment.
 */
const MONTEE = Math.round(0.8 * SECONDE);
const LACHE = Math.round(0.4 * SECONDE);
const IMPULSION = 7;
const ELAN = 3.5;
const BASCULE = 0.3;
/** La chute : pesanteur, vitesse limite, contrôle en l'air, frottement. */
const PESANTEUR = 9;
const LIMITE = 15;
const CONTROLE = 8;
const FROTTEMENT = 0.6;
const MAX_VX = 5.5;
/** Une branche heurtée : on perd sa vitesse, on est rejeté, on ne contrôle plus rien un instant, et 5 points. */
const SONNE = Math.round(0.3 * SECONDE);
const VITESSE_OISEAU = 6;

const VALIDE = C.SAUT | C.TIR;

/** Où l'on tombe : 1 dans le trou d'eau, 2 dans l'eau peu profonde, 3 sur la berge (0 : pas encore). */
export const ZONE = { PROFOND: 1, BAS: 2, BERGE: 3 } as const;
/** La note d'un plongeon (0 à 100) : la précision sur le trou d'eau, la blessure en eau peu profonde, les éraflures. */
export function note(x: number, fosse: number, eraflures = 0): { zone: number; score: number } {
  if (Math.abs(x) > EAU) return { zone: ZONE.BERGE, score: 0 };
  const d = Math.abs(x - fosse);
  const profond = d <= PROFOND;
  // 100 au milieu du trou, 70 à son bord ; au-delà, l'eau baisse vite, et les galets coûtent 10 points
  const precision = profond ? 100 - (d / PROFOND) * 30 : Math.max(0, 70 - (d - PROFOND) * 12) - 10;
  return {
    zone: profond ? ZONE.PROFOND : ZONE.BAS,
    score: Math.max(0, Math.min(100, Math.round(precision - 5 * eraflures))),
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

/** La tension des jambes (0 à 1) après `charge` ticks à tirer le joystick : elle monte, puis les jambes flanchent. */
export function tensionDe(charge: number): number {
  const p = charge % (MONTEE + LACHE);
  return p < MONTEE ? p / MONTEE : 1 - (p - MONTEE) / LACHE;
}

/** La vitesse de départ (m/s) pour une tension et une visée (-1 à 1, là où part Tom) : vers le haut, et de travers. */
export const depart = (tension: number, visee: number): { vx: number; vy: number } => ({
  vx: visee * ELAN * (0.4 + 0.6 * tension),
  vy: -IMPULSION * tension,
});

/**
 * Le concours de plongeon du pont des Tuves (un mini-jeu), vu de face, façon Doodle Jump à l'envers : chaque joueur, à son tour,
 * voit la caméra remonter de la rivière au pont (le trou d'eau est en bas, à retenir), choisit sa place sur le parapet, tend ses
 * jambes comme un élastique (le joystick tiré vers le bas, et de côté pour partir de l'autre) et lâche : il monte, bras pliés,
 * puis retombe bras tendus soixante mètres entre les rives : des branches de figuier en sortent, des hirondelles traversent, des
 * couloirs de vent poussent ; il se dirige, et touche l'eau... ou la berge. La note (la précision) gagne.
 */
export class ConcoursPlongeon {
  etape: EtapePlongeon = 'visee';
  tours: number[];
  tour = 0;
  manche = 0;
  minuteur = 0;
  /** les ticks du survol (DUREE_SURVOL : fini) */
  vise = 0;
  /** la tension des jambes (0 à 1) tant qu'on tire, et la visée (-1 à 1 : vers où il partira) */
  tension = 0;
  visee = 0;
  /** les ticks depuis le saut */
  temps = 0;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  eraflures = 0;
  zone = 0;
  score = 0;
  scores: (number | null)[] = Array(MAX_JOUEURS).fill(null);
  fini = false;
  private sonne = 0;
  /** les ticks à tirer le joystick (-1 : on ne tire pas) */
  private charge = -1;
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

  /** Sur le parapet : le survol (un appui le passe), puis Tom choisit sa place, tend ses jambes et saute. */
  private parapet(k: EtatCommandes, son: (nom: string) => void): void {
    if (this.vise < DUREE_SURVOL) {
      this.vise = k.appuye(VALIDE) ? DUREE_SURVOL : this.vise + 1;
      return;
    }
    const tire = C.BAS | VALIDE;
    if (this.charge < 0) {
      this.x = Math.max(-PARAPET, Math.min(PARAPET, this.x + k.horizontal * 3 * DT));
      this.y = pente(this.x);
      if (k.appuye(tire)) this.charge = 0;
      return;
    }
    if (k.tenu(tire)) {
      // on tire : la tension monte (puis flanche), la visée part à l'opposé du côté où l'on tire, comme une fronde
      this.charge++;
      this.tension = tensionDe(this.charge);
      this.visee = Math.max(-1, Math.min(1, this.visee - k.horizontal * 1.6 * DT));
      return;
    }
    // on lâche : Tom saute
    const v = depart(this.tension, this.visee);
    this.vx = v.vx;
    this.vy = v.vy;
    if (this.tension < BASCULE) this.sonne = SONNE * 2;
    this.charge = -1;
    this.etape = 'chute';
    this.temps = 0;
    son('saut');
  }

  /** Un pas de chute : la pesanteur, le joueur qui se dirige, le vent, les branches, les hirondelles. */
  private chute(k: EtatCommandes, son: (nom: string) => void): void {
    this.temps++;
    const t = this.temps * DT;
    const pilote = this.sonne > 0 ? 0 : k.horizontal * CONTROLE;
    if (this.sonne > 0) this.sonne--;
    let ax = pilote - this.vx * FROTTEMENT;
    for (const v of this.alea.vents) if (this.y > v.y && this.y < v.y + v.hauteur) ax += v.force;
    this.vx = Math.max(-MAX_VX, Math.min(MAX_VX, this.vx + ax * DT));
    this.vy = Math.min(LIMITE, this.vy + PESANTEUR * DT);
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
      const loin = Math.abs(this.y - 0.8 - o.y) > 1 || Math.abs(this.x - xOiseau(o, t)) > 0.9;
      if (this.touchees.has(cle) || loin) return;
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
    const n = note(this.x, this.alea.fosse, this.eraflures);
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
    this.tension = 0;
    this.visee = 0;
    this.charge = -1;
    this.eraflures = 0;
    this.zone = 0;
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
      tension: this.tension,
      visee: this.visee,
      temps: this.temps,
      x: this.x,
      y: this.y,
      vx: this.vx,
      bras: this.etape === 'chute' && this.vy > 0,
      eraflures: this.eraflures,
      zone: this.zone,
      score: this.score,
      scores: [...this.scores],
    };
  }
}
