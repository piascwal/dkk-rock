import { accessibles } from '../src/niveaux/accessibilite';
import type { NiveauLu } from '../src/niveaux/format';

/** Les cases accessibles du niveau (voir src/niveaux/accessibilite.ts), en « x,y » : la forme qu'attendent les tests. */
export function casesAccessibles(lu: NiveauLu, barriereOuverte = true): Set<string> {
  const vu = accessibles(lu, barriereOuverte);
  const cases = new Set<string>();
  vu.forEach((v, k) => {
    if (v) cases.add(`${k % lu.largeur},${Math.floor(k / lu.largeur)}`);
  });
  return cases;
}
