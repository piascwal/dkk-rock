/** Les étapes du rêve de JBT (`VueReve.etape`) : le décollage, le vol, la lune, le réveil en sursaut, le score, le podium. */
export const ETAPES_REVE = ['decollage', 'vol', 'lune', 'reveil', 'resultat', 'podium'] as const;
export type EtapeReve = (typeof ETAPES_REVE)[number];

/** Combien des dernières piles ramassées la vue garde (l'écran les efface du ciel). */
export const PILES_RECENTES = 48;

/** Le rêve de JBT tel qu'on le voit (voir jeu/reve.ts ; le ciel, ses obstacles et ses piles viennent de `parcours(manche)`). */
export interface VueReve {
  etape: EtapeReve;
  /** le siège du joueur qui vole */
  siege: number;
  /** le numéro du vol : il fixe le parcours */
  manche: number;
  miniJeu: boolean;
  minuteur: number;
  /** la distance parcourue (pixels du jeu) : JBT y est, le ciel et ses obstacles en découlent */
  distance: number;
  /** JBT : sa hauteur (pixels, vers le bas), sa vitesse verticale, s'il pousse vers le haut, s'il est planté dans la lune */
  y: number;
  vy: number;
  pousse: boolean;
  plante: boolean;
  /** les vies qui restent (3 au départ), les ticks d'invulnérabilité après un choc */
  vies: number;
  invulnerable: number;
  /** les piles ramassées (une pile en or en vaut dix), et les indices des dernières (voir PILES_RECENTES) */
  piles: number;
  collectees: number[];
  score: number;
  /** le meilleur score de chaque siège, ou null s'il n'a pas encore volé */
  scores: (number | null)[];
}
