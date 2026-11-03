import { TUILE } from '../config';
import { Aleatoire } from '../moteur/maths';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import type { Accessoire } from './decor-objets';
import type { Pose } from './decor';
import { FEUILLES_DECOR } from './feuilles-objets';
import type { NomTheme } from './themes';

/**
 * Les panneaux publicitaires : de grandes enseignes (planches fournies) posées au hasard sur le dessus plat des bâtiments qu'on
 * gravit. Chaque panneau a ses catégories (« urbain », « neige »...) et chaque monde les siennes : un panneau ne se pose que
 * dans un monde qui partage au moins une de ses catégories. Un panneau a une ou plusieurs catégories ; un monde aussi.
 */

/**
 * À l'essai : les panneaux n'apparaissent que dans le mode `?essai` (voir main.ts), le temps d'être validés ; pour tous les
 * joueurs, retirer ce réglage (`actifs` toujours vrai).
 */
export const reglagePanneaux = { actifs: false };

/** Branche les panneaux (au démarrage en mode essai, avant le chargement du premier niveau). */
export const activePanneaux = (): void => {
  reglagePanneaux.actifs = true;
};

export type Categorie = 'urbain' | 'nuit' | 'festival' | 'neige' | 'montagne' | 'plage' | 'mer' | 'campagne';

/** Les catégories de chaque monde (à compléter avec les nouveaux mondes) : le panneau de pizza se pose dans l'« urbain ». */
export const CATEGORIES_THEME: Record<NomTheme, readonly Categorie[]> = {
  garage: ['urbain'],
  montagne: ['montagne'],
  neige: ['neige', 'montagne'],
  plage: ['plage', 'mer'],
  ville: ['urbain'],
  club: ['urbain', 'nuit'],
  foret: ['campagne'],
  port: ['mer'],
  groix: ['campagne', 'mer'],
  mer: ['mer'],
  fise: ['festival'],
  stc: ['campagne'],
  tuves: ['campagne'],
  beauvais: ['urbain'],
  limerick: ['urbain'],
  lund: ['urbain'],
  newyork: ['urbain'],
  marseille: ['urbain', 'mer'],
  ottawa: ['urbain', 'neige'],
};

export interface Panneau {
  /** le nom de l'accessoire (et de sa planche dans feuilles-objets.ts) */
  nom: string;
  /** les mondes où il se pose : ceux qui ont au moins une de ces catégories */
  categories: readonly Categorie[];
}

/** Tous les panneaux : un de plus = sa planche (outils/prepare-panneau.py, fixe-objets.py) et une ligne ici. */
export const PANNEAUX: readonly Panneau[] = [{ nom: 'panneauTotoPizz', categories: ['urbain'] }];

/** Les panneaux d'un monde : ceux qui partagent au moins une catégorie avec lui. */
export function panneauxDuTheme(theme: NomTheme): Panneau[] {
  const cats = CATEGORIES_THEME[theme];
  return PANNEAUX.filter((p) => p.categories.some((c) => cats.includes(c)));
}

/** Leur apparence en code, quand la planche n'est pas encore chargée : un cadre clair sur deux pieds. */
const cadre: Accessoire = (p) => {
  p(-34, -8, 3, 8, '#3a3f46');
  p(31, -8, 3, 8, '#3a3f46');
  p(-40, -88, 80, 80, '#2a2a30');
  p(-37, -85, 74, 74, '#f2e2b0');
};
export const ACCESSOIRES_PANNEAUX = { panneauTotoPizz: cadre };

/**
 * Les matières dont on fait un toit plat : le béton, la brique, le métal et les tuiles (jamais la terre ni la pierre des champs),
 * et les pitons qui ponctuent les dalles. Un piton est traversable (jamais « solide ») : ceux d'une rambarde, en bord de toit,
 * ne bouchent pas le ciel ; le panneau se dresse derrière eux.
 */
const TOITS: readonly number[] = [T.BETON, T.BRIQUE, T.TOIT, T.METAL, T.PITON];
/** La chance qu'un toit assez large reçoive un panneau, et l'écart minimal (en tuiles) entre deux panneaux d'un niveau. */
const CHANCE = 0.65;
const ECART = 26;
/** Une marge (tuiles) de chaque côté du panneau sur le toit : on peut passer autour, et il ne frôle pas le bord. */
const MARGE = 1;

/** Les dimensions d'un panneau, en tuiles (d'après sa planche) : largeur impaire, pour que son milieu soit celui d'une tuile. */
export function tuilesDuPanneau(nom: string): { largeur: number; hauteur: number } {
  const f = FEUILLES_DECOR[nom];
  if (!f) return { largeur: 5, hauteur: 6 };
  const largeur = Math.ceil(f.w / (f.densite ?? 1) / TUILE);
  return { largeur: largeur % 2 ? largeur : largeur + 1, hauteur: Math.ceil(f.h / (f.densite ?? 1) / TUILE) };
}

