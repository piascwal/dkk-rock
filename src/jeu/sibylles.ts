import { Objet } from '../entites/objets';
import { cachettesDuNiveau } from '../niveaux/cachettes';
import { NIVEAUX } from '../niveaux';
import type { Partie } from './partie';
import type { Sauvegarde } from './sauvegarde';

/**
 * Les cartes Sibylle des fontaines : cachées dans chaque niveau (voir niveaux/cachettes.ts), en haut des structures et au fond
 * des caves, pour pousser à explorer. Une carte prise est acquise pour de bon : elle ne revient plus dans ce niveau, ni en le
 * rejouant, ni après une défaite.
 */

/** Ce que la partie sait des cartes déjà acquises, et à qui dire qu'une carte vient d'être prise (la sauvegarde de l'hôte). */
export interface Carnet {
  /** les numéros des cartes déjà acquises dans le niveau `niveau` (indice dans NIVEAUX) */
  acquises(niveau: number): readonly number[];
  prise(niveau: number, carte: number): void;
}

/** Sans sauvegarde (les tests, les mini-jeux) : rien d'acquis, rien à retenir. */
export const CARNET_VIDE: Carnet = { acquises: () => [], prise: () => {} };

/** Le carnet tenu dans la sauvegarde (par `id` de niveau : il ne bouge pas si l'ordre des niveaux change). */
export function carnetDe(s: Sauvegarde, enregistre: () => void): Carnet {
  const id = (niveau: number) => NIVEAUX[niveau]?.id ?? '';
  return {
    acquises: (niveau) => s.sibylles[id(niveau)] ?? [],
    prise: (niveau, carte) => {
      const deja = s.sibylles[id(niveau)] ?? [];
      if (!deja.includes(carte)) s.sibylles[id(niveau)] = [...deja, carte];
      enregistre();
    },
  };
}

/** Les cartes trouvées dans le niveau `niveau`, d'après la sauvegarde, et son nombre de cartes (pour la carte du monde). */
export function compteSibylles(s: Sauvegarde, niveau: number): [number, number] {
  const total = cachettesDuNiveau(niveau).length;
  const trouvees = (s.sibylles[NIVEAUX[niveau]?.id ?? ''] ?? []).filter((i) => i < total).length;
  return [trouvees, total];
}

/** Les points d'une carte. */
const POINTS = 250;

/** Pose les cartes du niveau qui n'ont pas encore été trouvées (au chargement du niveau, et quand on le recommence). */
export function peupleSibylles(p: Partie): void {
  p.sibylles = new Set(p.carnet.acquises(p.niveau));
  cachettesDuNiveau(p.niveau).forEach((r, i) => {
    if (!p.sibylles.has(i)) p.ajoute(new Objet(p, 'sibylle', r.x, r.y, i));
  });
}

/** Un héros touche une carte : elle est acquise (la sauvegarde la retient), et l'écran le fête. */
export function prendSibylle(p: Partie, e: Objet): void {
  e.fini = true;
  if (p.sibylles.has(e.variante)) return;
  p.sibylles.add(e.variante);
  p.carnet.prise(p.niveau, e.variante);
  p.score += POINTS;
  const total = cachettesDuNiveau(p.niveau).length;
  p.son('liberation', e.corps.x, e.corps.y);
  p.texte(e.corps.x, e.corps.y - 12, `SIBYLLE ${p.sibylles.size}/${total}`, '#7cfc7c');
  p.evenement({ k: 'confettis', x: e.corps.x + e.corps.w / 2, y: e.corps.y });
}
