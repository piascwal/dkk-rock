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
  /** le Champion du FISE : le boss de la finale à Montpellier */
  CHAMPION: 7,
  /** le b-boy de la scène de breaking du FISE : il fonce en coupole sur le héros */
  BREAKER: 8,
  /** le combattant du « Viet Cong glaireux », dans la boue des figuiers de la Siagne : il lance des figues */
  GLAIREUX: 9,
  FETARD: 10,
  VIDEUR: 11,
  DANSEUR: 12,
  LANCEUR: 13,
  DRONE: 14,
  INFLUENCEUR: 15,
  YETI: 16,
  ROBOT: 17,
  /** les riders du FISE : le skateur et le roller */
  SKATEUR: 18,
  ROLLER: 19,
  YETI_ALPHA: 20,
  DJ: 21,
  ENCEINTE: 22,
  /** le baril explosif (garage, ville) : il clignote deux secondes après le premier coup, puis explose */
  BARIL: 23,
  /** le goéland (arc breton) : il plane, puis pique sur le héros ; remplace le drone dans ce seul arc */
  GOELAND: 24,
  /** la bigoudène (arc breton) : elle joue son instrument (cornemuse, harpe) en airs de trois notes */
  BIGOUDEN: 25,
  /** le marin (arc breton) : il fonce sur le héros et le frappe de son instrument (accordéon, clarinette) */
  MARIN: 26,
  /** les riders du FISE : la trottinette, le gamin en BMX, et le pro du BMX (il saute sur le héros en figure) */
  TROTTINETTE: 27,
  BMX: 28,
  BMX_PRO: 29,
  P_BAGUETTE: 30,
  P_ONDE: 31,
  P_ACCORD: 32,
  P_BASSE: 33,
  P_RIFF: 34,
  P_GROSSE_CAISSE: 35,
  P_LARSEN: 36,
  P_SOLO: 37,
  P_AMPLI: 38,
  P_BOITIER: 39,
  P_FLAMME: 40,
  P_CORNEMUSE: 41,
  P_GAZ: 42,
  P_TRIANGLE: 43,
  P_GONG: 44,
  P_OEUF: 45,
  P_JET_FLAMME: 46,
  P_MINIDISC: 59,
  P_PILE: 47,
  P_FLIPPER: 48,
  P_FRISBEE: 49,
  P_NOTE: 50,
  P_DROP: 51,
  P_BOMBE: 52,
  P_BOULE_NEIGE: 53,
  P_LASER: 54,
  P_HYPNOSE: 55,
  P_GROSSE_BOULE: 56,
  P_ONDE_SOL: 57,
  P_DONUT: 58,
  CAGE: 60,
  DRAPEAU: 61,
  VAN: 62,
  ARME: 63,
  SOIN: 64,
  BLOC: 65,
  COEUR: 66,
  COEUR_OR: 67,
  /** le van à réacteur : celui des niveaux qui finissent au sommet, d’où il décolle */
  VAN_REACTEUR: 68,
  /** la figue du Viet Cong glaireux : un tir, hors de la plage des tirs (pleine) ; voir `estUnTir` */
  P_FIGUE: 69,
} as const;

export type Genre = (typeof G)[keyof typeof G];

/** Un tir (les instruments et les tirs ennemis) : la plage des tirs, plus ceux venus après qu'elle fut pleine (la figue). */
export const estUnTir = (g: number): boolean => (g >= G.P_BAGUETTE && g < G.CAGE) || g === G.P_FIGUE;

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
  /** barre de vie d'un ennemi, de 1 à 255 (0 ou absent : pas de barre) */
  vie?: number;
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
export type Phase = 'histoire' | 'jeu' | 'convertis' | 'bilan' | 'fin' | 'perdu' | 'carte' | 'drift';

export const PHASES: readonly Phase[] = [
  'histoire',
  'jeu',
  'bilan',
  'fin',
  'perdu',
  'carte',
  'convertis',
  'drift',
];

