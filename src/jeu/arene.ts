import {
  DELAI_REAPPARITION,
  HEROS_HAUTEUR,
  HEROS_LARGEUR,
  MAX_JOUEURS,
  TICKS_PAR_SECONDE,
  TUILE,
} from '../config';
import type { Joueur } from '../entites/joueur';
import { Boss } from '../entites/ennemis/boss';
import { Ennemi } from '../entites/ennemis/ennemi';
import { Objet } from '../entites/objets';
import { T } from '../monde/tuiles';
import { parcoursAcces } from '../niveaux/accessibilite';
import type { NiveauLu } from '../niveaux/format';
import type { CacheCibles } from './cibles';
import type { IAArene } from './arene-ia';
import type { Cible } from './contexte';
import type { Partie } from './partie';

/**
 * Le battle royale : jusqu'à 8 joueurs sur une carte, 3 vies chacun, et les tirs des héros blessent les autres héros. On réapparaît
 * loin des autres ; une zone se referme peu à peu (on perd de la vie dehors) ; le dernier en lice gagne.
 *
 * Les étapes : le salon (en ligne, on attend les joueurs en se dégourdissant les jambes, sans dégâts), le compte à rebours (tout
 * le monde est placé, figé), le combat, la fin (le classement ; « suivant » relance une manche sur la même carte).
 */

export const VIES_ARENE = 3;
/** au plus, en ramassant des cœurs et en libérant des cages */
export const VIES_ARENE_MAX = 5;
export const ETAPES_ARENE = ['salon', 'compte', 'combat', 'fin'] as const;
export type EtapeArene = (typeof ETAPES_ARENE)[number];

const COMPTE = 3 * TICKS_PAR_SECONDE;
/** la zone ne bouge pas tout de suite : le temps de se trouver */
const ZONE_FIXE = 20 * TICKS_PAR_SECONDE;
const ZONE_RESSERRE = 120 * TICKS_PAR_SECONDE;
/** la largeur de la zone à la fin (en tuiles), et la largeur de départ par joueur */
const ZONE_FINALE = 14;
const ZONE_PAR_JOUEUR = 45;
/** dehors, on perd un cœur toutes les secondes */
const DEGATS_ZONE = TICKS_PAR_SECONDE;
/** à la réapparition, quelques secondes sans dégâts */
const PROTECTION = 150;
/** on ne relance pas la manche d'un appui maladroit juste après la fin */
const FIN_MIN = 2 * TICKS_PAR_SECONDE;

export interface ReglesArene {
  /** les ennemis du niveau restent (sinon : seulement les joueurs, les caisses, les armes, les soins) */
  ennemis: boolean;
}

/** Le battle royale tel qu'on le voit (voir vue.ts : `EtatVue.arene`). */
export interface VueArene {
  etape: EtapeArene;
  /** compte à rebours et fin : les ticks écoulés dans l'étape ; combat : les secondes de combat */
  minuteur: number;
  /** la zone, en pixels du monde (bord gauche, bord droit) */
  zone: [number, number];
  /** par siège : les vies qui restent, les éliminations faites, le rang final (1 : vainqueur ; 0 : encore en lice) */
  vies: number[];
  eliminations: number[];
  rangs: number[];
  ennemis: boolean;
}

/** Combien de joueurs pour cette carte : la surface où l'on peut aller, en cases, donne une fourchette (2 à 8). */
export function joueursConseilles(lu: NiveauLu): [number, number] {
  const n = parcoursAcces(lu).dist.reduce((s, d) => s + (d >= 0 ? 1 : 0), 0);
  const max = Math.max(2, Math.min(MAX_JOUEURS, Math.floor(n / 150)));
  const min = Math.max(2, Math.min(max, Math.round(n / 400)));
  return [min, max];
}

export class Arene {
  etape: EtapeArene;
  minuteur = 0;
  zone: [number, number] = [0, 0];
  readonly vies = new Array<number>(MAX_JOUEURS).fill(0);
  readonly eliminations = new Array<number>(MAX_JOUEURS).fill(0);
  readonly rangs = new Array<number>(MAX_JOUEURS).fill(0);
  /** les cases où l'on peut se tenir (y × largeur + x) : là où l'on réapparaît */
  private cases: number[] = [];
  private depart: [number, number] = [0, 0];
  private arrivee: [number, number] = [0, 0];
  private cibles = new Map<number, Cible[]>();
  /** les joueurs de l'ordinateur (hors ligne) */
  ia: IAArene | null = null;

  constructor(
    readonly regles: ReglesArene,
    enLigne: boolean,
  ) {
    this.etape = enLigne ? 'salon' : 'compte';
  }

  /** Le combat est-il commencé (les tirs blessent, les vies comptent) ? */
  get enJeu(): boolean {
    return this.etape === 'combat';
  }

