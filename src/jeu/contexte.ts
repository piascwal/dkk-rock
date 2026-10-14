import type { Aleatoire } from '../moteur/maths';
import type { Carte } from '../monde/carte';
import type { EntiteVue, Evenement } from './vue';

/** Le camp d'un tir ou d'une explosion : on ne blesse pas les siens (sauf `tous`, les caissons). */
export type Camp = 'heros' | 'ennemis' | 'tous';

/** Une cible que l'on peut toucher : héros, ennemi, boss, cage... */
export interface Cible {
  readonly id: number;
  /** boîte de collision */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly camp: Camp;
  vivant(): boolean;
  /** accroché à une échelle : en train de monter ou descendre, on ne le vise pas */
  readonly surEchelle?: boolean;
  /** `dx` : sens d'où vient le coup (-1, 0 ou 1), pour le recul */
  blesse(degats: number, ctx: Contexte, dx: number, explosion: boolean): void;
  /** effets des tirs ennemis particuliers (hypnose du DJ, flash des influenceurs) */
  subitEffet?(effet: 'hypnose' | 'eblouit'): void;
}

/**
 * Ce que la partie offre aux entités pendant leur mise à jour. Une interface
 * plutôt que la classe Partie : les entités ne dépendent pas de la partie.
 */
export interface Tyrolienne {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Contexte {
  readonly carte: Carte;
  readonly tyroliennes: readonly Tyrolienne[];
  readonly tick: number;
  readonly rng: Aleatoire;
  /** vrai au premier tick de chaque temps (BPM) */
  readonly surLeTemps: boolean;
  readonly numeroTemps: number;
  prochainId(): number;
  ajoute(e: EntiteSimulee): void;
  /** les héros vivants */
  heros(): readonly Cible[];
  /** toutes les cibles d'un camp donné (pour viser, ou pour blesser) */
  cibles(camp: Camp): readonly Cible[];
  explosion(x: number, y: number, rayon: number, degats: number, camp: Camp): void;
  evenement(e: Evenement): void;
  son(nom: string, x: number, y: number): void;
  texte(x: number, y: number, s: string, couleur?: string): void;
  secoue(force: number): void;
  /** un ennemi vaincu : score et confettis */
  ennemiVaincu(x: number, y: number, points: number): void;
}

/** Une entité de la simulation : elle se met à jour puis se décrit pour la vue. */
export interface EntiteSimulee {
  readonly id: number;
  fini: boolean;
  maj(ctx: Contexte): void;
  vue(): EntiteVue | null;
}
