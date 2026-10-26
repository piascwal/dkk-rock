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