  /** Pendant le compte à rebours, tout le monde attend. */
  get gele(): boolean {
    return this.etape === 'compte';
  }

  /** Après le chargement de la carte : on retire ce qui n'a pas sa place dans une arène. */
  prepare(p: Partie): void {
    p.entites = p.entites.filter((e) => {
      if (e instanceof Objet) return !['van', 'drapeau', 'sibylle'].includes(e.sorte);
      return this.regles.ennemis || !(e instanceof Ennemi || e instanceof Boss);
    });
    // la barrière du boss n'a plus de sens : la carte entière est ouverte
    for (let y = 0; y < p.carte.hauteur; y++)
      for (let x = 0; x < p.carte.largeur; x++)
        if (p.carte.get(x, y) === T.BARRIERE) p.carte.pose(x, y, T.VIDE);
    p.carte.modifications = [];
    const { dist } = parcoursAcces(p.lu);
    this.cases = [];
    dist.forEach((d, k) => d >= 0 && this.cases.push(k));
    if (!this.cases.length) this.cases.push(p.lu.depart.ty * p.lu.largeur + p.lu.depart.tx);
    this.zone = [0, p.lu.largeur * TUILE];
    this.cibles.clear();
  }

  /** Le début d'une manche : chacun a ses vies, la zone de départ est tirée selon le nombre de joueurs, puis le compte à rebours. */
  demarre(p: Partie): void {
    const joueurs = p.joueurs.filter((j): j is Joueur => !!j);
    const L = p.lu.largeur * TUILE;
    const largeur = Math.min(L, (40 + ZONE_PAR_JOUEUR * joueurs.length) * TUILE);
    const centre = this.caseAuHasard(p, this.cases)[0] + HEROS_LARGEUR / 2;
    const g = Math.max(0, Math.min(L - largeur, centre - largeur / 2));
    this.depart = [g, g + largeur];
    const fin = this.caseAuHasard(p, this.casesDans(p, [g, g + largeur]))[0] + HEROS_LARGEUR / 2;
    const demi = (ZONE_FINALE * TUILE) / 2;
    this.arrivee = [Math.max(g, fin - demi), Math.min(g + largeur, fin + demi)];
    this.zone = [...this.depart];
    this.vies.fill(0);
    this.eliminations.fill(0);
    this.rangs.fill(0);
    for (const j of joueurs) {
      this.vies[j.siege] = VIES_ARENE;
      const [x, y] = this.pointLibre(p, j.siege);
      j.reapparait(x, y, j.membre);
      j.invulnerable = COMPTE + PROTECTION;
      j.delaiReapparition = 0;
    }
    this.etape = 'compte';
    this.minuteur = 0;
  }

  /** Un tir d'un héros : il vise les ennemis et tous les autres héros (jamais celui qui a tiré). */
  ciblesDuTireur(cache: CacheCibles, tireur: number): readonly Cible[] {
    let l = this.cibles.get(tireur);
    if (!l) {
      l = [...cache.ennemis, ...cache.heros.filter((h) => h.id !== tireur)];
      this.cibles.set(tireur, l);
    }
    return l;
  }

  /** À chaque recalcul des cibles de la partie. */
  oublieCibles(): void {
    this.cibles.clear();
  }

  maj(p: Partie): void {
    this.minuteur++;
    this.ia?.pilote(p);
    if (this.etape === 'compte' && this.minuteur >= COMPTE) {
      this.etape = 'combat';
      this.minuteur = 0;
      p.son('demarrage', 0, 0);
    }
    if (this.etape !== 'combat') return;
    // la zone : fixe un moment, puis elle se referme vers l'arrivée
    const t = Math.max(0, Math.min(1, (this.minuteur - ZONE_FIXE) / ZONE_RESSERRE));
    this.zone = [
      this.depart[0] + (this.arrivee[0] - this.depart[0]) * t,
      this.depart[1] + (this.arrivee[1] - this.depart[1]) * t,
    ];
    if (this.minuteur % DEGATS_ZONE !== 0) return;
    for (const j of p.joueurs) {
      if (!j || j.mort || j.invincible > 0 || (j.cx >= this.zone[0] && j.cx <= this.zone[1])) continue;
      j.pv--;
      j.dernierTireur = null;
      p.son('aie', j.cx, j.cy);
      p.texte(j.cx, j.corps.y - 6, 'ZONE !', '#ff5a5a');
      if (j.pv <= 0) j.meurt(p);
    }
  }

