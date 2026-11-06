import { TUILE } from '../config';
import { Aleatoire } from '../moteur/maths';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import type { Accessoire } from './decor-objets';
import type { Pose } from './decor';
import { FEUILLES_DECOR } from './feuilles-objets';

/**
 * Les panneaux publicitaires : de grandes enseignes (planches fournies) posées au hasard sur le dessus plat des bâtiments qu'on
 * gravit, dans tous les niveaux qui en ont. Chacun passe une fois avant que l'un se répète. Un panneau peut avoir une « suite » :
 * un second panneau toujours posé près de lui, à sa droite (les deux « Vermi-fin » : « Ma vie a changé... » puis « Pour ceux qui
 * ne le savent pas... ») ; l'un ne va jamais sans l'autre.
 */

export interface Panneau {
  /** le nom de l'accessoire (et de sa planche dans feuilles-objets.ts) */
  nom: string;
  /** le nom du panneau qui le suit : posé à sa droite, à quarante tuiles au plus, ou aucun des deux */
  suite?: string;
}

/**
 * Les panneaux qui se tirent au hasard : un de plus = sa planche (outils/prepare-panneau.py, outils/fixe-objets.py), une ligne
 * ici, son nom dans `ACCESSOIRES_PANNEAUX`, `Sprite` et `SPRITES` (decor-sprites.ts).
 */
export const PANNEAUX: readonly Panneau[] = [
  { nom: 'panneauTotoPizz' },
  { nom: 'panneauPiles' },
  { nom: 'panneauGouttes' },
  { nom: 'panneauRadio' },
  { nom: 'panneauVermiVie', suite: 'panneauVermiSavent' },
  { nom: 'panneauGrenaprot' },
  { nom: 'panneauFlipper' },
];

/** Tous les accessoires panneaux, les suites comprises. */
export const NOMS_PANNEAUX: readonly string[] = PANNEAUX.flatMap((p) =>
  p.suite ? [p.nom, p.suite] : [p.nom],
);

/** Leur apparence en code, quand la planche n'est pas encore chargée : un cadre clair sur deux pieds. */
const cadre: Accessoire = (p) => {
  p(-34, -8, 3, 8, '#3a3f46');
  p(31, -8, 3, 8, '#3a3f46');
  p(-40, -88, 80, 80, '#2a2a30');
  p(-37, -85, 74, 74, '#f2e2b0');
};
export const ACCESSOIRES_PANNEAUX = {
  panneauTotoPizz: cadre,
  panneauPiles: cadre,
  panneauGouttes: cadre,
  panneauRadio: cadre,
  panneauVermiVie: cadre,
  panneauVermiSavent: cadre,
  panneauGrenaprot: cadre,
  panneauFlipper: cadre,
};

/**
 * Les matières dont on fait un toit plat : le béton, la brique, le métal et les tuiles (jamais la terre ni la pierre des champs),
 * et les pitons qui ponctuent les dalles. Un piton est traversable (jamais « solide ») : ceux d'une rambarde, en bord de toit,
 * ne bouchent pas le ciel ; le panneau se dresse derrière eux.
 */
const TOITS: readonly number[] = [T.BETON, T.BRIQUE, T.TOIT, T.METAL, T.PITON];
/** Les matières d'un sol de plaine : une longue ligne droite et plate en porte aussi, même sans bord. */
const SOLS: readonly number[] = [...TOITS, T.TERRE, T.NEIGE, T.SABLE, T.ROCHE, T.PIERRE, T.PARC];
/** La longueur (tuiles) à partir de laquelle une ligne plate, même sans bord de toit, reçoit des panneaux. */
const LONGUE = 40;
/** La chance qu'un toit assez large reçoive un panneau, et l'écart minimal (en tuiles) entre deux panneaux (sans leur suite). */
const CHANCE = 0.65;
const ECART = 26;
/** Une marge (tuiles) de chaque côté du panneau sur le toit : on peut passer autour, et il ne frôle pas le bord. */
const MARGE = 1;
/** À quelle distance au plus (tuiles) un panneau et sa suite se posent l'un de l'autre. */
const DISTANCE_SUITE = 40;

/** Les dimensions d'un panneau, en tuiles (d'après sa planche) : largeur impaire, pour que son milieu soit celui d'une tuile. */
export function tuilesDuPanneau(nom: string): { largeur: number; hauteur: number } {
  const f = FEUILLES_DECOR[nom];
  if (!f) return { largeur: 5, hauteur: 6 };
  const largeur = Math.ceil(f.w / (f.densite ?? 1) / TUILE);
  return { largeur: largeur % 2 ? largeur : largeur + 1, hauteur: Math.ceil(f.h / (f.densite ?? 1) / TUILE) };
}

