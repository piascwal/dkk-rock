/**
 * Ce que l'on voit de la partie : la simulation (sur l'hôte) le produit à
 * chaque pas, le rendu le dessine et le réseau le transmet aux autres joueurs.
 * Le rendu ne touche jamais aux objets de la simulation : un client distant
 * n'a que cette vue.
 */

/** Les genres d'entités visibles (un genre = un dessin). */
export const G = {
  JBT: 0,
  JBM: 1,
  JBG: 2,
  MAT: 3,
  TOM: 4,
  KIWI: 5,
  /** le chauffage soufflant : l'arme qui accompagne le héros à la place de Fadatchi */
  CHAUFFAGE: 6,
  FETARD: 10,
  VIDEUR: 11,
  DANSEUR: 12,
  LANCEUR: 13,
  DRONE: 14,
  INFLUENCEUR: 15,
  YETI: 16,
  ROBOT: 17,
  YETI_ALPHA: 20,
  DJ: 21,
  ENCEINTE: 22,
  P_BAGUETTE: 30,
  P_ONDE: 31,
  P_ACCORD: 32,
  P_BASSE: 33,
  P_RIFF: 34,
  P_GROSSE_CAISSE: 35,
  P_LARSEN: 36,
  P_SOLO: 37,
  P_AMPLI: 38,
  P_VINYLE: 39,
  P_FLAMME: 40,
  P_CORNEMUSE: 41,
  P_GAZ: 42,
  P_TRIANGLE: 43,
  P_GONG: 44,
  P_OEUF: 45,
  P_JET_FLAMME: 46,
  P_NOTE: 50,
  P_DROP: 51,
  P_BOMBE: 52,
  P_BOULE_NEIGE: 53,
  P_LASER: 54,
  P_HYPNOSE: 55,
  P_GROSSE_BOULE: 56,
  P_ONDE_SOL: 57,
  CAGE: 60,
  DRAPEAU: 61,
  VAN: 62,
  ARME: 63,
  SOIN: 64,
  BLOC: 65,
  COEUR: 66,
  COEUR_OR: 67,
} as const;

export type Genre = (typeof G)[keyof typeof G];

/** États d'animation des héros (champ `e`). */
export const ANIM = {
  DEBOUT: 0,
  COURT: 1,
  SAUT: 2,
  ECHELLE: 3,
  TYROLIENNE: 4,
  MUR: 5,
  MORT: 6,
  ALERTE: 7,
  PERDU: 8,
  ETOURDI: 9,
  ATTAQUE: 10,
  /** un ennemi à terre : il reste sur la scène un moment, estompé (`f` : le temps qu'il lui reste, par demi-ticks) */
  TERRASSE: 11,
} as const;

export interface EntiteVue {
  id: number;
  g: Genre;
  /** centre bas de l'entité, en pixels du monde */
  x: number;
  y: number;
  /** regarde à gauche */
  gauche: boolean;
  /** clignote (invulnérable, sur le point d'exploser) */
  clignote: boolean;
  /** une forte aura autour du héros : il est invincible (le cœur d'or) */
  aura?: boolean;
  /** état d'animation, 0 à 15 */
  e: number;
  /** image ou variante, 0 à 255 (type d'arme, tuile d'un bloc, sens d'une tyrolienne...) */
  f: number;
}

export interface JoueurVue {
  present: boolean;
  membre: number;
  pv: number;
  speciaux: number;
  /** index de l'arme ramassée, 0 = l'instrument */
  arme: number;
  munitions: number;
  /** position, pour la caméra de chacun */
  x: number;
  y: number;
  mort: boolean;
}

/** `carte` : entre deux niveaux, le van roule sur la carte du monde (`page` compte alors les ticks du trajet). */
export type Phase = 'histoire' | 'jeu' | 'convertis' | 'bilan' | 'fin' | 'perdu' | 'carte';

export const PHASES: readonly Phase[] = ['histoire', 'jeu', 'bilan', 'fin', 'perdu', 'carte', 'convertis'];

/**
 * Les ennemis qu'on décompte dans l'écran des « convertis au rock » (fin de niveau) : l'ordre des compteurs de `EtatVue.convertis`.
 */
export const GENRES_CONVERTIS: readonly number[] = [
  G.FETARD,
  G.VIDEUR,
  G.DANSEUR,
  G.LANCEUR,
  G.DRONE,
  G.INFLUENCEUR,
  G.YETI,
  G.ROBOT,
  G.YETI_ALPHA,
  G.DJ,
];

/** Durée du trajet sur la carte du monde, en ticks (tient dans un octet : c'est `page`). */
export const DUREE_CARTE = 255;

export interface EtatVue {
  tick: number;
  phase: Phase;
  /** les ennemis « convertis au rock » depuis le début du niveau, par type (voir GENRES_CONVERTIS), 255 au plus chacun */
  convertis: number[];
  /** page de l'histoire en cours (intro, outro ou fin) */
  page: number;
  niveau: number;
  vies: number;
  score: number;
  /** vie du boss en 0..1, ou -1 sans boss */
  boss: number;
  /** secousse de l'écran, 0 à 255 */
  secousse: number;
  joueurs: JoueurVue[];
  entites: EntiteVue[];
}

/** Ce qui se passe une fois (son, explosion, texte flottant, dialogue) : envoyé de façon fiable. */
export type Evenement =
  | { k: 'son'; n: string; x: number; y: number }
  | { k: 'explo'; x: number; y: number; r: number }
  | { k: 'texte'; x: number; y: number; s: string; c: string }
  | { k: 'impact'; x: number; y: number; c: string }
  | { k: 'confettis'; x: number; y: number }
  | { k: 'bulle'; qui: string; texte: string }
  | { k: 'tuile'; x: number; y: number; t: number; avant: number };
