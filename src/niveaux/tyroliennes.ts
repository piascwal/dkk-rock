import { TUILE } from '../config';

/**
 * Les tyroliennes d'une carte : `(` un départ, `)` une arrivée, `$` une jointure (un poteau au milieu, où le câble change de pente).
 * Chaque départ est relié au poteau le plus proche à sa droite (une arrivée ou une jointure) ; une jointure repart vers le suivant,
 * jusqu'à une arrivée. Une tyrolienne peut ainsi descendre, filer à plat, puis remonter, d'un seul tenant : chaque tronçon connaît
 * le précédent et le suivant, et le héros passe de l'un à l'autre sans lâcher.
 *
 * Les tyroliennes tracées poteau par poteau dans l'éditeur (DefNiveau.tyroliennes) ne sont pas déduites : chacune donne ses
 * poteaux dans l'ordre, et peut croiser ou chevaucher une autre, commencer avant qu'une autre ne finisse.
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

const point = (p: Poteau) => ({ x: p.tx * TUILE + TUILE / 2, y: p.ty * TUILE + 4 });

/** Relie les poteaux ; lève une erreur lisible (sans le nom du niveau) si l'un reste seul. */
export function relieTyroliennes(debuts: Poteau[], bouts: Poteau[], jointures: Poteau[]): Tyrolienne[] {
  const liste: Tyrolienne[] = [];
  const libres = new Set(jointures);
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

/**
 * Une tyrolienne tracée poteau par poteau ([colonne, rangée] comme les caractères `(` `)` `$`) : au moins deux poteaux, toujours
 * dans le même sens (le câble se parcourt de gauche à droite, quel que soit le sens où on l'a tracé).
 */
export function chaineDeTyroliennes(poteaux: readonly (readonly [number, number])[]): Tyrolienne[] {
  const p = poteaux.map(([tx, ty]) => ({ tx, ty }));
  if (p.length > 1 && p[0]!.tx > p[p.length - 1]!.tx) p.reverse();
  const [d] = p;
  if (!d || p.length < 2) throw new Error(`tyrolienne d'un seul poteau${d ? ` en ${d.tx},${d.ty}` : ''}`);
  const liste: Tyrolienne[] = [];
  for (let i = 1; i < p.length; i++) {
    const [a, z] = [p[i - 1]!, p[i]!];
    if (z.tx <= a.tx) throw new Error(`tyrolienne qui revient en arrière en ${z.tx},${z.ty}`);
    const [pa, pz] = [point(a), point(z)];
    const t: Tyrolienne = { x1: pa.x, y1: pa.y, x2: pz.x, y2: pz.y };
    const avant = liste[liste.length - 1];
    if (avant) [t.precedente, avant.suivante] = [avant, t];
    liste.push(t);
  }
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
