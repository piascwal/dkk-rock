import { G } from '../jeu/vue';
import type { Feuille } from './feuilles';
import { FEUILLES } from './feuilles';
import { FEUILLES_HEROS } from './feuilles-heros';
import { FEUILLES_DECOR } from './feuilles-objets';

/**
 * Le nouveau JBT, à l'essai (Options → Mode essai) : ses planches remplacent les anciennes partout où il paraît (en jeu, l'écran
 * titre, l'intro, les cages, la transition du van), son portrait dans les dialogues. Les images sortent de
 * outils/prepare-jbt-essai.py : repos 4, course 4, saut, mur, échelle (l'image de dos et son miroir), tyrolienne, à terre.
 */
export const essaiJbt = { actif: false };

/** 161 pixels pour JBT debout (l'ancien en faisait 118, à la densité 6) : la même taille en jeu. */
const DENSITE = 8.19;

const decor = (nom: string, w: number, h: number, pied: number, images = [1]): Feuille => ({
  fichier: `jbt-essai-${nom}.png`,
  w,
  h,
  pied,
  images,
  rythme: 1,
  densite: DENSITE,
});

/** Branche le nouveau JBT (au démarrage, avant le chargement des planches). */
export function activeJbtEssai(): void {
  essaiJbt.actif = true;
  const heros: Feuille = {
    fichier: 'jbt-essai.png',
    w: 166,
    h: 162,
    pied: 83,
    densite: DENSITE,
    images: [4, 4, 1, 0, 0, 0, 1],
    compacte: true,
    rythme: 5,
    cycle: 12,
  };
  FEUILLES_HEROS[G.JBT] = heros;
  FEUILLES[G.JBT] = heros;
  FEUILLES_DECOR['jbt-saut'] = decor('saut', 146, 154, 73);
  FEUILLES_DECOR['jbt-mur'] = decor('mur', 105, 147, 71);
  FEUILLES_DECOR['jbt-echelle'] = decor('echelle', 84, 160, 42, [1, 1]);
  FEUILLES_DECOR['jbt-tyrolienne'] = decor('tyrolienne', 85, 158, 53);
}
