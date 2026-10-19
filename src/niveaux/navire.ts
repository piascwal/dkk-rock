import { TUILE } from '../config';
import type { Repere } from './format';

/**
 * Le ferry du niveau « La Traversée », en tuiles (outils/niveaux/ferry.py pose les mêmes mesures). Le repère `&` est la
 * première case du pont, contre la poupe. Seul le navire est solide (du socle indestructible : le pont, la coque, la poupe et
 * la proue, qui sont aussi les rampes relevées) ; autour et dessous, la mer, c'est-à-dire le vide. Les quais de Lorient et de
 * Groix sont dessinés, pas posés : ils glissent au départ et à l'arrivée (rendu/navire.ts).
 */
export const NAVIRE = {
  /** de la poupe à la proue comprises */
  longueur: 30,
  /** rangées de coque sous le pont */
  coque: 3,
  /** hauteur de la poupe et de la proue (les rampes relevées) au-dessus du pont */
  bastingage: 3,
  /** la place du van, en tuiles depuis la poupe */
  parking: 7,
  /** l'écart entre le navire et un quai, que franchit une rampe abaissée */
  rampe: 2,
  /** la largeur d'un quai dessiné */
  quai: 12,
} as const;

/** Les mesures du navire en pixels du monde. */
export interface GeometrieNavire {
  /** bord gauche (la poupe) et bord droit (la proue) */
  poupe: number;
  proue: number;
  /** le dessus du pont, la ligne de flottaison, le bas de la coque */
  pont: number;
  flottaison: number;
  quille: number;
  /** où le van se gare */
  parking: number;
}

export function geometrieNavire(embarquement: Repere): GeometrieNavire {
  const poupe = (embarquement.tx - 1) * TUILE;
  const pont = (embarquement.ty + 1) * TUILE;
  return {
    poupe,
    proue: poupe + NAVIRE.longueur * TUILE,
    pont,
    // la dernière rangée de coque est presque entièrement sous l'eau
    flottaison: pont + NAVIRE.coque * TUILE - 10,
    quille: pont + (NAVIRE.coque + 1) * TUILE,
    parking: poupe + NAVIRE.parking * TUILE,
  };
}

/** Les étapes de la traversée, dans l'ordre (voir jeu/traversee.ts) : leur rang est transmis par la vue. */
export const ETAPES = [
  'montee',
  'rampe',
  'appareillage',
  'traversee',
  'accostage',
  'debarquement',
  'sortie',
  'fin',
] as const;
export type Etape = (typeof ETAPES)[number];

/** L'étape et son avancement (0 à 39) sur un octet ; `decodeEtape` en fait l'inverse. */
export const codeEtape = (etape: Etape, avancement: number): number =>
  ETAPES.indexOf(etape) * 40 + Math.min(39, Math.floor(avancement * 40));
export const decodeEtape = (code: number): { etape: Etape; avancement: number } => ({
  etape: ETAPES[Math.min(ETAPES.length - 1, Math.floor(code / 40))]!,
  avancement: (code % 40) / 39,
});
