import { TICKS_PAR_SECONDE } from '../config';
import { BONUS } from './avion-parcours';

/** Les règles de l'avion de JBG (voir avion.ts) : les durées, les vitesses, l'avion qui roule, les sauts, les bonus, les points. */

export const SECONDE = TICKS_PAR_SECONDE;
export const DT = 1 / SECONDE;
export const DUREE_INTRO = Math.round(2.5 * SECONDE);
export const DUREE_FIN = Math.round(3 * SECONDE);
/**
 * L'embarquement réussi : JBG grimpe à l'échelle (GRIMPE), l'échelle remonte, puis l'avion accélère, cabre et s'envole ; le tout
 * dure DUREE_EMBARQUE.
 */
export const GRIMPE = Math.round(1.6 * SECONDE);
export const DUREE_EMBARQUE = Math.round(5.5 * SECONDE);
const AVANT_ENVOL = GRIMPE + Math.round(0.4 * SECONDE);
/** Depuis combien de temps l'avion a quitté le sol après l'embarquement (en « secondes de décollage », négatif avant). */
export const envolApresEmbarquement = (minuteur: number): number =>
  ((DUREE_EMBARQUE - minuteur - AVANT_ENVOL) / SECONDE) * 1.2;
/** Le tick (valeur du minuteur) où les moteurs rugissent : l'avion part. */
export const MINUTEUR_ENVOL = DUREE_EMBARQUE - AVANT_ENVOL;
export const DUREE_RESULTAT = 6 * SECONDE;
export const ATTENTE_APPUI = SECONDE;

/**
 * L'avion roule : il part avec DEPART_AVION pixels d'avance, à V0 px/s, et accélère de A px/s² ; il décolle au bout de
 * DECOLLAGE secondes. JBG court à VITESSE (TROTTINETTE avec la trottinette) : sans un faux pas, il le rattrape vers 31 s ;
 * chaque chute lui coûte une centaine de pixels ; au-delà de quatre ou cinq, l'avion est parti.
 */
export const DEPART_AVION = 1600;
export const V0 = 100;
export const A = 1.2;
export const DECOLLAGE = 62;
export const VITESSE = 170;
export const TROTTINETTE = 250;
export const LENT = 40;
/** L'échelle de la porte arrière est à portée (pixels) : il faut être sur la voie du haut, et sauter. */
export const PORTEE = 28;
export const TREBUCHE = Math.round(0.8 * SECONDE);
export const INTOUCHABLE = Math.round(1.3 * SECONDE);
/** Les sauts : ordinaire, et avec les baskets à ressorts ; la pesanteur. */
export const SAUT = 150;
export const SAUT_RESSORTS = 215;
export const PESANTEUR = 560;
/**
 * La tolérance des chocs : un obstacle frôlé de TOLERANCE pixels ne compte pas ; on passe au-dessus d'un obstacle bas à HAUT_BAS
 * pixels de haut (presque tout le saut), au-dessus de tout le reste avec les ressorts à HAUT_RESSORTS.
 */
export const TOLERANCE = 3;
export const HAUT_BAS = 4;
export const HAUT_RESSORTS = 18;
/** Ce que dure chaque bonus (secondes), et la portée du solo (il casse tout devant) et de l'aimant. */
export const DUREES: Record<(typeof BONUS)[number], number> = {
  solo: 5,
  ressorts: 8,
  trottinette: 4,
  aimant: 8,
};
export const PORTEE_SOLO = 70;
export const PORTEE_AIMANT = 90;
/** Le score : chaque carte, l'embarquement, chaque seconde d'avance sur le décollage. */
export const POINTS_CARTE = 5;
export const POINTS_EMBARQUE = 300;
export const POINTS_SECONDE = 10;

/** Où est l'avion (sa porte arrière, pixels le long du tarmac) après `temps` ticks de course. */
export function xAvion(temps: number): number {
  const s = temps / SECONDE;
  return DEPART_AVION + V0 * s + 0.5 * A * s * s;
}
