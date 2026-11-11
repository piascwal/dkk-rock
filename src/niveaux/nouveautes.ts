import { CARTE_STC } from './cartes/01-stc';
import { CARTE_ALPAGES } from './cartes/02-alpages';
import type { DefNiveau } from './format';
import { CARTE_CIMES_REFONTE } from './refontes/03-cimes';
import { CARTE_FORET_REFONTE } from './refontes/07-foret';
import { CARTE_PORT_REFONTE } from './refontes/08-port';
import { CARTE_GROIX_REFONTE } from './refontes/09-groix';
import { CARTE_TUVES_REFONTE } from './refontes/13-tuves';
import { CARTE_BEAUVAIS_REFONTE } from './refontes/17-beauvais';
import { CARTE_LIMERICK_REFONTE } from './refontes/18-limerick';
import { CARTE_LUND_REFONTE } from './refontes/19-lund';
import { CARTE_MARSEILLE_REFONTE } from './refontes/21-marseille';

/**
 * Les nouveautés de gameplay, posées sur les cartes des niveaux, sans rien pour les
 * annoncer : on les découvre en jouant. Elles reviennent d'un niveau à l'autre, de plus en plus mêlées, et certaines sont aperçues
 * un niveau plus tôt.
 *
 *   Saint-Cézaire : la grosse caisse trampoline (`_`) ; on aperçoit une bonbonne
 *   le pont des Tuves : la bonbonne de fumée (`:`) ; un téléporteur (`>` au sol, `<` tout au fond d'une grande cave) ; des projecteurs suspendus (`"`) vers la fin
 *   les Alpages : des projecteurs suspendus en chaîne (dans la salle de bois du début), avec les précédentes
 *   les Cimes : le sonneur d'alarme (`?`) et sa sirène (`}`), avec tout le reste
 *   la Forêt, le Port, Groix : le téléporteur seul, vers leurs caves les plus profondes (35 à 43 rangées sous le chemin)
 *
 * Les emplacements ont été choisis sur les cartes publiées (un rebord à atteindre pour une grosse caisse, un long plat pour les
 * autres, un plafond au-dessus d'ennemis ou de barils pour un projecteur, un sol dégagé de chaque côté pour une porte de téléporteur : en haut au niveau du sol, en bas dans la cave la plus profonde dont
 * on peut remonter) ;
 * `pose` vérifie que chacun tient (test).
 *
 * Règle de level design, à reprendre dans chaque niveau où l'on propage ces nouveautés : des objets explosifs (caissons `T`, barils
 * `%`, empilés) sont posés là où quelque chose finit par les atteindre, pour provoquer des réactions en chaîne : au bout de la
 * course d'un tonneau-fusée (une vingtaine de cases, de chaque côté), et sous chaque projecteur. Chacun garde le chemin praticable
 * (le test d'accessibilité des niveaux le vérifie).
 */

/** [repère, colonne, rangée] */
type Pose = readonly [string, number, number];

/** Les cases où un repère peut se poser : le vide, un mur de fond, ou (pour le sonneur) un autre ennemi dont il prend la place. */
const libre = (c: string, repere: string) => c === ' ' || c === '.' || (repere === '?' && /[a-z]/.test(c));

/** Les tuiles pleines qu'une porte de téléporteur fait disparaître autour d'elle (ni échelles ni plateformes). */
const PLEINES = /[#RBMXNGWCTSVDEOQLUAI|{^~;[/\\]/;

/**
 * La place d'un téléporteur (cinq cases de large, trois de haut, sa case au milieu en bas) : ce qui est plein dans ce volume est
 * dégagé, et le sol dessous, de toute sa largeur, devient du socle incassable (`X`) : la porte ne pend jamais dans le vide.
 */
function assoit(lignes: string[][], x: number, y: number): void {
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = 0; dy < 3; dy++) {
      const ligne = lignes[y - dy];
      if (ligne && !(dx === 0 && dy === 0) && PLEINES.test(ligne[x + dx] ?? ' ')) ligne[x + dx] = ' ';
    }
    const sol = lignes[y + 1];
    if (sol) {
      while (sol.length <= x + dx) sol.push(' ');
      sol[x + dx] = 'X';
    }
  }
}

/** La carte, avec ses nouveautés posées. Lève une erreur si une case n'est pas libre. */
export function pose(carte: readonly string[], poses: readonly Pose[]): string[] {
  const lignes = carte.map((l) => [...l]);
  for (const [c, x, y] of poses) {
    const ligne = lignes[y];
    if (!ligne) throw new Error(`nouveauté ${c} hors de la carte en ${x},${y}`);
    while (ligne.length <= x) ligne.push(' ');
    if (!libre(ligne[x]!, c))
      throw new Error(`nouveauté ${c} : la case ${x},${y} est prise (« ${ligne[x]} »)`);
    ligne[x] = c;
    if (c === '>' || c === '<') assoit(lignes, x, y);
  }
  return lignes.map((l) => l.join(''));
}

