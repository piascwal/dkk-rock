import { MAX_JOUEURS, TICKS_PAR_SECONDE } from '../config';
import { C, EtatCommandes } from './commandes';
import { Pelouse, marqueVoiture } from './drift-pelouse';
import { Voiture } from './drift-voiture';
import type { EtapeDrift, VueDrift } from './vue';

/** Le pré du Clos, le niveau du concours de drift (indice dans NIVEAUX) : juste après le garage, avant la route des Alpes. */
export const NIVEAU_DRIFT = 11;
/** Les pilotes : Tom et sa Renault 11, Matt et son Opel Corsa (l'ordre est celui de `VueDrift.pilote`). */
export const PILOTES = ['Tom', 'Matt'] as const;

const SECONDE = TICKS_PAR_SECONDE;
const DUREE_COMPTE = 3 * SECONDE;
const DUREE_COURSE = 60 * SECONDE;
const DUREE_RESULTAT = 5 * SECONDE;
/** Le temps avant qu'un appui passe l'écran du score ou du podium : un doigt encore sur le gaz ne le saute pas. */
const ATTENTE_APPUI = SECONDE;

const VALIDE = C.SAUT | C.TIR;

/**
 * Le concours de drift du pré du Clos (un mini-jeu) : chaque joueur, à son tour, choisit son pilote puis a une minute pour
 * saccager le plus de pelouse possible. Le meilleur pourcentage gagne. Dans l'histoire, le podium passé, la tournée commence ;
 * lancé depuis le menu des mini-jeux, on rejoue.
 */
export class ConcoursDrift {
  etape: EtapeDrift = 'choix';
  /** les sièges qui conduisent, dans l'ordre ; `tour` : celui qui a le volant */
  tours: number[];
  tour = 0;
  pilote = 0;
  manche = 0;
  minuteur = 0;
  voiture = new Voiture();
  pelouse = new Pelouse();
  scores: ({ pilote: number; pourcent: number } | null)[] = Array(MAX_JOUEURS).fill(null);
  /** le podium est passé : la partie reprend son cours (dans l'histoire seulement) */
  fini = false;
  private readonly commandes = Array.from({ length: MAX_JOUEURS }, () => new EtatCommandes());

  constructor(
    sieges: readonly number[],
    readonly miniJeu: boolean,
  ) {
    this.tours = sieges.length ? [...sieges] : [0];
  }

  get siege(): number {
    return this.tours[this.tour]!;
  }

  /**
   * Un pas du concours. `bits` : les commandes de chaque siège ; `presents` : les sièges occupés (un joueur parti perd son
   * tour) ; `son` : un bruitage à jouer.
   */
  maj(bits: ArrayLike<number>, presents: readonly number[], son: (nom: string) => void): void {
    for (let s = 0; s < MAX_JOUEURS; s++) this.commandes[s]!.avance(bits[s] ?? 0);
    if (this.etape !== 'podium' && !presents.includes(this.siege)) {
      this.tourSuivant(presents);
      return;
    }
    const k = this.commandes[this.siege]!;
    if (this.minuteur > 0) this.minuteur--;
    switch (this.etape) {
      case 'choix':
        if (k.appuye(C.GAUCHE) || k.appuye(C.DROITE)) {
          this.pilote = 1 - this.pilote;
          son('rebond');
        }
        if (k.appuye(VALIDE)) this.depart(son);
        break;
      case 'compte':
        if (this.minuteur % SECONDE === 0 && this.minuteur > 0) son('alerte');
        if (this.minuteur === 0) {
          this.etape = 'course';
          this.minuteur = DUREE_COURSE;
          son('demarrage');
        }
        break;
      case 'course':
        this.roule(k, son);
        if (this.minuteur === 0) {
          this.etape = 'resultat';
          this.minuteur = DUREE_RESULTAT;
          this.voiture.griffe = 0;
          const avant = this.scores[this.siege];
          const pourcent = this.pelouse.pourcent;
          if (!avant || pourcent > avant.pourcent)
            this.scores[this.siege] = { pilote: this.pilote, pourcent };
          son('victoire');
        }
        break;
      case 'resultat':
        if (this.minuteur === 0 || (this.minuteur < DUREE_RESULTAT - ATTENTE_APPUI && k.appuye(VALIDE)))
          this.tourSuivant(presents);
        break;
      case 'podium':
        // au podium, n'importe quel joueur présent passe (ou relance)
        if (this.minuteur === 0 && presents.some((s) => this.commandes[s]!.appuye(VALIDE))) {
          if (this.miniJeu) this.recommence(presents);
          else this.fini = true;
        }
        break;
    }
  }

  /** Le pilote est choisi : une pelouse neuve, la voiture au bout du pré, et le compte à rebours. */
  private depart(son: (nom: string) => void): void {
    this.voiture = new Voiture();
    this.pelouse = new Pelouse();
    this.manche = (this.manche + 1) % 256;
    this.etape = 'compte';
    this.minuteur = DUREE_COMPTE;
    son('alerte');
  }

  /** La minute de course : le joueur conduit, les roues griffent la pelouse. */
  private roule(k: EtatCommandes, son: (nom: string) => void): void {
    const v = this.voiture;
    const avant = v.pose();
    v.avance({
      gaz: k.tenu(C.HAUT) || k.tenu(C.SAUT),
      frein: k.tenu(C.BAS),
      volant: k.horizontal,
    });
    marqueVoiture(this.pelouse, avant, v.pose(), v.griffe);
    if (v.griffe >= 2 && this.minuteur % 18 === 0) son('derapage');
    if (v.choc && v.vitesse > 3) son('chute');
  }

  /** Au suivant : un autre joueur choisit son pilote ; quand tout le monde a conduit, le podium. */
  private tourSuivant(presents: readonly number[]): void {
    do this.tour++;
    while (this.tour < this.tours.length && !presents.includes(this.siege));
    if (this.tour < this.tours.length) {
      this.etape = 'choix';
      this.minuteur = 0;
      return;
    }
    this.tour = Math.max(0, this.tours.length - 1);
    this.etape = 'podium';
    this.minuteur = ATTENTE_APPUI;
  }

  /** Un nouveau concours (mini-jeu) : les joueurs présents, dans l'ordre des sièges, et des scores remis à zéro. */
  private recommence(presents: readonly number[]): void {
    this.tours = presents.length ? [...presents] : [0];
    this.tour = 0;
    this.scores = Array(MAX_JOUEURS).fill(null);
    this.etape = 'choix';
    this.minuteur = 0;
  }

  vue(): VueDrift {
    const v = this.voiture;
    return {
      etape: this.etape,
      siege: this.siege,
      pilote: this.pilote,
      manche: this.manche,
      miniJeu: this.miniJeu,
      minuteur: this.minuteur,
      x: v.x,
      y: v.y,
      cap: v.cap,
      vitesse: v.vitesse,
      griffe: this.etape === 'course' ? v.griffe : 0,
      pourcent: this.pelouse.pourcent,
      scores: this.scores.map((s) => (s ? { ...s } : null)),
    };
  }
}
