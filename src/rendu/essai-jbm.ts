import { G } from '../jeu/vue';
import { FEUILLES } from './feuilles';
import { FEUILLES_HEROS } from './feuilles-heros';
import { FEUILLES_DECOR } from './feuilles-objets';

/**
 * JBM plus large, à l'essai (mode `?essai`) : ses planches étirées d'un cinquième en largeur, pour le gabarit des autres héros.
 * Les images sortent de outils/prepare-jbm-essai.py.
 */
export function activeJbmEssai(): void {
  const heros = { ...FEUILLES_HEROS[G.JBM]!, fichier: 'jbm-instrument-essai.png', w: 142, pied: 82 };
  FEUILLES_HEROS[G.JBM] = heros;
  FEUILLES[G.JBM] = heros;
  const decor = (cle: string, fichier: string, w: number, pied: number) => {
    FEUILLES_DECOR[cle] = { ...FEUILLES_DECOR[cle]!, fichier, w, pied };
  };
  decor('jbm-saut', 'jbm-saut-essai.png', 103, 52);
  decor('jbm-mur', 'jbm-mur-essai.png', 173, 113);
  decor('jbm-echelle', 'jbm-echelle-essai.png', 71, 35);
}
