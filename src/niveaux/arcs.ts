import { FIN_BRETAGNE } from '../histoire/fin-bretagne';
import { FIN_FISE } from '../histoire/fin-fise';
import { FIN_TOURNEE } from '../histoire/fin-tournee';
import type { Replique } from './format';

/**
 * Les arcs de l'histoire : chacun est une suite de niveaux (indices dans NIVEAUX) avec son épilogue. L'arc principal est
 * la tournée contre DJ Boucle ; d'autres peuvent s'y ajouter (un voyage en Jamaïque, par exemple) sans toucher aux
 * premiers : ajouter les niveaux à la fin de NIVEAUX, puis une entrée ici.
 */
export interface DefArc {
  id: string;
  titre: string;
  resume: string;
  /** les niveaux de l'arc, dans l'ordre (indices dans NIVEAUX) */
  niveaux: number[];
  /** les niveaux qu'on peut laisser de côté (un mini-jeu) : celui qui les suit s'ouvre aussi quand le précédent est fait */
  facultatifs?: number[];
  /** niveau (indice dans NIVEAUX) à terminer pour ouvrir l'arc ; absent : ouvert d'emblée */
  apres?: number;
  /** les répliques après le dernier niveau de l'arc */
  fin: Replique[];
}

export const ARCS: DefArc[] = [
  {
    id: 'tournee',
    titre: 'La tournée',
    resume: 'Du garage au Club Infini : débrancher DJ Boucle.',
    // le garage, le pré du Clos (le concours de drift, niveau 11 de la liste, ajouté après coup), puis la route des Alpes
    niveaux: [0, 11, 1, 2, 3, 4, 5],
    facultatifs: [11],
    fin: FIN_TOURNEE,
  },
  {
    id: 'bretagne',
    titre: 'Breizh Tour',
    resume: 'De la forêt des légendes à l’île de Groix : rendre leurs airs aux binious.',
    // la forêt, le port, la traversée en ferry (niveau 9 de la liste, ajouté après coup), puis Groix
    niveaux: [6, 7, 9, 8],
    apres: 5,
    fin: FIN_BRETAGNE,
  },
  {
    id: 'fise',
    titre: 'Le FISE',
    resume:
      'Retour sur le continent : le rendez-vous obligatoire du Festival International des Sports Extrêmes, à Montpellier.',
    niveaux: [10],
    apres: 8,
    fin: FIN_FISE,
  },
];

/** L'arc d'un niveau (le premier s'il n'est dans aucun : sécurité). */
export const arcDe = (niveau: number): DefArc => ARCS.find((a) => a.niveaux.includes(niveau)) ?? ARCS[0]!;

/** Le niveau qui suit dans son arc, ou null à la fin de l'arc. */
export function suivantDansArc(niveau: number): number | null {
  const a = arcDe(niveau);
  return a.niveaux[a.niveaux.indexOf(niveau) + 1] ?? null;
}

/** Tous les niveaux dans l'ordre du monde, arc après arc : les étapes de l'unique carte du monde. */
export const MONDE: readonly number[] = ARCS.flatMap((a) => a.niveaux);

/** Le premier niveau de l'arc qu'ouvre la fin de ce niveau, ou null. */
export const arcOuvertPar = (niveau: number): number | null =>
  ARCS.find((a) => a.apres === niveau)?.niveaux[0] ?? null;

/** Le niveau qui suit sur la route : le suivant de son arc, sinon le premier de l'arc qu'il ouvre. */
export const suivantDansMonde = (niveau: number): number | null =>
  suivantDansArc(niveau) ?? arcOuvertPar(niveau);

/** Un niveau est ouvert si c'est le premier de son arc (arc ouvert) ou si le précédent est terminé (voir `facultatifs`). */
export function niveauOuvert(niveau: number, faits: readonly number[]): boolean {
  const a = arcDe(niveau);
  if (a.apres !== undefined && !faits.includes(a.apres)) return false;
  // le précédent fait ; un niveau facultatif juste avant (un mini-jeu) ne bloque pas : celui d'avant lui suffit
  for (let k = a.niveaux.indexOf(niveau) - 1; k >= 0; k--) {
    const avant = a.niveaux[k]!;
    if (faits.includes(avant)) return true;
    if (!a.facultatifs?.includes(avant)) return false;
  }
  return true;
}