export const POSES: Readonly<Record<string, readonly Pose[]>> = {
  // le Breizh Tour : la porte sur le chemin du niveau, l'autre tout au fond d'une des plus profondes caves (35 à 43 rangées plus bas), à remonter
  foret: [
    ['>', 393, 39],
    ['<', 411, 70],
  ],
  port: [
    ['>', 609, 57],
    ['<', 603, 74],
  ],
  groix: [
    ['>', 292, 53],
    ['<', 301, 82],
  ],
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
    // un téléporteur : la porte sur le chemin (au début du pont), l'autre au fond d'une cave qu'il faut remonter
    ['>', 58, 45],
    ['<', 49, 62],
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

/** Les niveaux avec leurs nouveautés, publiées : tous les joueurs les ont (voir refontes.ts). */
export const NOUVEAUTES_PUBLIEES: Readonly<Record<string, Partial<DefNiveau>>> = {
  stc: { carte: pose(CARTE_STC, POSES['stc']!) },
  tuves: { carte: pose(CARTE_TUVES_REFONTE, POSES['tuves']!) },
  alpages: { carte: pose(CARTE_ALPAGES, POSES['alpages']!) },
  cimes: { carte: pose(CARTE_CIMES_REFONTE, POSES['cimes']!) },
  foret: { carte: pose(CARTE_FORET_REFONTE, POSES['foret']!) },
  port: { carte: pose(CARTE_PORT_REFONTE, POSES['port']!) },
  groix: { carte: pose(CARTE_GROIX_REFONTE, POSES['groix']!) },
};

/**
 * Les nouveautés à l'essai (Options → Mode essai → « Niveaux refaits »), propagées à l'International Tour : un élément par niveau
 * en plus du téléporteur, avec ses explosifs posés pour les réactions en chaîne (voir la règle plus haut).
 */
export const POSES_ESSAI: Readonly<Record<string, readonly Pose[]>> = {
  // le téléporteur vers la cave la plus profonde (47 rangées), et deux rangées de trois projecteurs, deux barils empilés sous chacun
  marseille: [
    ['>', 700, 31],
    ['<', 696, 78],
    ['"', 242, 43],
    ['%', 242, 47],
    ['%', 242, 46],
    ['"', 245, 43],
    ['%', 245, 47],
    ['%', 245, 46],
    ['"', 248, 43],
    ['%', 248, 47],
    ['%', 248, 46],
    ['"', 584, 52],
    ['%', 584, 57],
    ['%', 584, 56],
    ['"', 587, 52],
    ['%', 587, 57],
    ['%', 587, 56],
    ['"', 590, 52],
    ['%', 590, 57],
    ['%', 590, 56],
  ],
  // le téléporteur (32 rangées plus bas), et deux tonneaux-fusées, un caisson et un baril au bout de leur course
  beauvais: [
    ['>', 202, 44],
    ['<', 202, 76],
    [':', 364, 46],
    ['T', 382, 46],
    ['%', 383, 46],
    [':', 673, 54],
    ['T', 655, 54],
    ['%', 654, 54],
  ],
  // le téléporteur (32 rangées plus bas), et deux rangées de trois projecteurs, deux barils empilés sous chacun
  lund: [
    ['>', 361, 45],
    ['<', 361, 77],
    ['"', 176, 53],
    ['%', 176, 57],
    ['%', 176, 56],
    ['"', 179, 53],
    ['%', 179, 57],
    ['%', 179, 56],
    ['"', 182, 53],
    ['%', 182, 57],
    ['%', 182, 56],
    ['"', 711, 40],
    ['%', 711, 45],
    ['%', 711, 44],
    ['"', 714, 40],
    ['%', 714, 45],
    ['%', 714, 44],
    ['"', 717, 40],
    ['%', 717, 45],
    ['%', 717, 44],
  ],
  // le téléporteur (26 rangées plus bas), et deux tonneaux-fusées, un caisson et un baril au bout de leur course
  limerick: [
    ['>', 101, 47],
    ['<', 102, 73],
    [':', 306, 59],
    ['T', 324, 59],
    ['%', 325, 59],
    [':', 495, 50],
    ['T', 477, 50],
    ['%', 476, 50],
  ],
};

/** Les niveaux à l'essai (refontes.ts, `ESSAIS`) : leur carte refaite, avec ces nouveautés. */
export const ESSAIS_NOUVEAUTES: Readonly<Record<string, Partial<DefNiveau>>> = {
  marseille: { carte: pose(CARTE_MARSEILLE_REFONTE, POSES_ESSAI['marseille']!) },
  beauvais: { carte: pose(CARTE_BEAUVAIS_REFONTE, POSES_ESSAI['beauvais']!) },
  lund: { carte: pose(CARTE_LUND_REFONTE, POSES_ESSAI['lund']!) },
  limerick: { carte: pose(CARTE_LIMERICK_REFONTE, POSES_ESSAI['limerick']!) },
};
