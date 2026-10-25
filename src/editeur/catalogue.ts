import { ENNEMIS_PAR_LETTRE } from '../entites/ennemis/definitions';
import { ennemiDuCoin } from '../entites/ennemis/locaux';
import { PROPRIETES, tuileDuCaractere } from '../monde/tuiles';
import { ACCESSOIRES } from '../rendu/decor-objets';
import type { NomTheme } from '../rendu/themes';
import type { ModuleEditeur } from './document';
import MODULES_JSON from './modules.json';

/**
 * Tout ce que l'éditeur sait poser, par famille : les tuiles (la matière, l'eau, les échelles...), les gens (les ennemis de chaque
 * lettre, qui changent de visage selon la ville, et les boss), les objets (le départ, le van, les drapeaux, les cages, le butin, les
 * tyroliennes, les déclencheurs de dialogue), le décor (les accessoires dessinés du jeu) et les modules préconstruits.
 */

export type Famille = 'tuiles' | 'gens' | 'objets' | 'decor' | 'modules';

export interface Choix {
  famille: Famille;
  /** le caractère de la carte, le nom de l'accessoire ou l'identifiant du module */
  cle: string;
  nom: string;
  /** un sous-titre dans la palette (la famille d'un module) */
  groupe?: string;
}

export const FAMILLES: readonly [Famille, string][] = [
  ['tuiles', 'Tuiles'],
  ['gens', 'Gens'],
  ['objets', 'Objets'],
  ['decor', 'Décor'],
  ['modules', 'Modules'],
];

export const MODULES = MODULES_JSON as ModuleEditeur[];

const REPERES: readonly [string, string][] = [
  ['@', 'Départ'],
  ['F', 'Van (la fin)'],
  ['!', 'Drapeau'],
  ['K', 'Cage (un membre à libérer)'],
  ['*', 'Arme au hasard'],
  ['+', 'Médiator d’or'],
  ['%', 'Baril explosif'],
  ['(', 'Tyrolienne : départ'],
  [')', 'Tyrolienne : arrivée'],
  ...[...'123456789'].map((c): [string, string] => [c, `Dialogue ${c}`]),
];

export const BOSS: readonly [string, string][] = [
  ['Y', 'Yéti Alpha (boss)'],
  ['P', 'Champion du FISE (boss)'],
  ['Z', 'DJ Boucle (boss final)'],
];

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « sapinNeige » → « Sapin neige » */
const lisible = (nom: string) => majuscule(nom.replace(/([a-z])([A-Z0-9])/g, '$1 $2').toLowerCase());

/** Les gens d'une lettre : celui de la ville (« a » est un hockeyeur à Ottawa), sinon l'ordinaire. */
export const ennemiDeLaLettre = (lettre: string, theme: NomTheme) =>
  ennemiDuCoin(lettre, theme) ?? ENNEMIS_PAR_LETTRE[lettre];

export function catalogue(famille: Famille, theme: NomTheme): Choix[] {
  switch (famille) {
    case 'tuiles':
      return [
        { famille, cle: '.', nom: 'Mur de fond' },
        ...Object.values(PROPRIETES)
          .filter((p) => p.car !== ' ')
          .map((p) => ({ famille, cle: p.car, nom: majuscule(p.nom) })),
      ];
    case 'gens':
      return [
        ...Object.keys(ENNEMIS_PAR_LETTRE)
          .sort()
          .map((l) => ({ famille, cle: l, nom: ennemiDeLaLettre(l, theme)!.nom })),
        ...BOSS.map(([cle, nom]) => ({ famille, cle, nom })),
      ];
    case 'objets':
      return REPERES.map(([cle, nom]) => ({ famille, cle, nom }));
    case 'decor':
      return Object.keys(ACCESSOIRES).map((cle) => ({ famille, cle, nom: lisible(cle) }));
    case 'modules':
      return MODULES.map((m) => ({ famille, cle: m.id, nom: m.nom, groupe: m.famille }));
  }
}

/** Le choix qui pose ce caractère de carte (la pipette). */
export function choixDuCaractere(c: string, theme: NomTheme): Choix | null {
  if (c === ' ') return null;
  const famille: Famille =
    c === '.' || tuileDuCaractere(c) !== null
      ? 'tuiles'
      : /[a-z]/.test(c) || BOSS.some(([b]) => b === c)
        ? 'gens'
        : 'objets';
  return catalogue(famille, theme).find((o) => o.cle === c) ?? null;
}