  /** Un héros vient de tomber : une vie de moins (en combat), le tueur compte une élimination ; il revient, ou il est éliminé. */
  mort(p: Partie, j: Joueur): void {
    if (j.delaiReapparition === 0) {
      j.delaiReapparition = DELAI_REAPPARITION;
      if (!this.enJeu) return;
      const tueur = p.joueurs.find((o) => o && o.id === j.dernierTireur && o !== j);
      if (tueur) this.eliminations[tueur.siege]++;
      if (--this.vies[j.siege]! <= 0) this.elimine(p, j.siege);
      return;
    }
    if (--j.delaiReapparition > 1) return;
    if (this.etape !== 'salon' && this.vies[j.siege]! <= 0) {
      j.delaiReapparition = 2; // éliminé : il regarde la suite
      return;
    }
    const [x, y] = this.pointLibre(p, j.siege);
    j.reapparait(x, y, j.membre);
    j.invulnerable = PROTECTION;
    j.delaiReapparition = 0;
  }

  /** Un joueur arrive : au salon, il joue ; en pleine manche, il regarde jusqu'à la suivante. */
  rejoint(j: Joueur): void {
    if (this.etape === 'salon') return;
    this.vies[j.siege] = 0;
    j.mort = true;
    j.delaiReapparition = 2;
  }

  /** Un joueur s'en va : il sort du classement. */
  retire(p: Partie, siege: number): void {
    if (this.enJeu && this.vies[siege]! > 0) {
      this.vies[siege] = 0;
      this.elimine(p, siege);
    }
  }

  /** Une vie de plus (un cœur, une cage), jusqu'au maximum. */
  gagneVie(siege: number): boolean {
    if (!this.enJeu || this.vies[siege]! >= VIES_ARENE_MAX) return false;
    this.vies[siege]++;
    return true;
  }

  /** « Suivant » : au salon, l'hôte lance la partie ; à la fin, une nouvelle manche. */
  suivant(p: Partie): void {
    if (this.etape === 'salon') {
      if (p.joueurs.filter((j) => j).length >= 1) this.demarre(p);
    } else if (this.etape === 'fin' && this.minuteur >= FIN_MIN) p.relanceArene();
  }

  /** Où réapparaître : une case libre dans la zone, la plus loin possible des autres joueurs (parmi quelques-unes tirées au sort). */
  pointLibre(p: Partie, siege: number): [number, number] {
    const autres = p.joueurs.filter((o) => o && !o.mort && o.siege !== siege);
    const liste = this.casesDans(p, this.zone);
    let meilleur = this.caseAuHasard(p, liste);
    let score = -1;
    for (let i = 0; i < 40; i++) {
      const c = this.caseAuHasard(p, liste);
      const d = autres.length ? Math.min(...autres.map((o) => Math.hypot(o!.cx - c[0], o!.cy - c[1]))) : 0;
      const s = d + p.rng.entre(0, 40);
      if (s > score) [score, meilleur] = [s, c];
    }
    return meilleur;
  }

  vue(): VueArene {
    return {
      etape: this.etape,
      minuteur: this.etape === 'combat' ? Math.floor(this.minuteur / TICKS_PAR_SECONDE) : this.minuteur,
      zone: [Math.round(this.zone[0]), Math.round(this.zone[1])],
      vies: [...this.vies],
      eliminations: [...this.eliminations],
      rangs: [...this.rangs],
      ennemis: this.regles.ennemis,
    };
  }

  /** Les cases où se tenir entre deux bords (en pixels) ; toutes, s'il n'y en a aucune. */
  private casesDans(p: Partie, [g, d]: [number, number]): number[] {
    const L = p.lu.largeur;
    const dans = this.cases.filter((k) => {
      const x = (k % L) * TUILE + TUILE / 2;
      return x >= g + TUILE && x <= d - TUILE;
    });
    return dans.length ? dans : this.cases;
  }

  /** Une case de la liste, au hasard : la position du héros, pieds sur le sol. */
  private caseAuHasard(p: Partie, liste: readonly number[]): [number, number] {
    const L = p.lu.largeur;
    const k = liste[p.rng.entier(0, liste.length - 1)]!;
    return [(k % L) * TUILE + (TUILE - HEROS_LARGEUR) / 2, Math.floor(k / L) * TUILE + TUILE - HEROS_HAUTEUR];
  }

  private elimine(p: Partie, siege: number): void {
    const enLice = p.joueurs.filter((j) => j && this.vies[j.siege]! > 0);
    this.rangs[siege] = enLice.length + 1;
    p.texte(p.joueurs[siege]?.cx ?? 0, (p.joueurs[siege]?.corps.y ?? 0) - 12, 'ÉLIMINÉ', '#ff5a5a');
    if (enLice.length > 1) return;
    if (enLice[0]) this.rangs[enLice[0].siege] = 1;
    this.etape = 'fin';
    this.minuteur = 0;
    p.son('victoire', 0, 0);
  }
}
