import { G, type Genre } from '../jeu/vue';
import { FEUILLES_ENNEMIS } from './feuilles-ennemis';
import { FEUILLES_HEROS } from './feuilles-heros';
import { FEUILLES_OBJETS } from './feuilles-objets';

/**
 * Les planches de sprites : des images (PNG à fond transparent) qui remplacent les dessins faits
 * en code, genre par genre. Tant qu'une planche manque ou n'est pas chargée, le dessin en code
 * sert de repli : on peut donc en ajouter une à la fois.
 *
 * Mode d'emploi complet : docs/ASSETS.md.
 */
export interface Feuille {
  /** nom du fichier dans public/sprites/ */
  fichier: string;
  /** taille d'une image de la planche, en pixels */
  w: number;
  h: number;
  /**
   * Nombre d'images de chaque ligne ; la ligne `n` sert à l'animation `n` (valeurs de ANIM :
   * 0 debout, 1 court, 2 saut, 3 échelle, 4 tyrolienne, 5 mur, 6 mort, 7 alerte, 8 perdu,
   * 9 étourdi, 10 attaque). Une ligne à 0 (ou absente) retombe sur la ligne 0.
   */
  images: number[];
  /** durée d'une image, en ticks de 1/60 s (6 par défaut) */
  rythme?: number;
  /**
   * Héros : où poser l'instrument, qui n'est pas sur la planche (il pivote avec la visée) :
   * décalage horizontal depuis le milieu, hauteur de l'épaule au-dessus des pieds, en pixels du jeu.
   */
  epaule?: { x: number; y: number };
  /**
   * Les images de la ligne 0 ne sont pas une animation mais des apparences différentes du même personnage :
   * le jeu en choisit une d'après l'identifiant de l'ennemi (sprites fixes, voir outils/fixe-ennemis.py).
   */
  variantes?: boolean;
  /**
   * Pixels de la planche par pixel du jeu (1 par défaut). À 3, la planche est en pleine définition : le
   * canvas dessine en 3× (voir DENSITE_RENDU), un pixel de la planche vaut un tiers de pixel du jeu.
   */
  densite?: number;
  /** Abscisse (pixels de la planche) du milieu des pieds, si le personnage n'est pas centré dans son image. */
  pied?: number;
  /**
   * Première ligne des images « en visant » (héros dont l'instrument est dans le sprite) : la ligne
   * `visees + code - 1` montre la course ou la pose avec l'instrument orienté selon le code de visée 1 à 4.
   */
  visees?: number;
  /**
   * Animation en cycle (les héros) : `compteur` est une phase de 0 à `cycle` - 1, répartie à parts égales entre les images
   * de la ligne ; sinon `compteur` est un nombre de ticks, une image durant `rythme` ticks.
   */
  cycle?: number;
  /** agrandissement du sprite (1 par défaut) : la planche peut être plus fine que le jeu */
  echelle?: number;
}

/**
 * Les planches fournies. Une entrée par genre (voir `G` dans jeu/vue.ts), par exemple :
 *
 *   [G.JBT]: { fichier: 'jbt.png', w: 38, h: 41, images: [2, 6, 1, 4, 1, 1, 1], rythme: 6 },
 */
export const FEUILLES: Partial<Record<Genre, Feuille>> = {
  ...FEUILLES_ENNEMIS,
  ...FEUILLES_HEROS,
  ...FEUILLES_OBJETS,
  // Fadatchi, fabriqué par outils/anime-kiwi.py : debout 8 images (il respire), court 4, saut 1, coup de bec 4
  [G.KIWI]: {
    fichier: 'fadatchi.png',
    w: 41,
    h: 23,
    images: [8, 4, 1, 0, 0, 0, 0, 0, 0, 0, 4],
    rythme: 5,
    echelle: 0.5,
  },
  // le chauffage soufflant, fabriqué par outils/fixe-chauffage.py : debout 1 image, court 4 (écrasé), saut 1 (étiré), souffle 2 (secoué)
  [G.CHAUFFAGE]: {
    fichier: 'chauffage.png',
    w: 227,
    h: 308,
    images: [1, 4, 1, 0, 0, 0, 0, 0, 0, 0, 2],
    rythme: 5,
    densite: 6,
    echelle: 0.5,
  },
};

/** Pour les tests et la lisibilité : tous les genres de héros. */
export const GENRES_HEROS: Genre[] = [G.JBT, G.JBM, G.JBG, G.MAT, G.TOM];

/** La case de la planche à dessiner : colonne et ligne, pour l'animation `e` à l'instant `compteur`. */
export function caseDeLaPlanche(f: Feuille, e: number, compteur: number): { col: number; ligne: number } {
  // apparences : `compteur` est alors l'identifiant de l'ennemi, il fixe l'apparence une fois pour toutes
  if (f.variantes) return { col: compteur % Math.max(1, f.images[0] ?? 1), ligne: 0 };
  const ligne = (f.images[e] ?? 0) > 0 ? e : 0;
  const n = Math.max(1, f.images[ligne] ?? 1);
  return { col: colonneDuCycle(f, n, compteur), ligne };
}

/** L'image d'une ligne de `n` images à l'instant `compteur` (voir `cycle`). */
export function colonneDuCycle(f: Feuille, n: number, compteur: number): number {
  return (f.cycle ? Math.floor((compteur * n) / f.cycle) : Math.floor(compteur / (f.rythme ?? 6))) % n;
}
