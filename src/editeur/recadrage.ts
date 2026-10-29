import type { Depart } from './departs';
import type { Decor, Gens } from './export-niveau';
import type { Trace } from './tyroliennes-tracees';

/**
 * Recadrer la carte : ajouter ou rogner des colonnes et des rangées de chaque côté. Tout ce qui est posé sur la carte (décor, gens,
 * départs du battle royale, tyroliennes tracées) suit le décalage ; ce qui sort du nouveau cadre s'en va.
 */

/** Le nouveau cadre : de combien ce qui reste glisse (`g` colonnes à droite, `h` rangées vers le bas) et sa taille en tuiles. */
export interface Cadre {
  g: number;
  h: number;
  L: number;
  H: number;
}

const dansLeCadre = (x: number, y: number, c: Cadre, yMin = 0) => x >= 0 && x < c.L && y >= yMin && y < c.H;

/** Les cases de la carte, dans le nouveau cadre (du vide là où l'on ajoute). */
export const decaleCarte = (g: readonly (readonly string[])[], c: Cadre): string[][] =>
  Array.from({ length: c.H }, (_, y) => Array.from({ length: c.L }, (_, x) => g[y - c.h]?.[x - c.g] ?? ' '));

/** Le décor : sa rangée de sol reste à 1 au moins (un accessoire se dessine au-dessus de sa rangée). */
export const decaleDecor = (l: readonly Decor[], c: Cadre): Decor[] =>
  l
    .map((d): Decor =>
      d[3] === undefined ? [d[0], d[1] + c.g, d[2] + c.h] : [d[0], d[1] + c.g, d[2] + c.h, d[3]],
    )
    .filter(([, x, y]) => dansLeCadre(x, y, c, 1));

export const decaleGens = (l: readonly Gens[], c: Cadre): Gens[] =>
  l.map(([x, y, k]): Gens => [x + c.g, y + c.h, k]).filter(([x, y]) => dansLeCadre(x, y, c));

export const decaleDeparts = (l: readonly Depart[], c: Cadre): Depart[] =>
  l.map((d) => (d && dansLeCadre(d[0] + c.g, d[1] + c.h, c, 1) ? [d[0] + c.g, d[1] + c.h] : null));

/** Les tyroliennes tracées : les poteaux hors du cadre s'en vont, une tyrolienne à qui il n'en reste qu'un disparaît. */
export const decaleTraces = (l: readonly Trace[], c: Cadre): Trace[] =>
  l
    .map((t) =>
      t.map(([x, y]): [number, number] => [x + c.g, y + c.h]).filter(([x, y]) => dansLeCadre(x, y, c)),
    )
    .filter((t) => t.length > 1);
