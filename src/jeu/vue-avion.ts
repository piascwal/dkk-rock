/** Les étapes de l'avion de JBG (`VueAvion.etape`) : l'arrivée, la course, l'embarquement ou l'avion qui part, le score, le podium. */
export const ETAPES_AVION = ['intro', 'course', 'embarque', 'rate', 'resultat', 'podium'] as const;
export type EtapeAvion = (typeof ETAPES_AVION)[number];

/** Combien des derniers objets pris ou cassés la vue garde (l'écran les efface du tarmac). */
export const OBJETS_RECENTS = 48;

/** L'avion de JBG tel qu'on le voit (voir jeu/avion.ts ; le tarmac vient de `parcours(manche)`, l'avion de `xAvion(temps)`). */
export interface VueAvion {
  etape: EtapeAvion;
  siege: number;
  /** le numéro de la course : il fixe le tarmac */
  manche: number;
  miniJeu: boolean;
  minuteur: number;
  /** les ticks depuis le départ de la course (l'avion roule d'après eux) */
  temps: number;
  /** JBG : la distance courue, sa voie (visée, et où il en est entre deux voies), sa hauteur de saut, s'il est sur un tapis */
  x: number;
  voie: number;
  voieVue: number;
  z: number;
  surTapis: boolean;
  /** les ticks qui lui restent à trébucher, à être intouchable */
  trebuche: number;
  invulnerable: number;
  /** le bonus en cours (indice dans BONUS, -1 : aucun) et ce qui lui reste (ticks) */
  bonus: number;
  bonusReste: number;
  /** les cartes d'embarquement ramassées, les chutes */
  cartes: number;
  chutes: number;
  embarque: boolean;
  score: number;
  /** les indices des derniers objets pris ou cassés (voir OBJETS_RECENTS) */
  consommes: number[];
  scores: (number | null)[];
}

/** Ce qu'il faut du concours (jeu/avion.ts) pour en faire la vue. */
type SourceVue = Omit<VueAvion, 'surTapis' | 'consommes' | 'scores'> & {
  tapis: number;
  consommes: readonly number[];
  scores: readonly (number | null)[];
};

/** La vue d'un concours : une copie de son état, que l'écran (et le réseau) peut garder sans risque. */
export function vueDuConcours(c: SourceVue): VueAvion {
  return {
    etape: c.etape,
    siege: c.siege,
    manche: c.manche,
    miniJeu: c.miniJeu,
    minuteur: c.minuteur,
    temps: c.temps,
    x: c.x,
    voie: c.voie,
    voieVue: c.voieVue,
    z: c.z,
    surTapis: c.tapis >= 0,
    trebuche: c.trebuche,
    invulnerable: c.invulnerable,
    bonus: c.bonus,
    bonusReste: c.bonusReste,
    cartes: c.cartes,
    chutes: c.chutes,
    embarque: c.embarque,
    score: c.score,
    consommes: [...c.consommes],
    scores: [...c.scores],
  };
}
