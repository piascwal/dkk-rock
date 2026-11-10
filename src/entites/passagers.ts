import type { Cible, Contexte } from '../jeu/contexte';
import type { Corps } from '../monde/physique';

const corpsDe = (c: Cible): Corps | undefined => (c as Partial<{ corps: Corps }>).corps;

/**
 * Ce qui se tient sur le dessus de `t` (les pieds posés dessus, sans monter) : héros, ennemis et accessoires. Ils voyagent avec lui
 * (le monte-charge, le tonneau-fusée : voir monte-charge.ts et attractions.ts). Remplit `sortie`.
 */
export function passagersSur(ctx: Contexte, t: Corps, sortie: Corps[]): void {
  for (const liste of [ctx.cibles('tous'), ctx.props()])
    for (const cible of liste) {
      const c = corpsDe(cible);
      if (
        !c ||
        c === t ||
        c.vy < 0 ||
        c.x + c.w <= t.x ||
        c.x >= t.x + t.w ||
        Math.abs(c.y + c.h - t.y) > 1.5
      )
        continue;
      sortie.push(c);
    }
}
