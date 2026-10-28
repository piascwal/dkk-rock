import {
  DELAI_REAPPARITION,
  HEROS_HAUTEUR,
  HEROS_LARGEUR,
  MAX_JOUEURS,
  TICKS_PAR_SECONDE,
  TUILE,
} from '../config';
import { HEROS } from '../entites/heros';
import type { Joueur } from '../entites/joueur';
import { Boss } from '../entites/ennemis/boss';
import { Ennemi } from '../entites/ennemis/ennemi';
import { Objet } from '../entites/objets';
import { T } from '../monde/tuiles';
import { parcoursAcces } from '../niveaux/accessibilite';
import type { NiveauLu } from '../niveaux/format';
import type { CacheCibles } from './cibles';
import type { IAArene, NiveauIA } from './arene-ia';
import type { Cible } from './contexte';
import type { Partie } from './partie';

/**
 * Le battle royale : jusqu'à 8 joueurs sur une petite carte faite pour ça (voir niveaux/arenes.ts, ou un niveau de l'éditeur),
 * 3 vies chacun, et les tirs des héros blessent les autres héros. On réapparaît loin des autres ; le dernier en lice gagne.
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
/** à la réapparition, quelques secondes sans dégâts */
const PROTECTION = 150;
/** on ne relance pas la manche d'un appui maladroit juste après la fin */
const FIN_MIN = 2 * TICKS_PAR_SECONDE;

export interface ReglesArene {
  /** les ennemis du niveau restent (sinon : seulement les joueurs, les caisses, les armes, les soins) */
  ennemis: boolean;
  /** le niveau des joueurs de l'ordinateur (hors ligne), moyen par défaut */
  niveauIA?: NiveauIA;
}

/** Le battle royale tel qu'on le voit (voir vue.ts : `EtatVue.arene`). */
export interface VueArene {
  etape: EtapeArene;
  /** compte à rebours et fin : les ticks écoulés dans l'étape ; combat : les secondes de combat */
  minuteur: number;
  /** par siège : les vies qui restent, les éliminations faites, le rang final (1 : vainqueur ; 0 : encore en lice) */
  vies: number[];
  eliminations: number[];
  rangs: number[];
  ennemis: boolean;
}

/**
 * Combien de joueurs pour cette carte : la surface où l'on peut se tenir, en cases, donne une fourchette (2 à 8). Une arène du
 * jeu (72 × 36, plusieurs étages) en a 240 à 460 : de quoi être 2 à 4 au moins, 7 ou 8 au plus.
 */
export function joueursConseilles(lu: NiveauLu): [number, number] {
  const n = parcoursAcces(lu).dist.reduce((s, d) => s + (d >= 0 ? 1 : 0), 0);
  const max = Math.max(2, Math.min(MAX_JOUEURS, Math.floor(n / 30)));
  const min = Math.max(2, Math.min(max, Math.round(n / 110)));
  return [min, max];
}

export class Arene {
  etape: EtapeArene;
  minuteur = 0;
  readonly vies = new Array<number>(MAX_JOUEURS).fill(0);
  readonly eliminations = new Array<number>(MAX_JOUEURS).fill(0);
  readonly rangs = new Array<number>(MAX_JOUEURS).fill(0);
  /** les cases où l'on peut se tenir (y × largeur + x) : là où l'on réapparaît */
  private cases: number[] = [];
  /** les départs placés dans la carte, par siège (case y × largeur + x ; -1 : aucun) : on y commence, et on y réapparaît */
  private departs: number[] = [];
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
    // les départs de l'éditeur : seulement ceux qui sont dans la carte, sur une case où l'on tient debout
    const L = p.lu.largeur;
    this.departs = Array.from({ length: MAX_JOUEURS }, (_, s) => {
      const d = p.lu.def.departs?.[s];
      if (!d || d[0] < 1 || d[1] < 1 || d[0] >= L || d[1] >= p.lu.hauteur) return -1;
      return p.carte.solide(d[0], d[1]) || p.carte.solide(d[0], d[1] - 1) ? -1 : d[1] * L + d[0];
    });
    this.cibles.clear();
  }

  /** Le début d'une manche : chacun a ses vies et sa place, loin des autres, puis le compte à rebours. */
  demarre(p: Partie): void {
    const joueurs = p.joueurs.filter((j): j is Joueur => !!j);
    this.vies.fill(0);
    this.eliminations.fill(0);
    this.rangs.fill(0);
    // chacun tire son personnage au hasard à chaque manche (sans doublon tant qu'il y en a), et le garde jusqu'à la suivante
    const membres = HEROS.map((_, i) => i);
    for (let i = membres.length - 1; i > 0; i--) {
      const k = Math.floor(p.rng.suivant() * (i + 1));
      [membres[i], membres[k]] = [membres[k]!, membres[i]!];
    }
    joueurs.forEach((j, i) => (j.membre = membres[i % membres.length]!));
    for (const j of joueurs) {
      this.vies[j.siege] = VIES_ARENE;
      // chacun sur son départ, s'il est placé ; sinon loin des autres
      const k = this.departs[j.siege] ?? -1;
      const [x, y] = k >= 0 ? this.position(p, k) : this.pointLibre(p, j.siege);
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
  }

  /** Un héros vient de tomber : une vie de moins (en combat), le tueur compte une élimination ; il revient, ou il est éliminé. */
  mort(p: Partie, j: Joueur): void {
    if (j.delaiReapparition === 0) {
      j.delaiReapparition = DELAI_REAPPARITION;
      if (!this.enJeu) return;
      const tueur = p.joueurs.find((o) => o && o.id === j.dernierTireur && o !== j);
      if (tueur) this.eliminations[tueur.siege]++;
      p.evenement({ k: 'elim', tueur: tueur ? tueur.siege : -1, victime: j.siege });
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

  /**
   * Où réapparaître : la plus loin possible des autres joueurs, parmi les départs placés dans la carte (s'il y en a au moins
   * deux), sinon parmi quelques cases libres tirées au sort.
   */
  pointLibre(p: Partie, siege: number): [number, number] {
    const autres = p.joueurs.filter((o) => o && !o.mort && o.siege !== siege);
    const departs = this.departs.filter((k) => k >= 0);
    const liste = departs.length >= 2 ? departs : this.cases;
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
      vies: [...this.vies],
      eliminations: [...this.eliminations],
      rangs: [...this.rangs],
      ennemis: this.regles.ennemis,
    };
  }

  /** Une case où se tenir, au hasard : la position du héros, pieds sur le sol (l'IA y erre quand elle tourne en rond). */
  caseQuelconque(p: Partie): [number, number] {
    return this.caseAuHasard(p, this.cases);
  }

  /** Une case de la liste, au hasard : la position du héros, pieds sur le sol. */
  private caseAuHasard(p: Partie, liste: readonly number[]): [number, number] {
    return this.position(p, liste[p.rng.entier(0, liste.length - 1)]!);
  }

  /** La position du héros sur une case (y × largeur + x), pieds sur le sol. */
  private position(p: Partie, k: number): [number, number] {
    const L = p.lu.largeur;
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
