import { CARTE_STC } from './cartes/01-stc';
import { CARTE_ALPAGES } from './cartes/02-alpages';
import type { DefNiveau } from './format';
import { CARTE_CIMES_REFONTE } from './refontes/03-cimes';
import { CARTE_TUVES_REFONTE } from './refontes/13-tuves';

/**
 * Les nouveautés à l'essai (Options → Mode essai → « Niveaux refaits »), posées sur les cartes publiées, sans rien pour les
 * annoncer : on les découvre en jouant. Elles reviennent d'un niveau à l'autre, de plus en plus mêlées, et certaines sont aperçues
 * un niveau plus tôt.
 *
 *   Saint-Cézaire : la grosse caisse trampoline (`_`) ; un monte-charge (`>`) vers une cave ; on aperçoit une bonbonne
 *   le pont des Tuves : la bonbonne de fumée (`:`) ; un monte-charge ; des projecteurs suspendus (`"`) vers la fin
 *   les Alpages : des projecteurs suspendus en chaîne (dans la salle de bois du début), avec les précédentes
 *   les Cimes : le sonneur d'alarme (`?`) et sa sirène (`}`), avec tout le reste
 *
 * Les emplacements ont été choisis sur les cartes publiées (un rebord à atteindre pour une grosse caisse, un long plat pour les
 * autres, un plafond au-dessus d'ennemis ou de barils pour un projecteur, un puits au-dessus d'une cave pour un monte-charge) ;
 * `pose` vérifie que chacun tient (test).
 *
 * Règle de level design, à reprendre dans chaque niveau où l'on propage ces nouveautés : des objets explosifs (caissons `T`, barils
 * `%`, empilés) sont posés là où quelque chose finit par les atteindre, pour provoquer des réactions en chaîne : au bout de la
 * course d'un tonneau-fusée (une vingtaine de cases, de chaque côté), et sous chaque projecteur. Chacun garde le chemin praticable
 * (le test d'accessibilité des niveaux le vérifie).
 */

/** [repère, colonne, rangée] ; le monte-charge a une rangée de plus : celle du sol de la cave où descend son puits. */
type Pose = readonly [string, number, number, number?];

/** Les cases où un repère peut se poser : le vide, un mur de fond, ou (pour le sonneur) un autre ennemi dont il prend la place. */
const libre = (c: string, repere: string) => c === ' ' || c === '.' || (repere === '?' && /[a-z]/.test(c));

/**
 * La carte, avec ses nouveautés posées. Lève une erreur si une case n'est pas libre. Le puits d'un monte-charge est creusé (deux
 * colonnes de « . », le mur de fond d'un intérieur) de sa case jusqu'au sol de la cave.
 */
export function pose(carte: readonly string[], poses: readonly Pose[]): string[] {
  const lignes = carte.map((l) => [...l]);
  const met = (c: string, x: number, y: number) => {
    const ligne = lignes[y];
    if (!ligne) throw new Error(`nouveauté ${c} hors de la carte en ${x},${y}`);
    while (ligne.length <= x) ligne.push(' ');
    ligne[x] = c;
  };
  for (const [c, x, y, sol] of poses) {
    if (c === '>') {
      if (sol === undefined || sol <= y + 2)
        throw new Error(`monte-charge en ${x},${y} : le sol de la cave manque`);
      for (let r = y; r < sol; r++)
        for (const k of [x, x + 1]) {
          const t = lignes[r]?.[k] ?? ' ';
          if (/[a-z@FKH!*+%O Q]/.test(t) && t !== ' ')
            throw new Error(`monte-charge en ${x},${y} : « ${t} » dans le puits`);
          met('.', k, r);
        }
      met('>', x, y);
      continue;
    }
    if (!libre(lignes[y]?.[x] ?? ' ', c))
      throw new Error(`nouveauté ${c} : la case ${x},${y} est prise (« ${lignes[y]?.[x]} »)`);
    met(c, x, y);
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
    // un monte-charge au-dessus de la première cave (la cage est à côté)
    ['>', 54, 30, 38],
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
    ['>', 45, 42, 53],
    // vers la fin : trois projecteurs en chaîne au-dessus de ceux qui gardent le passage
    ['"', 430, 34],
    ['"', 433, 34],
    ['"', 436, 34],
    // réactions en chaîne : des barils sous les lampes, un caisson et un baril au bout de la course de chaque tonneau-fusée
    ['T', 28, 39],
    ['%', 29, 39],
    ['T', 116, 47],
    ['%', 117, 47],
    ['T', 222, 45],
    ['%', 223, 45],
    ['T', 273, 55],
    ['%', 272, 55],
    ['T', 318, 58],
    ['%', 317, 58],
    ['T', 354, 51],
    ['%', 355, 51],
    ['T', 418, 49],
    ['%', 417, 49],
    ['T', 463, 63],
    ['%', 462, 63],
    ['T', 499, 59],
    ['%', 500, 59],
    ['T', 554, 49],
    ['T', 639, 59],
    ['%', 640, 59],
    ['%', 430, 35],
    ['%', 433, 35],
    ['%', 436, 35],
  ],
  alpages: [
    [':', 86, 33],
    [':', 321, 33],
    [':', 427, 33],
    [':', 487, 33],
    ['_', 70, 15],
    ['_', 167, 33],
    ['_', 228, 33],
    ['_', 293, 9],
    ['_', 462, 33],
    ['>', 30, 32, 42],
    // dans la salle de bois du début, sur le chemin : cinq projecteurs au-dessus des gardes et d'un caisson de basses
    ['"', 60, 31],
    ['"', 64, 31],
    ['"', 68, 31],
    ['"', 76, 31],
    ['"', 80, 31],
    // réactions en chaîne : des barils sous les lampes, un caisson et un baril au bout de la course de chaque tonneau-fusée
    ['T', 68, 33],
    ['T', 303, 33],
    ['%', 302, 33],
    ['T', 339, 33],
    ['T', 469, 33],
    ['%', 468, 33],
    ['%', 60, 33],
    ['%', 60, 32],
    ['%', 64, 33],
    ['%', 64, 32],
    ['%', 68, 32],
    ['%', 76, 32],
    ['%', 80, 33],
    ['%', 80, 32],
  ],
  cimes: [
    ['?', 167, 58],
    ['}', 179, 58],
    ['?', 326, 40],
    ['}', 338, 40],
    [':', 369, 40],
    ['_', 40, 85],
    ['_', 83, 64],
    ['_', 212, 58],
    ['>', 363, 29, 41],
    ['"', 294, 39],
    ['"', 297, 39],
    ['"', 446, 40],
    ['"', 449, 40],
    // réactions en chaîne : des barils sous les lampes, un caisson et un baril au bout de la course de chaque tonneau-fusée
    ['T', 351, 41],
    ['%', 350, 41],
    ['%', 294, 40],
    ['%', 297, 40],
    ['%', 446, 44],
    ['%', 446, 43],
    ['%', 449, 45],
    ['%', 449, 44],
  ],
};

/** Les niveaux à l'essai : la carte publiée, plus ses nouveautés (voir refontes.ts, `ESSAIS`). */
export const ESSAIS_NOUVEAUTES: Readonly<Record<string, Partial<DefNiveau>>> = {
  stc: { carte: pose(CARTE_STC, POSES['stc']!) },
  tuves: { carte: pose(CARTE_TUVES_REFONTE, POSES['tuves']!) },
  alpages: { carte: pose(CARTE_ALPAGES, POSES['alpages']!) },
  cimes: { carte: pose(CARTE_CIMES_REFONTE, POSES['cimes']!) },
};