/** Les étapes du concours de drift (`VueDrift.etape`) : le choix du pilote, le compte à rebours, la minute, le score, le podium. */
export const ETAPES_DRIFT = ['choix', 'compte', 'course', 'resultat', 'podium'] as const;
export type EtapeDrift = (typeof ETAPES_DRIFT)[number];

/** Le concours de drift du pré du Clos, tel qu'on le voit (voir jeu/drift.ts). */
export interface VueDrift {
  etape: EtapeDrift;
  /** le siège du joueur qui conduit (ou qui choisit son pilote) */
  siege: number;
  /** son pilote : 0 Tom (la Renault 11), 1 Matt (l'Opel Corsa) */
  pilote: number;
  /** le numéro du tour : il change à chaque nouvelle minute (le rendu repart alors d'une pelouse neuve) */
  manche: number;
  /** lancé depuis le menu des mini-jeux (on rejoue) plutôt que dans l'histoire (on repart en tournée) */
  miniJeu: boolean;
  /** les ticks qui restent à l'étape (compte à rebours, minute de course, écran du score) */
  minuteur: number;
  /** la voiture : son centre en mètres, son cap en radians, sa vitesse en m/s, ce que ses roues font à la pelouse (0 à 3) */
  x: number;
  y: number;
  cap: number;
  vitesse: number;
  griffe: number;
  /** la part du pré saccagée pendant ce tour, de 0 à 100 */
  pourcent: number;
  /** le score de chaque siège (pilote et pourcentage), ou null s'il n'a pas encore conduit */
  scores: ({ pilote: number; pourcent: number } | null)[];
}

/**
 * Les ennemis qu'on décompte dans l'écran des « convertis au rock » (fin de niveau) : l'ordre des compteurs de `EtatVue.convertis`.
 */
export const GENRES_CONVERTIS: readonly number[] = [
  G.FETARD,
  G.VIDEUR,
  G.DANSEUR,
  G.LANCEUR,
  G.DRONE,
  G.GOELAND,
  G.BIGOUDEN,
  G.MARIN,
  G.SKATEUR,
  G.ROLLER,
  G.TROTTINETTE,
  G.BMX,
  G.BMX_PRO,
  G.BREAKER,
  G.GLAIREUX,
  G.INFLUENCEUR,
  G.YETI,
  G.ROBOT,
  G.YETI_ALPHA,
  G.CHAMPION,
  G.DJ,
];

/** Les ennemis qui volent : un drone ou un goéland tombé n'est pas un rocker, il tombe comme un oiseau. */
export const VOLANTS: ReadonlySet<number> = new Set([G.DRONE, G.GOELAND]);

/** Durée du trajet sur la carte du monde, en ticks (tient dans un octet : c'est `page`). */
export const DUREE_CARTE = 255;

export interface EtatVue {
  tick: number;
  phase: Phase;
  /** les ennemis « convertis au rock » depuis le début du niveau, par type (voir GENRES_CONVERTIS), 255 au plus chacun */
  convertis: number[];
  /** le temps de la run (le niveau, depuis son début), en secondes : l'écran de fin de niveau l'affiche */
  temps: number;
  /** page de l'histoire en cours (intro, outro ou fin) */
  page: number;
  niveau: number;
  vies: number;
  score: number;
  /** vie du boss en 0..1, ou -1 sans boss */
  boss: number;
  /** secousse de l'écran, 0 à 255 */
  secousse: number;
  /** la traversée en ferry : le chemin parcouru par le ferry (le fond défile d'autant), ou -1 hors traversée */
  traversee: number;
  /** l'étape de la traversée et son avancement, sur un octet (voir `codeEtape` dans jeu/traversee.ts) ; 0 hors traversée */
  navire: number;
  joueurs: JoueurVue[];
  entites: EntiteVue[];
  /** le concours de drift, pendant la phase `drift` */
  drift?: VueDrift;
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