/** Le dessus d'un bâtiment en (tx, ty) : une matière de toit, le ciel au-dessus, un massif dessous (pas une passerelle). */
function estToit(carte: Carte, tx: number, ty: number): boolean {
  if (!TOITS.includes(carte.get(tx, ty))) return false;
  return (
    !carte.solide(tx, ty - 1) &&
    !carte.aFond(tx, ty - 1) &&
    carte.solide(tx, ty + 1) &&
    carte.solide(tx, ty + 2)
  );
}

/**
 * Le bord d'un toit : la colonne voisine tombe dans le vide (trois tuiles sans rien de plein sous la dalle). Une rue qui
 * continue, un sol de plaine ou une marche d'escalier n'ont pas ce bord : ce ne sont pas des toits.
 */
const borde = (carte: Carte, tx: number, ty: number): boolean =>
  tx < 0 || tx >= carte.largeur || [0, 1, 2].every((d) => !carte.solide(tx, ty + d));

/** Tout le ciel au-dessus de [x0, x1] est libre sur `hauteur` tuiles : ni plein, ni mur de fond, ni échelle (on la grimpe). */
function cielLibre(carte: Carte, x0: number, x1: number, ty: number, hauteur: number): boolean {
  for (let x = x0 - 1; x <= x1 + 1; x++)
    for (let y = ty - hauteur; y < ty; y++) {
      if (y < 0) return false;
      if (carte.props(x, y).echelle) return false;
      if (x < x0 || x > x1) continue;
      if (carte.solide(x, y) || carte.aFond(x, y)) return false;
    }
  return true;
}

/**
 * Les panneaux d'un niveau, posés au hasard (toujours aux mêmes endroits pour une même carte) sur les toits plats assez larges
 * des bâtiments, de gauche à droite, avec un écart entre deux. `libre` dit si une case est encore libre de décor, `prend` la
 * réserve : ce que le décor sème ensuite évite le panneau.
 */
export function poseDesPanneaux(
  carte: Carte,
  theme: NomTheme,
  graine: number,
  libre: (x: number, y: number) => boolean,
  prend: (x: number, y: number) => void,
): Pose[] {
  const eligibles = panneauxDuTheme(theme);
  if (!eligibles.length) return [];
  const rng = new Aleatoire(graine * 31 + 7);
  const poses: Pose[] = [];
  let dernier = -ECART;
  // tous les toits plats, d'un seul tenant, rangée après rangée ; on les parcourt de gauche à droite
  const toits: { x0: number; x1: number; ty: number }[] = [];
  for (let ty = 2; ty < carte.hauteur - 2; ty++)
    for (let tx = 1; tx < carte.largeur - 1;) {
      if (!estToit(carte, tx, ty)) {
        tx++;
        continue;
      }
      const x0 = tx;
      while (tx < carte.largeur - 1 && estToit(carte, tx, ty)) tx++;
      if (borde(carte, x0 - 1, ty) || borde(carte, tx, ty)) toits.push({ x0, x1: tx - 1, ty });
    }
  toits.sort((a, b) => a.x0 - b.x0 || a.ty - b.ty);
  for (const { x0, x1, ty } of toits) {
    const panneau = rng.choix(eligibles);
    const { largeur, hauteur } = tuilesDuPanneau(panneau.nom);
    const place = x1 - x0 + 1 - largeur - 2 * MARGE;
    // le tirage a toujours lieu : le reste du niveau ne dépend pas de ce qui s'est posé
    const decalage = rng.entier(0, Math.max(0, place));
    const tire = rng.suivant();
    if (place < 0 || tire > CHANCE) continue;
    const gauche = x0 + MARGE + decalage;
    const centre = gauche + (largeur - 1) / 2;
    if (centre - dernier < ECART) continue;
    if (!cielLibre(carte, gauche, gauche + largeur - 1, ty, hauteur)) continue;
    const cases: [number, number][] = [];
    for (let x = gauche; x < gauche + largeur; x++)
      for (let y = ty - hauteur; y < ty; y++) cases.push([x, y]);
    if (!cases.every(([x, y]) => libre(x, y))) continue;
    for (const [x, y] of cases) prend(x, y);
    dernier = centre;
    poses.push({ tx: centre, ty, quoi: panneau.nom as Pose['quoi'], v: 0, devant: false, dedans: false });
  }
  return poses;
}
