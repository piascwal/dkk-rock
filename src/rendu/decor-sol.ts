import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';

/** Deux voitures ne se suivent jamais de plus près (en tuiles) : un fil rouge du décor, pas un parking. */
export const ECART_VOITURES = 24;

export const SOLS_DECORES: number[] = [
  T.TERRE,
  T.BRIQUE,
  T.NEIGE,
  T.SABLE,
  T.BETON,
  T.ROCHE,
  T.METAL,
  T.BOIS,
  T.GLACE,
  T.PLATEFORME,
  T.PITON,
];

/** Une tuile d'herbe : de la terre à l'air libre (rien de plein au-dessus, pas de paroi de fond). */
export const dehors = (carte: Carte, tx: number, ty: number): boolean =>
  carte.get(tx, ty) === T.TERRE && !carte.solide(tx, ty - 1) && !carte.aFond(tx, ty - 1);

/** Un sol décoré à l'air libre, de n'importe quelle matière (béton des villes compris) : rien de plein au-dessus. */
export const solLibre = (carte: Carte, tx: number, ty: number): boolean =>
  SOLS_DECORES.includes(carte.get(tx, ty)) && !carte.solide(tx, ty - 1) && !carte.aFond(tx, ty - 1);

/**
 * Une échelle à moins de deux tuiles de part et d'autre, et jusqu'à cinq tuiles au-dessus : un accessoire posé là serait
 * dessiné devant elle (ou derrière elle, en la cachant). Les accessoires les plus hauts tiennent dans cette zone.
 */
export const echelleProche = (carte: Carte, tx: number, ty: number): boolean => {
  for (let dx = -2; dx <= 2; dx++)
    for (let dy = 1; dy <= 5; dy++) if (carte.props(tx + dx, ty - dy).echelle) return true;
  return false;
};

/** Les cases qu'un accessoire posé en (tx, ty) occupe : une tuile de part et d'autre, et jusqu'à trois tuiles au-dessus. */
export const emprise = (tx: number, ty: number): [number, number][] => {
  const cases: [number, number][] = [];
  for (let dx = -1; dx <= 1; dx++) for (let dy = 1; dy <= 3; dy++) cases.push([tx + dx, ty - dy]);
  return cases;
};

/**
 * Les grands accessoires du premier arrière-plan (les stands et le half-pipe du FISE) : leur demi-largeur, en tuiles. Ils ne
 * se posent que sur le sol principal du niveau, plat et à ciel ouvert sur toute leur largeur (jamais en l'air, sur un toit ou
 * au fond d'un bowl), en file, avant le reste du décor (voir semeDecor).
 */
export const LARGES: Readonly<Partial<Record<string, number>>> = {
  standBmx: 2,
  standSkate: 2,
  standTrottinette: 2,
  buvette: 1,
  standFringues: 1,
  halfpipe: 5,
};

/** Rien de plein ni de mur de fond au-dessus de la tuile (tx, ty), jusqu'en haut de la carte. */
const cielOuvert = (carte: Carte, tx: number, ty: number): boolean => {
  for (let y = 0; y < ty; y++) if (carte.solide(tx, y) || carte.aFond(tx, y)) return false;
  return true;
};

/** La rangée du sol à ciel ouvert la plus fréquente : le sol principal du niveau (-1 s'il n'y en a pas). */
export function solPrincipal(carte: Carte): number {
  const compte = new Map<number, number>();
  for (let tx = 0; tx < carte.largeur; tx++)
    for (let ty = 1; ty < carte.hauteur; ty++)
      if (carte.solide(tx, ty)) {
        compte.set(ty, (compte.get(ty) ?? 0) + 1);
        break;
      }
  let mieux = -1;
  for (const [ty, n] of compte) if (mieux < 0 || n > compte.get(mieux)!) mieux = ty;
  return mieux;
}

/** Un grand accessoire de demi-largeur `demi` tient en (tx, ty) : le sol principal, plat et à ciel ouvert sur toute sa largeur. */
export function tientLarge(carte: Carte, tx: number, ty: number, demi: number, sol: number): boolean {
  if (ty !== sol) return false;
  for (let dx = -demi; dx <= demi; dx++)
    if (!solLibre(carte, tx + dx, ty) || !cielOuvert(carte, tx + dx, ty)) return false;
  return true;
}
