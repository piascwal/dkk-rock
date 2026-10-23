import { T, proprietes } from '../monde/tuiles';
import { accessibles } from './accessibilite';
import type { NiveauLu, Repere } from './format';
import { NIVEAUX, niveauLu } from './index';
import { TUILE } from '../config';

/**
 * Les cachettes des cartes Sibylle des fontaines : pour pousser à explorer, jamais sur le chemin tout droit. Elles se calculent
 * d'après la carte du niveau (toujours les mêmes, d'une partie à l'autre et chez tous les joueurs) :
 *
 * - au sommet des structures : une case posée sur le haut d'une colonne, nettement au-dessus du terrain alentour ;
 * - au fond des caves : une case sous le terrain (quelque chose au-dessus d'elle), nettement plus bas que lui ;
 *
 * toujours accessibles sans rien casser (voir accessibilite.ts), jamais sur l'eau ni une échelle, et loin de ce qui attire déjà
 * l'œil (tonneaux WOG, cages, armes, médiators, barils, drapeaux, le départ et le van). Les plus hautes et les plus profondes
 * d'abord, sommets et caves en alternance, assez espacées pour couvrir tout le niveau.
 */

/** Le terrain d'une colonne : la médiane des sommets sur cette largeur de part et d'autre (en tuiles). */
const DEMI_FENETRE = 15;
/**
 * Le minimum de tuiles au-dessus (sommet) ou en dessous (cave) du terrain pour qu'une case compte ; un niveau qui en a trop peu
 * (le ferry, court et plat) prend aussi les cases d'une seule tuile d'écart, pour avoir au moins la moitié de ses cartes.
 */
const ECART_MIN = 3;
/** Autour d'un repère déjà intéressant, pas de carte (en tuiles, de côté et en hauteur). */
const DISTANCE_REPERE: [number, number] = [6, 3];

/** Le nombre de cartes d'un niveau : une pour 45 colonnes, de 5 à 12. */
export const nombreDeCartes = (largeur: number): number =>
  Math.max(5, Math.min(12, Math.round(largeur / 45)));

interface Candidate {
  tx: number;
  ty: number;
  score: number;
}

export function cachettes(lu: NiveauLu): Repere[] {
  if (lu.def.miniJeu) return [];
  const { largeur: L, hauteur: H, tuiles } = lu;
  const tuile = (x: number, y: number) => (x < 0 || x >= L || y < 0 || y >= H ? T.VIDE : tuiles[y * L + x]!);
  const pose = (x: number, y: number) => proprietes(tuile(x, y)).solide;
  // le haut de chaque colonne (la première tuile où l'on peut se poser), puis le terrain : sa médiane alentour
  const sommet = Array.from({ length: L }, (_, x) => {
    for (let y = 0; y < H; y++) if (pose(x, y)) return y;
    return H;
  });
  const terrain = sommet.map((_, x) => {
    const f = sommet.slice(Math.max(0, x - DEMI_FENETRE), x + DEMI_FENETRE + 1).sort((a, b) => a - b);
    return f[f.length >> 1]!;
  });

  // ce qui attire déjà l'œil
  const reperes: [number, number][] = [
    ...[lu.depart, lu.fin, lu.embarquement].filter((r): r is Repere => !!r),
    ...lu.cages,
    ...lu.armes,
    ...lu.soins,
    ...lu.barils,
    ...lu.drapeaux,
    ...lu.boss,
  ].map((r) => [r.tx, r.ty]);
  tuiles.forEach((t, k) => {
    if (t === T.TONNEAU_WOG || t === T.TONNEAU_OR) reperes.push([k % L, Math.floor(k / L)]);
  });
  const [dx, dy] = DISTANCE_REPERE;
  const pres = (x: number, y: number) =>
    reperes.some(([rx, ry]) => Math.abs(rx - x) <= dx && Math.abs(ry - y) <= dy);

  const acces = accessibles(lu);
  const sommets: Candidate[] = [];
  const caves: Candidate[] = [];
  acces.forEach((v, k) => {
    const x = k % L;
    const y = Math.floor(k / L);
    // posée sur du solide (pas une échelle), ni dans l'eau, ni au bord du monde, ni à côté d'un repère
    if (!v || x < 3 || x > L - 4 || !pose(x, y + 1) || proprietes(tuile(x, y + 1)).echelle) return;
    if (tuile(x, y) === T.EAU || tuile(x, y - 1) === T.EAU || tuile(x, y) === T.ECHELLE || pres(x, y)) return;
    if (y + 1 === sommet[x] && terrain[x]! - y >= 1) sommets.push({ tx: x, ty: y, score: terrain[x]! - y });
    else if (y + 1 > sommet[x]! && y - terrain[x]! >= 1) caves.push({ tx: x, ty: y, score: y - terrain[x]! });
  });
  const ordre = (a: Candidate, b: Candidate) => b.score - a.score || a.tx - b.tx || a.ty - b.ty;
  sommets.sort(ordre);
  caves.sort(ordre);

  const n = nombreDeCartes(L);
  const ecart = Math.max(10, Math.floor(L / (n * 2)));
  const choisies: Candidate[] = [];
  const libre = (c: Candidate) => choisies.every((o) => Math.abs(o.tx - c.tx) >= ecart);
  const choisit = (seuil: number, jusque: number) => {
    const listes = [sommets, caves].map((l) => l.filter((c) => c.score >= seuil));
    for (let tour = 0; choisies.length < jusque; tour++) {
      const c = (tour % 2 ? [listes[1]!, listes[0]!] : listes).map((l) => l.find(libre)).find((x) => x);
      if (!c) break;
      choisies.push(c);
    }
  };
  choisit(ECART_MIN, n);
  choisit(1, Math.ceil(n / 2));
  return choisies.sort((a, b) => a.tx - b.tx).map(({ tx, ty }) => ({ tx, ty, x: tx * TUILE, y: ty * TUILE }));
}

const memoire = new Map<number, Repere[]>();

/** Les cachettes du niveau `i` (indice dans NIVEAUX), calculées une fois. */
export function cachettesDuNiveau(i: number): Repere[] {
  let c = memoire.get(i);
  if (!c) {
    c = i >= 0 && i < NIVEAUX.length ? cachettes(niveauLu(i)) : [];
    memoire.set(i, c);
  }
  return c;
}
