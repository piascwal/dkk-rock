import type { Joueur } from '../entites/joueur';
import type { Cible, EntiteSimulee } from './contexte';

/** Ce que la partie recalcule à chaque pas : qui peut être touché, par camp. */
export interface CacheCibles {
  heros: Cible[];
  ennemis: Cible[];
  tous: Cible[];
  /** les accessoires cassables (barils) : touchés par tout le monde, visés par personne */
  props: Cible[];
}

export const CACHE_VIDE: CacheCibles = { heros: [], ennemis: [], tous: [], props: [] };

const estCible = (e: EntiteSimulee): e is EntiteSimulee & Cible => 'blesse' in e && 'camp' in e;

/** Les cibles de ce pas : les héros en vie, les entités ennemies debout, et les barils (camp `tous`). */
export function calculeCibles(
  joueurs: readonly (Joueur | undefined | null)[],
  entites: readonly EntiteSimulee[],
): CacheCibles {
  const heros = joueurs.filter((j): j is Joueur => !!j && !j.mort);
  const cibles = entites.filter((e): e is EntiteSimulee & Cible => estCible(e) && !e.fini);
  const ennemis = cibles.filter((e) => e.camp === 'ennemis');
  const props = cibles.filter((e) => e.camp === 'tous');
  return { heros, ennemis, tous: [...heros, ...ennemis], props };
}
