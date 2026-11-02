import { G } from '../jeu/vue';
import { FEUILLES } from './feuilles';
import { FEUILLES_HEROS } from './feuilles-heros';
import { FEUILLES_DECOR } from './feuilles-objets';

/**
 * Le nouveau Mat, à l'essai (mode `?essai`) : ses planches remplacent celles de l'ancien partout où il paraît (en jeu, l'écran
 * titre, l'intro et ses cases de bande dessinée, la découverte des cages, la transition du van), sa Corsa au concours de drift,
 * son portrait dans les dialogues. Les images sortent de outils/prepare-mat-essai.py.
 */
export const essaiMat = { actif: false };

/** Branche le nouveau Mat (au démarrage, avant le chargement des planches). */
export function activeMatEssai(): void {
  essaiMat.actif = true;
  const heros = { ...FEUILLES_HEROS[G.MAT]!, fichier: 'mat-essai.png', w: 124, h: 124, pied: 62 };
  FEUILLES_HEROS[G.MAT] = heros;
  FEUILLES[G.MAT] = heros;
  const decor = (fichier: string, w: number, h: number, pied: number, images = [1]) => ({
    fichier,
    w,
    h,
    pied,
    images,
    rythme: 1,
    densite: 6,
  });
  FEUILLES_DECOR['mat-saut'] = decor('mat-essai-saut.png', 99, 108, 50);
  FEUILLES_DECOR['mat-mur'] = decor('mat-essai-mur.png', 88, 116, 68);
  FEUILLES_DECOR['mat-echelle'] = decor('mat-essai-echelle.png', 82, 128, 41, [1, 1]);
}

/** Le fichier d'une vue de voiture du drift (`<pilote>-<vue>`) : la Corsa du nouveau Mat à l'essai (de trois quarts vers la
 * gauche, le jeu retourne celle vers la droite). */
export function fichierVoiture(nom: string, vue: string): string | null {
  if (!essaiMat.actif || nom !== 'matt') return `drift-${nom}-${vue}.png`;
  return vue === 'biais' ? null : `drift-matt-essai-${vue}.png`;
}
