import { TUILE } from '../config';

/**
 * Les tyroliennes d'une carte : `(` un départ, `)` une arrivée, `$` une jointure (un poteau au milieu, où le câble change de pente).
 * Chaque départ est relié au poteau le plus proche à sa droite (une arrivée ou une jointure) ; une jointure repart vers le suivant,
 * jusqu'à une arrivée. Une tyrolienne peut ainsi descendre, filer à plat, puis remonter, d'un seul tenant : chaque tronçon connaît
 * le précédent et le suivant, et le héros passe de l'un à l'autre sans lâcher.
 */

export interface Tyrolienne {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** le tronçon d'avant (le poteau de gauche est une jointure) */
  precedente?: Tyrolienne;
  /** le tronçon d'après (le poteau de droite est une jointure) */
  suivante?: Tyrolienne;
}

export interface Poteau {
  tx: number;
  ty: number;
}

/** Relie les poteaux ; lève une erreur lisible (sans le nom du niveau) si l'un reste seul. */
export function relieTyroliennes(debuts: Poteau[], bouts: Poteau[], jointures: Poteau[]): Tyrolienne[] {
  const liste: Tyrolienne[] = [];
  const libres = new Set(jointures);
  const point = (p: Poteau) => ({ x: p.tx * TUILE + TUILE / 2, y: p.ty * TUILE + 4 });
  for (const d of debuts) {
    let de = d;
    let avant: Tyrolienne | undefined;
    for (;;) {
      const candidats = [...bouts, ...libres].filter((b) => b.tx > de.tx);
      if (!candidats.length)
        throw new Error(
          de === d
            ? `tyrolienne sans arrivée en ${de.tx},${de.ty}`
            : `jointure sans suite en ${de.tx},${de.ty}`,
        );
      const b = candidats.reduce((m, o) =>
        Math.hypot(o.tx - de.tx, o.ty - de.ty) < Math.hypot(m.tx - de.tx, m.ty - de.ty) ? o : m,
      );
      const [a, z] = [point(de), point(b)];
      const t: Tyrolienne = { x1: a.x, y1: a.y, x2: z.x, y2: z.y };
      if (avant) [t.precedente, avant.suivante] = [avant, t];
      liste.push(t);
      if (!libres.delete(b)) break;
      [de, avant] = [b, t];
    }
  }
  const seule = [...libres][0];
  if (seule) throw new Error(`jointure de tyrolienne reliée à aucun départ en ${seule.tx},${seule.ty}`);
  return liste;
}

/** Les poteaux de chaque tyrolienne d'un seul tenant, de gauche à droite (en pixels, au niveau du câble). */
export function chainesDeTyroliennes(liste: readonly Tyrolienne[]): { x: number; y: number }[][] {
  return liste
    .filter((t) => !t.precedente)
    .map((t) => {
      const poteaux = [{ x: t.x1, y: t.y1 }];
      for (let s: Tyrolienne | undefined = t; s; s = s.suivante) poteaux.push({ x: s.x2, y: s.y2 });
      return poteaux;
    });
}
