import { G, type Genre } from '../jeu/vue';

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
  /** agrandissement du sprite (1 par défaut) : la planche peut être plus fine que le jeu */
  echelle?: number;
}

/**
 * Les planches fournies. Une entrée par genre (voir `G` dans jeu/vue.ts), par exemple :
 *
 *   [G.JBT]: { fichier: 'jbt.png', w: 38, h: 41, images: [2, 6, 1, 4, 1, 1, 1], rythme: 6 },
 */
const ANIMATIONS_HEROS = [4, 6, 1, 2, 1, 1, 1, 0, 0, 0, 2];

export const FEUILLES: Partial<Record<Genre, Feuille>> = {
  // les héros, fabriqués par outils/anime-heros.py : repos 4, course 6, saut, échelle 2, tyrolienne, mur, mort, tir 2
  [G.JBT]: { fichier: 'jbt.png', w: 38, h: 41, images: ANIMATIONS_HEROS, rythme: 5, epaule: { x: 4, y: 24 } },
  [G.JBM]: { fichier: 'jbm.png', w: 35, h: 41, images: ANIMATIONS_HEROS, rythme: 5, epaule: { x: 4, y: 24 } },
  [G.JBG]: { fichier: 'jbg.png', w: 38, h: 41, images: ANIMATIONS_HEROS, rythme: 5, epaule: { x: 4, y: 24 } },
  [G.MAT]: { fichier: 'mat.png', w: 34, h: 40, images: ANIMATIONS_HEROS, rythme: 5, epaule: { x: 4, y: 24 } },
  [G.TOM]: { fichier: 'tom.png', w: 39, h: 42, images: ANIMATIONS_HEROS, rythme: 5, epaule: { x: 4, y: 24 } },
  // Fadatchi, fabriqué par outils/anime-kiwi.py : debout 8 images (il respire), court 4, saut 1, coup de bec 4
  [G.KIWI]: { fichier: 'fadatchi.png', w: 41, h: 23, images: [8, 4, 1, 0, 0, 0, 0, 0, 0, 0, 4], rythme: 5 },
};

/** Pour les tests et la lisibilité : tous les genres de héros. */
export const GENRES_HEROS: Genre[] = [G.JBT, G.JBM, G.JBG, G.MAT, G.TOM];

/** La case de la planche à dessiner : colonne et ligne, pour l'animation `e` à l'instant `compteur`. */
export function caseDeLaPlanche(f: Feuille, e: number, compteur: number): { col: number; ligne: number } {
  const ligne = (f.images[e] ?? 0) > 0 ? e : 0;
  const n = Math.max(1, f.images[ligne] ?? 1);
  return { col: Math.floor(compteur / (f.rythme ?? 6)) % n, ligne };
}
