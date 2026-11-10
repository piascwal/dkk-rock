import { G } from '../jeu/vue';
import { CARTE_STC } from './cartes/01-stc';
import { CARTE_ALPAGES } from './cartes/02-alpages';
import type { DefNiveau } from './format';
import { CARTE_CIMES_REFONTE } from './refontes/03-cimes';
import { CARTE_TUVES_REFONTE } from './refontes/13-tuves';

/**
 * Les nouveautés qu'on découvre de niveau en niveau (à l'essai : Options → Mode essai → « Niveaux refaits ») : une par niveau,
 * présentée par un bandeau la première fois qu'on la voit (ui/decouverte.ts), reprise dans les niveaux suivants avec les
 * précédentes, et parfois aperçue un niveau plus tôt (une seule, vers la fin : de quoi donner envie d'y aller).
 *
 *   Saint-Cézaire : la grosse caisse trampoline (`_`) ; on aperçoit une bonbonne
 *   le pont des Tuves : la bonbonne de fumée (`:`) ; on aperçoit un porteur de pancarte
 *   les Alpages : le porteur de pancarte (`]`)
 *   les Cimes : le sonneur d'alarme (`?`) et sa sirène (`}`)
 *
 * Les emplacements ont été choisis sur les cartes publiées (un rebord à atteindre pour une grosse caisse, un long plat pour les
 * autres) ; `pose` vérifie que chacun tient debout sur du sol : une carte qui change sous eux se voit tout de suite (test).
 */

export interface Nouveaute {
  /** le genre qui la fait reconnaître à l'écran */
  genre: number;
  nom: string;
  /** une ligne sous le nom : ce qu'elle fait */
  astuce: string;
}

export const NOUVEAUTES: readonly Nouveaute[] = [
  {
    genre: G.TREMPLIN,
    nom: 'La grosse caisse',
    astuce: 'Sautez dessus : elle vous renvoie très haut. Les ennemis aussi.',
  },
  { genre: G.BONBONNE, nom: 'La bonbonne', astuce: 'Un tir, et elle file comme une fusée du côté opposé.' },
  {
    genre: G.PANCARTE,
    nom: 'Le porteur de pancarte',
    astuce: 'Sa pancarte arrête tout : prenez-le à revers, ou d’en haut.',
  },
  {
    genre: G.SONNEUR,
    nom: 'Le sonneur d’alarme',
    astuce: 'Arrêtez-le avant la sirène, ou des renforts arrivent.',
  },
];

/** La nouveauté de chaque niveau (son `id`), dans l'ordre de la tournée. */
export const NOUVEAUTE_DU_NIVEAU: Readonly<Record<string, number>> = {
  stc: G.TREMPLIN,
  tuves: G.BONBONNE,
  alpages: G.PANCARTE,
  cimes: G.SONNEUR,
};

type Pose = readonly [string, number, number];

/** Les cases où un repère peut se poser : le vide, un mur de fond, ou (pour un ennemi) un autre ennemi dont il prend la place. */
const libre = (c: string, repere: string) =>
  c === ' ' || c === '.' || ((repere === ']' || repere === '?') && /[a-z]/.test(c));

/** La carte, avec ses nouveautés posées ([repère, colonne, rangée]). Lève une erreur si une case n'est pas libre. */
export function pose(carte: readonly string[], poses: readonly Pose[]): string[] {
  const lignes = carte.map((l) => [...l]);
  for (const [c, x, y] of poses) {
    const ligne = lignes[y];
    if (!ligne) throw new Error(`nouveauté ${c} hors de la carte en ${x},${y}`);
    while (ligne.length <= x) ligne.push(' ');
    if (!libre(ligne[x]!, c))
      throw new Error(`nouveauté ${c} : la case ${x},${y} est prise (« ${ligne[x]} »)`);
    ligne[x] = c;
  }
  return lignes.map((l) => l.join(''));
}

export const POSES: Readonly<Record<string, readonly Pose[]>> = {
  stc: [
    ['_', 6, 29],
    ['_', 98, 29],
    ['_', 140, 29],
    ['_', 183, 29],
    ['_', 449, 29],
    ['_', 513, 23],
    ['_', 638, 23],
    // aperçue : une bonbonne, vers la fin
    [':', 506, 23],
  ],
  tuves: [
    [':', 10, 39],
    [':', 98, 45],
    [':', 204, 40],
    [':', 291, 53],
    [':', 336, 51],
    [':', 436, 49],
    [':', 481, 59],
    [':', 536, 49],
    [':', 621, 57],
    ['_', 102, 45],
    ['_', 423, 45],
    // aperçu : un porteur de pancarte, sur un toit
    [']', 440, 30],
  ],
  alpages: [
    [']', 47, 33],
    [']', 109, 33],
    [']', 154, 46],
    [']', 288, 9],
    [']', 340, 33],
    [']', 407, 33],
    [':', 86, 33],
    [':', 321, 33],
    [':', 427, 33],
    [':', 487, 33],
    ['_', 70, 15],
    ['_', 167, 33],
    ['_', 228, 33],
    ['_', 293, 9],
    ['_', 462, 33],
  ],
  cimes: [
    ['?', 167, 58],
    ['}', 179, 58],
    ['?', 326, 40],
    ['}', 338, 40],
    [']', 378, 40],
    [':', 369, 40],
    ['_', 40, 85],
    ['_', 83, 64],
    ['_', 212, 58],
  ],
};

/** Les niveaux à l'essai : la carte publiée, plus ses nouveautés (voir refontes.ts, `ESSAIS`). */
export const ESSAIS_NOUVEAUTES: Readonly<Record<string, Partial<DefNiveau>>> = {
  stc: { carte: pose(CARTE_STC, POSES['stc']!) },
  tuves: { carte: pose(CARTE_TUVES_REFONTE, POSES['tuves']!) },
  alpages: { carte: pose(CARTE_ALPAGES, POSES['alpages']!) },
  cimes: { carte: pose(CARTE_CIMES_REFONTE, POSES['cimes']!) },
};
