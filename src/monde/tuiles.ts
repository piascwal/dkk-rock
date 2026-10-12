/**
 * Les types de tuiles du monde. Tout est destructible sauf le socle : chaque
 * tuile a des points de vie, et certaines tombent quand on leur retire le sol
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
};

const PAR_CARACTERE = new Map<string, Tuile>(
  (Object.keys(PROPRIETES).map(Number) as Tuile[]).map((t) => [PROPRIETES[t].car, t]),
);

/** La tuile d'un caractère de carte, ou null si le caractère désigne autre chose (entité, repère). */
export const tuileDuCaractere = (c: string): Tuile | null => PAR_CARACTERE.get(c) ?? null;

export const proprietes = (t: number): ProprietesTuile => PROPRIETES[t as Tuile] ?? PROPRIETES[T.VIDE];

export const NB_TUILES = Object.keys(PROPRIETES).length;
