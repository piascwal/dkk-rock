import { G } from '../jeu/vue';
import { FEUILLES } from './feuilles';
import { FEUILLES_HEROS } from './feuilles-heros';
import { FEUILLES_DECOR } from './feuilles-objets';

/**
 * Le nouveau Mat, à l'essai (mode `?essai`) : ses planches remplacent celles de l'ancien partout où il paraît (en jeu, l'écran
 * titre, l'intro et ses cases de bande dessinée, la découverte des cages, la transition du van), son portrait dans les
 * dialogues. Les images sortent de outils/prepare-mat-essai.py, puis outils/anime-instrument.py mat-essai (la planche du héros :
 * la marche et la visée, la basse et les bras pivotant ensemble).
 */
export const essaiMat = { actif: false };

/** Pixels de planche par pixel du jeu (6 pour les autres héros) : plus petit, c'est un Mat plus grand. */
const DENSITE = 5.6; // en jeu (la course, le tir) : un dixième de plus
const DENSITE_ESCALADE = 4.3; // l'échelle et la paroi : un tiers de plus, son image est étroite et il paraissait petit
const DENSITE_SAUT = 5.2;

/** Branche le nouveau Mat (au démarrage, avant le chargement des planches). */
export function activeMatEssai(): void {
  essaiMat.actif = true;
  const heros = {
    ...FEUILLES_HEROS[G.MAT]!,
    fichier: 'mat-essai-instrument.png',
    w: 127,
    h: 120,
    pied: 68,
    densite: DENSITE,
  };
  FEUILLES_HEROS[G.MAT] = heros;
  FEUILLES[G.MAT] = heros;
  const decor = (
    cle: string,
    fichier: string,
    w: number,
    h: number,
    pied: number,
    densite: number,
    images = [1],
  ) => {
    FEUILLES_DECOR[cle] = { fichier, w, h, pied, images, rythme: 1, densite };
  };
  decor('mat-saut', 'mat-essai-saut.png', 92, 97, 46, DENSITE_SAUT);
  decor('mat-mur', 'mat-essai-mur.png', 61, 112, 36, DENSITE_ESCALADE);
  decor('mat-echelle', 'mat-essai-echelle.png', 52, 118, 26, DENSITE_ESCALADE, [1, 1]);
}
