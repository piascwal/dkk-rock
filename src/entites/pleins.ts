import type { EntiteSimulee } from '../jeu/contexte';
import type { Corps } from '../monde/physique';
import { Baril } from './baril';
import { MonteCharge } from './monte-charge';

/** Les corps pleins du niveau (`Carte.obstacles`) : les barils, héros et ennemis s'y heurtent et montent dessus ; et les monte-charge. */
export function corpsPleins(entites: readonly EntiteSimulee[]): Corps[] {
  const r: Corps[] = [];
  for (const e of entites) if (!e.fini && (e instanceof Baril || e instanceof MonteCharge)) r.push(e.corps);
  return r;
}
