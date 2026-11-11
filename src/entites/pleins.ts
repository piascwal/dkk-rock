import type { EntiteSimulee } from '../jeu/contexte';
import type { Corps } from '../monde/physique';
import { Bonbonne } from './attractions';
import { Baril } from './baril';

/** Les corps pleins du niveau (`Carte.obstacles`) : les barils, héros et ennemis s'y heurtent et montent dessus ; et la bonbonne. */
export function corpsPleins(entites: readonly EntiteSimulee[]): Corps[] {
  const r: Corps[] = [];
  for (const e of entites) if (!e.fini && (e instanceof Baril || e instanceof Bonbonne)) r.push(e.corps);
  return r;
}
