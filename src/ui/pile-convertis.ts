import { GENRES_CONVERTIS, type Genre } from '../jeu/vue';
import { Aleatoire } from '../moteur/maths';

/** La case d'un sprite, en pixels du jeu (l'ennemi y est debout, les pieds à 2 pixels du bas). */
export const LARGEUR_SPRITE = 40;
export const HAUTEUR_SPRITE = 44;
/** Le temps pour faire apparaître toute la pile, et l'écart minimal et maximal entre deux sprites (millisecondes). */
export const DUREE_PILE = 5500;
export const ECART_MIN = 6;
export const ECART_MAX = 380;
/** Le pas d'un sprite au suivant, en part de leur largeur, tant que la place le permet : ils se touchent presque sans se couvrir. */
export const PAS_SPRITES = 0.85;
/** La marge entre deux lignes de la pile, en pixels du jeu. */
export const MARGE_LIGNES = 4;

export interface Disposition {
  /** pixels d'écran par pixel du jeu */
  echelle: number;
  /** le coin haut gauche de chaque sprite, en pixels de l'image, dans l'ordre d'apparition */
  positions: [number, number][];
  /** la hauteur que la pile occupe, en pixels de l'image : l'image peut s'y ajuster pour ne pas laisser de vide */
  hauteur: number;
}

/**
 * Où poser `n` sprites dans une image de `largeur` × `hauteur` : en ligne, chacun recouvrant à peine le précédent ; quand la
 * ligne est pleine, une autre commence plus bas, séparée de la première par une petite marge. Plus il y en a, plus on réduit les
 * sprites (en gardant PAS_SPRITES tant que c'est possible), puis on les recouvre davantage, pour que tous tiennent.
 */
export function dispose(n: number, largeur: number, hauteur: number): Disposition {
  const essais = [PAS_SPRITES, 0.65, 0.5, 0.35, 0.25, 0.15, 0.08].flatMap((f) =>
    [3, 2.5, 2, 1.5, 1].map((e) => [e, f] as const),
  );
  let choix: Disposition = { echelle: 1, positions: [], hauteur: 0 };
  for (const [echelle, fraction] of essais) {
    const w = LARGEUR_SPRITE * echelle;
    const h = HAUTEUR_SPRITE * echelle;
    const pasX = Math.max(1, w * fraction);
    const capacite = Math.max(1, Math.floor((largeur - w) / pasX) + 1);
    const rangees = Math.max(1, Math.ceil(n / capacite));
    let pasY = h + MARGE_LIGNES * echelle;
    // pour un nombre énorme (dernier essai), les rangées se recouvrent plutôt que de sortir de l'image
    if (echelle === 1 && fraction === 0.08 && (rangees - 1) * pasY + h > hauteur)
      pasY = rangees > 1 ? Math.max(0, (hauteur - h) / (rangees - 1)) : 0;
    const besoin = (rangees - 1) * pasY + h;
    const positions: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / capacite);
      const dans = Math.min(capacite, n - r * capacite);
      const x0 = (largeur - ((dans - 1) * pasX + w)) / 2;
      positions.push([Math.round(x0 + (i % capacite) * pasX), Math.round((hauteur - besoin) / 2 + r * pasY)]);
    }
    choix = { echelle, positions, hauteur: Math.ceil(Math.min(besoin, hauteur)) };
    if (besoin <= hauteur) break;
  }
  return choix;
}

/** Les genres à empiler, dans l'ordre : chaque type autant de fois qu'il a été converti. */
export function genresEmpiles(convertis: readonly number[]): Genre[] {
  return GENRES_CONVERTIS.flatMap((genre, i) =>
    Array<Genre>(Math.max(0, convertis[i] ?? 0)).fill(genre as Genre),
  );
}

/** Mélange les genres, toujours dans le même ordre pour la même pile (hôte et invités voient la même chose). */
export function melange(genres: readonly Genre[]): Genre[] {
  const r = new Aleatoire(genres.length * 7919 + 17);
  const m = [...genres];
  for (let i = m.length - 1; i > 0; i--) {
    const j = r.entier(0, i);
    [m[i], m[j]] = [m[j]!, m[i]!];
  }
  return m;
}

/** « 3:07 » : le temps de la run. */
export function formateTemps(secondes: number): string {
  const s = Math.max(0, Math.floor(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
