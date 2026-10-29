/**
 * Les types de tuiles du monde. Tout est destructible sauf le socle, les échelons et les pitons (de quoi sauter de
 * bloc en bloc quand on a tout détruit autour) : chaque tuile a des points de vie, et certaines tombent quand on leur retire le sol
 * (caisses, sable, neige tassée) ou explosent (caissons de basses).
 */

export const T = {
  VIDE: 0,
  TERRE: 1,
  ROCHE: 2,
  BRIQUE: 3,
  METAL: 4,
  SOCLE: 5,
  NEIGE: 6,
  GLACE: 7,
  BOIS: 8,
  PLATEFORME: 9,
  ECHELLE: 10,
  CAISSE: 11,
  CAISSON: 12,
  SABLE: 13,
  VITRE: 14,
  BETON: 15,
  ECHELON: 16,
  PITON: 17,
  TONNEAU_WOG: 18,
  TONNEAU_OR: 19,
  // 20 : l'ancien bidon d'essence, retiré (le baril explosif est un objet) ; le numéro reste libre
  /** la matière des parcs du FISE : un revêtement noir mat, fait exprès pour rouler (rampes, curbs, funbox) */
  PARC: 21,
  /** le plateau rose des modules du parc (box jump, spine, haut des quarters) */
  PLATEAU: 22,
  /** le contreplaqué lisse des rampes de bois du FISE (half-pipe, spine) */
  RAMPE: 23,
  /** le caisson de basses à LED violette (les soirées du FISE) : il explose comme le bleu, en plus gros et moins méchant */
  CAISSON_ROSE: 24,
  /** la barrière du boss : indestructible, elle s'ouvre à la mort du boss (voir jeu/chargement.ts : ouvreBarrieres) */
  BARRIERE: 25,
  /** la pierre calcaire de Provence (moellons) : les maisons de Saint-Cézaire, les restanques, les remparts, le pont des Tuves */
  PIERRE: 26,
  /** les tuiles canal des toits provençaux */
  TOIT: 27,
  /** l'eau de la Siagne : on la traverse, les pieds dedans (elle ralentit), on voit le fond à travers */
  EAU: 28,
  /** la boue du lit de la rivière, sous les figuiers */
  BOUE: 29,
  /** la pierre de taille : de gros blocs de granit, cinq fois plus durs que la pierre ; on fait le tour plutôt que de les casser */
  GRANIT: 30,
  /** le tissu (rideaux, bâches, voiles) : des tuiles qui se joignent, et le bord ondule quand rien ne les continue */
  TISSU: 31,
  /** la toile blanche des voiles de bateau : même tissage et mêmes bords qui ondulent que le tissu */
  TISSU_BLANC: 32,
} as const;

export type Tuile = (typeof T)[keyof typeof T];

export interface ProprietesTuile {
  nom: string;
  /** caractère dans les cartes ASCII des niveaux */
  car: string;
  /** points de vie ; Infinity = indestructible */
  pv: number;
  /** bloque les déplacements */
  solide: boolean;
  /** ne bloque que par le dessus (on saute à travers, on descend avec bas + saut) */
  traversable: boolean;
  echelle: boolean;
  /** tombe quand la tuile du dessous disparaît */
  tombe: boolean;
  /** explose quand elle est détruite */
  explose: boolean;
  /** sol glissant */
  glisse: boolean;
  /** couleur des débris */
  debris: string;
}

const base = (p: Partial<ProprietesTuile> & Pick<ProprietesTuile, 'nom' | 'car' | 'pv' | 'debris'>) => ({
  solide: true,
  traversable: false,
  echelle: false,
  tombe: false,
  explose: false,
  glisse: false,
  ...p,
});