/** Le dessus plat en (tx, ty) : une matière de sol, le ciel au-dessus, un massif dessous (pas une passerelle). */
function estToit(carte: Carte, tx: number, ty: number): boolean {
  if (!SOLS.includes(carte.get(tx, ty))) return false;
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

/** Un emplacement trouvé pour un panneau : sa première colonne, le milieu, et les cases qu'il prend. */
interface Place {
  gauche: number;
  centre: number;
  ty: number;
  cases: [number, number][];
}

/**
 * Cherche où poser `nom` sur le toit : à partir d'une colonne tirée au hasard, la première où le ciel est libre et les cases
 * sont libres de décor. `gaucheMin` : sa première colonne ne peut pas être avant celle-ci.
 */
function cherche(
  carte: Carte,
  toit: { x0: number; x1: number; ty: number },
  nom: string,
  rng: Aleatoire,
  dispo: (x: number, y: number) => boolean,
  gaucheMin?: number,
): Place | null {
  const { largeur, hauteur } = tuilesDuPanneau(nom);
  const marge = toit.x1 - toit.x0 + 1 - largeur - 2 * MARGE;
  if (marge < 0) return null;
  const depart = rng.entier(0, marge);
  for (let k = 0; k <= marge; k++) {
    const gauche = toit.x0 + MARGE + ((depart + k) % (marge + 1));
    const centre = gauche + (largeur - 1) / 2;
    if (gaucheMin !== undefined && gauche < gaucheMin) continue;
    if (!cielLibre(carte, gauche, gauche + largeur - 1, toit.ty, hauteur)) continue;
    const cases: [number, number][] = [];
    for (let x = gauche; x < gauche + largeur; x++)
      for (let y = toit.ty - hauteur; y < toit.ty; y++) cases.push([x, y]);
    if (cases.every(([x, y]) => dispo(x, y))) return { gauche, centre, ty: toit.ty, cases };
  }
  return null;
}

/**
 * Les panneaux d'un niveau, posés au hasard (toujours aux mêmes endroits pour une même carte) sur les toits plats assez larges
 * des bâtiments, de gauche à droite, avec un écart entre deux. `libre` dit si une case est encore libre de décor, `prend` la
 * réserve : ce que le décor sème ensuite évite le panneau.
 */
export function poseDesPanneaux(
  carte: Carte,
  graine: number,
  libre: (x: number, y: number) => boolean,
  prend: (x: number, y: number) => void,
): Pose[] {
  const rng = new Aleatoire(graine * 31 + 7);
  const poses: Pose[] = [];
  const miens = new Set<number>();
  const cle = (x: number, y: number) => y * 4096 + x;
  const dispo = (x: number, y: number) => libre(x, y) && !miens.has(cle(x, y));
  const pose = (nom: string, p: Place) => {
    for (const [x, y] of p.cases) {
      prend(x, y);
      miens.add(cle(x, y));
    }
    poses.push({ tx: p.centre, ty: p.ty, quoi: nom as Pose['quoi'], v: 0, devant: false, dedans: false });
  };
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
      const toitNet = [...Array(tx - x0).keys()].every((k) => TOITS.includes(carte.get(x0 + k, ty)));
      // un toit (bord dans le vide) ; ou une longue ligne plate, quelle que soit la matière
      if ((toitNet && (borde(carte, x0 - 1, ty) || borde(carte, tx, ty))) || tx - x0 >= LONGUE)
        toits.push({ x0, x1: tx - 1, ty });
    }
  toits.sort((a, b) => a.x0 - b.x0 || a.ty - b.ty);
  // chacun passe une fois avant que l'un se répète
  let restants: Panneau[] = [];
  let dernier = -ECART;
  for (const [i, toit] of toits.entries()) {
    if (restants.length === 0) restants = [...PANNEAUX];
    const panneau = rng.choix(restants);
    if (rng.suivant() > CHANCE) continue;
    const place = cherche(carte, toit, panneau.nom, rng, dispo);
    if (!place || place.centre - dernier < ECART) continue;
    if (!panneau.suite) {
      pose(panneau.nom, place);
      dernier = place.centre;
      restants = restants.filter((p) => p !== panneau);
      continue;
    }
    // un panneau et sa suite : posés ensemble, la suite à droite du premier (une tuile d'écart au moins) et près de lui, sur le même toit ou un des suivants ; ou aucun
    const reserve = new Set(miens);
    for (const [x, y] of place.cases) miens.add(cle(x, y));
    let suite: Place | null = null;
    for (const t of toits.slice(i)) {
      if (t.x0 > place.centre + DISTANCE_SUITE) break;
      suite = cherche(
        carte,
        t,
        panneau.suite,
        rng,
        dispo,
        place.gauche + tuilesDuPanneau(panneau.nom).largeur + 1,
      );
      if (suite && suite.centre - place.centre <= DISTANCE_SUITE) break;
      suite = null;
    }
    miens.clear();
    for (const k of reserve) miens.add(k);
    if (!suite) continue;
    pose(panneau.nom, place);
    pose(panneau.suite, suite);
    dernier = suite.centre;
    restants = restants.filter((p) => p !== panneau);
  }
  return poses;
}
