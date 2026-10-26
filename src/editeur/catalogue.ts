import { ENNEMIS_PAR_LETTRE } from '../entites/ennemis/definitions';
import { lisPersonnage } from '../entites/ennemis/gens';
import { ennemiDuCoin, ENNEMIS_LOCAUX } from '../entites/ennemis/locaux';
import { G, type Genre } from '../jeu/vue';
import { PROPRIETES, tuileDuCaractere } from '../monde/tuiles';
import { ACCESSOIRES } from '../rendu/decor-objets';
import { FEUILLES } from '../rendu/feuilles';
import type { NomTheme } from '../rendu/themes';
import { MODULES, modulesPerso } from './modules-perso';

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

const REPERES: readonly [string, string][] = [
  ['@', 'Départ'],
  ['F', 'Van (la fin)'],
  ['!', 'Drapeau'],
  ['K', 'Cage (un membre à libérer)'],
  ['*', 'Arme au hasard'],
  ['+', 'Médiator d’or'],
  ['%', 'Baril explosif'],
  // tracée poteau par poteau, rangée à part dans le document : elle peut en croiser une autre (voir tyroliennes-tracees.ts)
  ['tyro', 'Tyrolienne : poteau par poteau (retoucher le dernier pour finir)'],
  ['(', 'Tyrolienne auto : départ (reliée au poteau le plus proche à droite)'],
  [')', 'Tyrolienne auto : arrivée'],
  ['$', 'Tyrolienne auto : jointure (le câble change de pente)'],
  // les départs du battle royale : un par joueur (rangés à part dans le document, pas dans la carte)
  ...Array.from({ length: 8 }, (_, i): [string, string] => [
    `J${i + 1}`,
    `Départ du joueur ${i + 1} (battle royale)`,
  ]),
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

const VILLES: Record<string, string> = {
  beauvais: 'Beauvais',
  limerick: 'Limerick',
  newyork: 'New York',
  ottawa: 'Ottawa',
  lund: 'Lund',
  marseille: 'Marseille',
};
/** le nom des apparences qu'on connaît (les autres sont numérotées) */
const APPARENCES: Partial<Record<number, string[]>> = {
  [G.BIGOUDEN]: ['à la cornemuse', 'à la harpe', 'à la harpe (bis)'],
  [G.MARIN]: ['à l’accordéon', 'à la clarinette'],
  [G.BREAKER]: ['b-girl', 'b-boy'],
};

/** Le nombre d'apparences d'un personnage (sa planche en a plusieurs : `variantes`), 1 sinon. */
export function nombreApparences(genre: Genre): number {
  const f = FEUILLES[genre];
  return f?.variantes ? Math.max(1, f.images[0] ?? 1) : 1;
}

/** La lettre d'un choix de la famille des gens (« ottawa/a#1 » → « a ») ; un boss est sa propre lettre. */
export const lettreDe = (cle: string): string => /([a-zA-Z])(?:#\d+)?$/.exec(cle)![1]!;

function gens(): Choix[] {
  const famille = 'gens';
  const liste: Choix[] = [];
  for (const l of Object.keys(ENNEMIS_PAR_LETTRE).sort()) {
    const def = ENNEMIS_PAR_LETTRE[l]!;
    const n = nombreApparences(def.genre);
    if (n === 1) liste.push({ famille, cle: `_/${l}`, nom: def.nom, groupe: 'Partout' });
    for (let k = 0; n > 1 && k < n; k++) {
      const quoi = APPARENCES[def.genre]?.[k] ?? `n° ${k + 1}`;
      liste.push({ famille, cle: `_/${l}#${k}`, nom: `${def.nom} ${quoi}`, groupe: 'Partout' });
    }
  }
  for (const [ville, locaux] of Object.entries(ENNEMIS_LOCAUX))
    for (const [l, def] of Object.entries(locaux ?? {}))
      liste.push({ famille, cle: `${ville}/${l}`, nom: def.nom, groupe: VILLES[ville] ?? ville });
  return [...liste, ...BOSS.map(([cle, nom]) => ({ famille, cle, nom, groupe: 'Boss' }) as Choix)];
}

/**
 * Le choix qui correspond à un personnage de la carte (la pipette) : celui choisi sur la case s'il y en a un, sinon celui de sa
 * lettre dans ce thème (un gens du coin, ou l'ordinaire, dans sa première apparence).
 */
export function choixDuPersonnage(lettre: string, cle: string | undefined, theme: NomTheme): Choix | null {
  const liste = gens();
  if (cle) return liste.find((c) => c.cle === cle || c.cle === `_/${cle}`) ?? null;
  if (ENNEMIS_LOCAUX[theme]?.[lettre]) return liste.find((c) => c.cle === `${theme}/${lettre}`) ?? null;
  return liste.find((c) => c.cle === `_/${lettre}` || c.cle === `_/${lettre}#0` || c.cle === lettre) ?? null;
}

/** La clé à garder sur la case pour ce choix dans ce thème : null si la lettre seule donne déjà ce personnage. */
export function cleAGarder(cle: string, theme: NomTheme): string | null {
  const p = lisPersonnage(cle, theme);
  if (!p || /^[A-Z]$/.test(cle)) return null;
  return p.apparence === null && p.def === ennemiDeLaLettre(lettreDe(cle), theme) ? null : cle;
}

export function catalogue(famille: Famille, _theme?: NomTheme): Choix[] {
  switch (famille) {
    case 'tuiles':
      return [
        { famille, cle: '.', nom: 'Mur de fond' },
        ...Object.values(PROPRIETES)
          .filter((p) => p.car !== ' ')
          .map((p) => ({ famille, cle: p.car, nom: majuscule(p.nom) })),
      ];
    case 'gens':
      return gens();
    case 'objets':
      return REPERES.map(([cle, nom]) => ({ famille, cle, nom }));
    case 'decor':
      return Object.keys(ACCESSOIRES).map((cle) => ({ famille, cle, nom: lisible(cle) }));
    case 'modules':
      return [...modulesPerso(), ...MODULES].map((m) => ({
        famille,
        cle: m.id,
        nom: m.nom,
        groupe: m.famille,
      }));
  }
}

/** Le choix qui pose ce caractère de carte (la pipette ; pour un personnage, voir `choixDuPersonnage`). */
export function choixDuCaractere(c: string, theme: NomTheme): Choix | null {
  if (c === ' ') return null;
  if (/[a-z]/.test(c) || BOSS.some(([b]) => b === c)) return choixDuPersonnage(c, undefined, theme);
  const famille: Famille =
    c === '.' || tuileDuCaractere(c) !== null
      ? 'tuiles'
      : /[a-z]/.test(c) || BOSS.some(([b]) => b === c)
        ? 'gens'
        : 'objets';
  return catalogue(famille, theme).find((o) => o.cle === c) ?? null;
}
