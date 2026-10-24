/**
 * Le Grand Prix de la Sarré tel qu'on le voit (voir jeu/kart.ts) : les étapes, les voitures, ce qui traîne sur la piste.
 * - `choix` : chaque joueur choisit son pilote (et donc sa voiture) ;
 * - `depart` : le compte à rebours, les voitures sur la grille ;
 * - `course` : la course (seul : trois tours contre l'ordinateur ; à plusieurs : des manches, qui sort de l'écran perd) ;
 * - `manche` : à plusieurs, une manche vient d'être gagnée ; `arrivee` : seul, on a passé la ligne pour la dernière fois ;
 * - `podium`.
 */
export const ETAPES_KART = ['choix', 'depart', 'course', 'manche', 'arrivee', 'podium'] as const;
export type EtapeKart = (typeof ETAPES_KART)[number];

/** Les effets d'une voiture, en bits. */
export const EFFETS_KART = {
  turbo: 1,
  ecrase: 2,
  glisse: 4,
  saut: 8,
  bouclier: 16,
  elimine: 32,
  arrive: 64,
} as const;

export interface VoitureVue {
  pilote: number;
  /** le siège du joueur qui la conduit, -1 : l'ordinateur */
  siege: number;
  x: number;
  y: number;
  a: number;
  /** le bonus en réserve (indice dans BONUS_KART), -1 : aucun */
  bonus: number;
  effets: number;
  /** le tour en cours (1 à 3), la place (1 : en tête) */
  tour: number;
  place: number;
  /** les points (à plusieurs) */
  points: number;
}

export interface VueKart {
  etape: EtapeKart;
  minuteur: number;
  /** les ticks depuis le départ (le chrono) */
  temps: number;
  miniJeu: boolean;
  /** à plusieurs : la règle de l'écran plutôt que la course */
  multi: boolean;
  /** la caméra (le centre de l'écran, en pixels du monde) */
  camX: number;
  camY: number;
  voitures: VoitureVue[];
  /** le choix des pilotes : un par joueur */
  choix: { siege: number; pilote: number; valide: boolean }[];
  flaques: { x: number; y: number }[];
  /** les caisses de bonus présentes (un bit par caisse, voir CAISSES) */
  caisses: number;
  /** à plusieurs : le gagnant de la dernière manche (indice de voiture), -1 */
  gagnant: number;
  /** le temps d'arrivée de chaque voiture (ticks), -1 : pas encore */
  arrivees: number[];
  /** le classement final (indices de voitures), au podium */
  classement: number[];
}

/** Combien de flaques d'huile la vue garde (les plus récentes). */
export const FLAQUES_MAX = 6;
