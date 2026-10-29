import { TUILE } from '../config';
import type { Evenement } from '../jeu/vue';
import { proprietes } from '../monde/tuiles';
import { debrisDeDecor } from './debris-decor';
import type { semeDecor } from './decor';
import type { Particules } from './particules';

/**
 * Les évènements de la partie deviennent des particules : débris d'une tuile cassée (et du décor posé dessus), explosions,
 * impacts, confettis, textes flottants. `decorParTuile` : les accessoires posés sur chaque tuile (clé : rangée × 100000 + colonne).
 */
export function particulesDesEvenements(
  p: Particules,
  decorParTuile: ReadonlyMap<number, ReturnType<typeof semeDecor>>,
  evts: readonly Evenement[],
): void {
  for (const e of evts) {
    switch (e.k) {
      case 'tuile':
        if (e.t !== 0) break;
        p.debris((e.x + 0.5) * TUILE, (e.y + 0.5) * TUILE, proprietes(e.avant).debris, 7);
        // ce qui était posé sur cette tuile (décor) se brise aussi : des morceaux s'envolent
        for (const o of decorParTuile.get(e.y * 100000 + e.x) ?? []) debrisDeDecor(p, o);
        break;
      case 'explo':
        p.explosion(e.x, e.y, e.r);
        break;
      case 'impact':
        p.impact(e.x, e.y, e.c);
        break;
      case 'confettis':
        p.confettis(e.x, e.y);
        break;
      case 'texte':
        p.texte(e.x, e.y, e.s, e.c);
        break;
    }
  }
}
