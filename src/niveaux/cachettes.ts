import { T, proprietes } from '../monde/tuiles';
import { parcoursAcces } from './accessibilite';
import type { NiveauLu, Repere } from './format';
import { NIVEAUX, niveauLu } from './index';
import { TUILE } from '../config';

/**
 * Les cachettes des cartes Sibylle des fontaines : pour pousser à explorer, jamais sur le chemin tout droit. Elles se calculent
 * d'après la carte du niveau (toujours les mêmes, d'une partie à l'autre et chez tous les joueurs) :
 *
 * - le chemin direct est le plus court du départ au van (ou au boss) ; une case compte pour d'autant plus de « détour » qu'il faut
 *   de gestes (pas, sauts, barreaux) pour l'atteindre en partant de ce chemin : pas de carte à moins de DETOUR_MIN gestes ;
 * - quatre sortes de lieux, servies à tour de rôle pour que tout le niveau y passe : les étages des structures (sous un toit,
 *   au-dessus du sol), leurs sommets, le fond des caves, et le reste ; dans chaque sorte, les cases les plus à l'écart d'abord, et
 *   surtout les culs-de-sac (le bout d'un couloir, un toit qu'on atteint par une échelle) ;
 * - toujours accessibles sans rien casser (voir accessibilite.ts), jamais sur l'eau ni une échelle, et loin de ce qui attire
 *   déjà l'œil (tonneaux WOG, cages, armes, médiators, barils, drapeaux, le départ et le van) ;
 * - réparties sur toute la longueur du niveau (une par tranche de 40 colonnes d'abord), puis les meilleures cases restantes.
 */

/** Le terrain d'une colonne : la médiane des sommets sur cette largeur de part et d'autre (en tuiles). */
const DEMI_FENETRE = 15;
/**
 * Le détour minimum d'une carte (en gestes depuis le chemin direct) : d'abord à l'écart, puis un peu moins ; un niveau qui n'en
 * a pas le tiers de ses tranches accepte enfin des cases voisines du chemin (le parc du FISE, tout en plaine).
 */
const DETOURS_MIN = [6, 4];
const DETOUR_REPLI = 1;
/** Le moins de cartes d'un niveau (de plain-pied, si le niveau n'a rien d'autre : le ferry). */
const CARTES_MIN = 3;
/** Autour d'un repère déjà intéressant, pas de carte (en tuiles, de côté et en hauteur). */
const DISTANCE_REPERE: [number, number] = [6, 3];

/** Le nombre de cartes visé dans un niveau : une pour 20 colonnes, de 6 à 36 (moins s'il n'a pas assez d'endroits où les cacher). */
export const nombreDeCartes = (largeur: number): number =>
  Math.max(6, Math.min(36, Math.round(largeur / 20)));
/** L'écart minimum entre deux cartes (en tuiles, la hauteur comptant double), et leur nombre au plus par tranche de 40 colonnes (par tranche de 60 rangées de haut : les Cimes grimpent). */
const ECART = 10;
const PAR_TRANCHE = 3;

interface Candidate {
  tx: number;
  ty: number;
  score: number;
  detour: number;
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

  const detour = detourDuTrace(lu);
  const sorties: Candidate[][] = [[], [], [], []]; // étages, sommets, caves, le reste
  const sol: Candidate[] = []; // à même le sol : le repli d'un niveau plat
  detour.forEach((d, k) => {
    const x = k % L;
    const y = Math.floor(k / L);
    // posée sur du solide (pas une échelle), ni dans l'eau, ni au bord du monde, ni à côté d'un repère
    if (d < 0 || x < 3 || x > L - 4 || !pose(x, y + 1) || proprietes(tuile(x, y + 1)).echelle) return;
    if (tuile(x, y) === T.EAU || tuile(x, y - 1) === T.EAU || tuile(x, y) === T.ECHELLE || pres(x, y)) return;
    sol.push({ tx: x, ty: y, detour: d, score: d });
    if (d < 1) return;
    // un cul-de-sac : aucune case des environs n'est plus loin du chemin que celle-ci
    let boutDeCouloir = true;
    for (let j = -2; j <= 2 && boutDeCouloir; j++)
      for (let i = -3; i <= 3; i++) if (detour[(y + j) * L + x + i]! > d) boutDeCouloir = false;
    // à même le sol, à découvert : c'est le chemin de tout le monde, pas une cachette
    const couvert = sommet[x]! < y;
    if (!couvert && terrain[x]! - y < 3) return;
    const lieu = !couvert ? 1 : y > terrain[x]! + 1 ? 2 : y <= terrain[x]! - 2 ? 0 : 3;
    sorties[lieu]!.push({ tx: x, ty: y, detour: d, score: d + (boutDeCouloir ? 8 : 0) });
  });
  const ordre = (a: Candidate, b: Candidate) => b.score - a.score || a.tx - b.tx || a.ty - b.ty;
  for (const l of sorties) l.sort(ordre);

