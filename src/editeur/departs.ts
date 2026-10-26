import type { DocumentNiveau } from './document';

/** Les départs des joueurs en battle royale, placés dans l'éditeur (voir DefNiveau.departs). */

/** le départ d'un joueur en battle royale : [colonne, rangée où il se tient], ou null s'il n'est pas placé */
export type Depart = [number, number] | null;
export const NB_DEPARTS = 8;

/** Des départs lus d'ailleurs (un export, un niveau) : huit cases, ou null. */
export const lisDeparts = (l: readonly unknown[] = []): Depart[] =>
  Array.from({ length: NB_DEPARTS }, (_, i) => {
    const d = l[i];
    return Array.isArray(d) && Number.isInteger(d[0]) && Number.isInteger(d[1])
      ? [d[0] as number, d[1] as number]
      : null;
  });

/** Pose le départ du joueur `n` (0 à 7) sur une case ; un autre départ qui y était s'en va. */
export function placeDepart(doc: DocumentNiveau, n: number, x: number, y: number): void {
  if (x < 0 || y < 0 || x >= doc.largeur || y >= doc.hauteur) return;
  doc.applique(() => {
    doc.departs = doc.departs.map((d, i) => (i === n ? [x, y] : d && d[0] === x && d[1] === y ? null : d));
  });
}

/** Le joueur dont le départ est sur cette case, ou -1. */
export const departEn = (doc: DocumentNiveau, x: number, y: number): number =>
  doc.departs.findIndex((d) => d && d[0] === x && d[1] === y);

export function retireDepart(doc: DocumentNiveau, x: number, y: number): void {
  const n = departEn(doc, x, y);
  if (n >= 0) doc.applique(() => (doc.departs = doc.departs.map((d, i) => (i === n ? null : d))));
}