export const PROPRIETES: Record<Tuile, ProprietesTuile> = {
  [T.VIDE]: base({ nom: 'vide', car: ' ', pv: 0, solide: false, debris: '#000' }),
  [T.TERRE]: base({ nom: 'terre', car: '#', pv: 3, debris: '#7a4a2a' }),
  [T.ROCHE]: base({ nom: 'roche', car: 'R', pv: 8, debris: '#6d6d78' }),
  [T.BRIQUE]: base({ nom: 'brique', car: 'B', pv: 5, debris: '#9c3b2e' }),
  [T.METAL]: base({ nom: 'métal', car: 'M', pv: 24, debris: '#8a96a3' }),
  [T.SOCLE]: base({ nom: 'socle', car: 'X', pv: Infinity, debris: '#222' }),
  [T.NEIGE]: base({ nom: 'neige', car: 'N', pv: 2, debris: '#eef6ff', tombe: true }),
  [T.GLACE]: base({ nom: 'glace', car: 'G', pv: 3, debris: '#9fd8f0', glisse: true }),
  [T.BOIS]: base({ nom: 'bois', car: 'W', pv: 3, debris: '#a8743a' }),
  [T.PLATEFORME]: base({ nom: 'plateforme', car: '-', pv: 2, traversable: true, debris: '#a8743a' }),
  [T.ECHELLE]: base({ nom: 'échelle', car: 'H', pv: 1, solide: false, echelle: true, debris: '#c49a5a' }),
  [T.CAISSE]: base({ nom: 'caisse', car: 'C', pv: 2, tombe: true, debris: '#b07d3c' }),
  [T.CAISSON]: base({ nom: 'caisson de basses', car: 'T', pv: 2, explose: true, debris: '#333' }),
  [T.SABLE]: base({ nom: 'sable', car: 'S', pv: 1, tombe: true, debris: '#e8cf8a' }),
  [T.VITRE]: base({ nom: 'vitre', car: 'V', pv: 1, debris: '#bfe9ff' }),
  [T.BETON]: base({ nom: 'béton', car: 'D', pv: 6, debris: '#9a9a92' }),
  // un barreau d'échelle scellé : on y monte comme à une échelle, et il reste quand le reste a sauté
  [T.ECHELON]: base({
    nom: 'échelon',
    car: 'E',
    pv: Infinity,
    traversable: true,
    echelle: true,
    debris: '#8a96a3',
  }),
  // une plateforme scellée au mur, incassable : le pas d'un chemin qu'on ne doit pas pouvoir couper
  [T.PITON]: base({ nom: 'piton', car: '=', pv: Infinity, traversable: true, debris: '#8a96a3' }),
  // les tonneaux WOG, la passion magique des DKK : en les cassant, on libère un cœur (une vie) ou un cœur d'or (tout
  // revient, et dix secondes d'invincibilité)
  [T.TONNEAU_WOG]: base({ nom: 'tonneau WOG', car: 'O', pv: 3, tombe: true, debris: '#7a4a22' }),
  [T.TONNEAU_OR]: base({ nom: 'tonneau d’or WOG', car: 'Q', pv: 6, tombe: true, debris: '#ffd23f' }),
  [T.PARC]: base({ nom: 'revêtement de parc', car: 'L', pv: 6, debris: '#3a3a40' }),
  [T.PLATEAU]: base({ nom: 'plateau de module', car: 'U', pv: 6, debris: '#e8607a' }),
  [T.RAMPE]: base({ nom: 'rampe de bois', car: 'A', pv: 4, debris: '#d8a868' }),
  [T.CAISSON_ROSE]: base({
    nom: 'caisson de basses violet',
    car: 'I',
    pv: 2,
    explose: true,
    debris: '#7a2a8a',
  }),
  [T.BARRIERE]: base({ nom: 'barrière du boss', car: '|', pv: Infinity, debris: '#ff4fd8' }),
  [T.PIERRE]: base({ nom: 'pierre', car: '{', pv: 6, debris: '#c8b896' }),
  [T.TOIT]: base({ nom: 'toit de tuiles', car: '^', pv: 3, debris: '#b8492e' }),
  [T.EAU]: base({ nom: 'eau', car: '~', pv: Infinity, solide: false, debris: '#6ab8d8' }),
  [T.BOUE]: base({ nom: 'boue', car: ';', pv: 2, debris: '#5a4028' }),
  [T.GRANIT]: base({ nom: 'pierre de taille', car: '[', pv: 30, debris: '#7a7a86' }),
  [T.TISSU]: base({ nom: 'tissu', car: '/', pv: 2, debris: '#8a4b3c' }),
  [T.TISSU_BLANC]: base({ nom: 'tissu blanc (voile)', car: '\\', pv: 2, debris: '#f2f0ea' }),
};

const PAR_CARACTERE = new Map<string, Tuile>(
  (Object.keys(PROPRIETES).map(Number) as Tuile[]).map((t) => [PROPRIETES[t].car, t]),
);

/** La tuile d'un caractère de carte, ou null si le caractère désigne autre chose (entité, repère). */
export const tuileDuCaractere = (c: string): Tuile | null => PAR_CARACTERE.get(c) ?? null;

export const proprietes = (t: number): ProprietesTuile => PROPRIETES[t as Tuile] ?? PROPRIETES[T.VIDE];

/** Un de plus que le plus grand numéro de tuile (le numéro 20, retiré, laisse un trou). */
export const NB_TUILES = Math.max(...Object.keys(PROPRIETES).map(Number)) + 1;

/** Les tuiles qui ne remplissent pas leur case : on voit le mur de fond (ou le décor) derrière elles. */
export const TUILES_LEGERES: ReadonlySet<number> = new Set<number>([
  T.ECHELLE,
  T.ECHELON,
  T.PLATEFORME,
  T.PITON,
  T.TONNEAU_WOG,
  T.TONNEAU_OR,
  T.EAU,
]);