  // 1. une carte par tranche du niveau (de 40 colonnes) : pas de longue traversée sans rien à chercher ; chaque tranche sert tour à
  //    tour une sorte de lieu (étage, sommet, cave, reste), et s'en passe si elle n'en a pas ;
  // 2. puis, tant qu'il en manque, les meilleures cases restantes (les culs-de-sac d'abord), sorte après sorte, sans jamais en mettre
  //    deux côte à côte ;
  // 3. faute de vrais détours (un parc tout en plaine), des cases voisines du chemin.
  const cible = nombreDeCartes(L);
  const nTranches = Math.max(4, Math.round(L / 40));
  const tranche = L / nTranches;
  const choisies: Candidate[] = [];
  const dansTranche = (c: Candidate) => Math.floor(c.tx / tranche);
  const libre = (c: Candidate) =>
    choisies.every((o) => Math.hypot(o.tx - c.tx, (o.ty - c.ty) * 2) >= ECART) &&
    choisies.filter((o) => dansTranche(o) === dansTranche(c)).length < PAR_TRANCHE * Math.ceil(H / 60);
  const remplit = (seuils: readonly number[]) => {
    for (let t = 0; t < nTranches; t++) {
      const dedans = (c: Candidate) => c.tx >= t * tranche && c.tx < (t + 1) * tranche;
      if (choisies.some(dedans)) continue;
      for (const seuil of seuils) {
        const bons = (l: Candidate[]) => l.find((x) => x.detour >= seuil && dedans(x) && libre(x));
        const c =
          bons(sorties[t % sorties.length]!) ??
          sorties
            .map(bons)
            .filter((x): x is Candidate => !!x)
            .sort(ordre)[0];
        if (c) {
          choisies.push(c);
          break;
        }
      }
    }
  };
  remplit(DETOURS_MIN);
  const complete = (seuil: number, jusque: number) => {
    const listes = sorties.map((l) => l.filter((c) => c.detour >= seuil));
    for (let tour = 0; choisies.length < jusque; tour++) {
      const c = listes
        .map((_, k) => listes[(tour + k) % listes.length]!.find((x) => libre(x)))
        .find((x) => x);
      if (!c) break;
      choisies.push(c);
    }
  };
  complete(DETOURS_MIN[1]!, cible);
  if (choisies.length < Math.ceil(cible / 3)) {
    remplit([DETOUR_REPLI]);
    complete(DETOUR_REPLI, Math.ceil(cible / 3));
  }
  // un niveau plat, sans étage ni cave (le ferry) : à défaut, des cartes à même le pont, réparties sur sa longueur
  for (let k = 1; choisies.length < CARTES_MIN && k <= CARTES_MIN; k++) {
    const x = (k * L) / (CARTES_MIN + 1);
    const c = sol
      .filter((o) => !choisies.includes(o))
      .sort((a, b) => Math.abs(a.tx - x) - Math.abs(b.tx - x))[0];
    if (c) choisies.push(c);
  }
  return choisies.sort((a, b) => a.tx - b.tx).map(({ tx, ty }) => ({ tx, ty, x: tx * TUILE, y: ty * TUILE }));
}

/**
 * Le détour de chaque case (y × largeur + x) : le nombre de gestes qu'il faut, en partant du chemin direct (le plus court du départ
 * au van ou au boss), pour y arriver ; 0 sur le chemin lui-même, -1 s'il est inaccessible.
 */
export function detourDuTrace(lu: NiveauLu): Int32Array {
  const L = lu.largeur;
  const depart = parcoursAcces(lu);
  const but = lu.fin ?? lu.boss.find((b) => b.lettre === 'Z') ?? lu.boss[0];
  let fin = -1;
  if (but)
    depart.dist.forEach((d, k) => {
      const proche = Math.abs((k % L) - but.tx) <= 2 && Math.abs(Math.floor(k / L) - but.ty) <= 1;
      if (d >= 0 && proche && (fin < 0 || d < depart.dist[fin]!)) fin = k;
    });
  const chemin: number[] = [];
  for (let k = fin; k >= 0; k = depart.parent[k]!) chemin.push(k);
  return parcoursAcces(lu, true, chemin.length ? chemin : undefined).dist;
}

const memoire = new Map<number, Repere[]>();

/** Les cachettes du niveau `i` (indice dans NIVEAUX), calculées une fois. */
export function cachettesDuNiveau(i: number): Repere[] {
  let c = memoire.get(i);
  if (!c) {
    // une arène du battle royale n'en a pas : on n'y cherche pas de cartes
    c = i >= 0 && i < NIVEAUX.length && !NIVEAUX[i]!.arene ? cachettes(niveauLu(i)) : [];
    memoire.set(i, c);
  }
  return c;
}
