import { ANIM, G } from '../jeu/vue';
import { FEUILLES } from './feuilles';
import { FEUILLES_HEROS } from './feuilles-heros';
import { FEUILLES_DECOR } from './feuilles-objets';

/**
 * Le nouveau JBM, à l'essai (mode `?essai`) : ses planches remplacent les anciennes partout où il paraît (en jeu, l'écran titre,
 * l'intro, les cages, la transition du van), son portrait dans les dialogues. Les images sortent de outils/prepare-jbm-essai.py,
 * d'après ses bandes d'animation fournies : repos 4, course 4, saut, échelle 2 temps, mur, tyrolienne 2 temps, à terre.
 * Pas encore de tir ni de visée à lui : le micro reste en main, le cri part quand même.
 */
export const essaiJbm = { actif: false };

/** Densité de ses planches : 6 pixels du jeu valent 162 pixels pour JBM debout (l'ancien en faisait 120). */
const DENSITE = 8.1;

/** Branche le nouveau JBM (au démarrage, avant le chargement des planches). */
export function activeJbmEssai(): void {
  essaiJbm.actif = true;
  const heros = {
    fichier: 'jbm-essai.png',
    w: 166,
    h: 163,
    pied: 83,
    densite: DENSITE,
    images: [4, 4, 1, 0, 0, 0, 1],
    compacte: true,
    rythme: 5,
    cycle: 12,
  };
  FEUILLES_HEROS[G.JBM] = heros;
  FEUILLES[G.JBM] = heros;
  const decor = (cle: string, w: number, h: number, pied: number, images = [1]) => {
    FEUILLES_DECOR[cle] = {
      fichier: `jbm-essai-${cle.slice(4)}.png`,
      w,
      h,
      pied,
      images,
      rythme: 1,
      densite: DENSITE,
    };
  };
  decor('jbm-saut', 95, 141, 47);
  decor('jbm-mur', 90, 157, 56);
  decor('jbm-echelle', 93, 162, 46, [1, 1]);
  decor('jbm-tyrolienne', 133, 145, 66, [1, 1]);
}

/**
 * L'image d'un héros en l'air (`<nom>-saut`) ou sur une tyrolienne : la sienne s'il en a une (`<nom>-tyrolienne`, deux temps
 * qui se balancent), sinon celle du saut. Renvoie son nom et la ligne à dessiner.
 */
export function imageEnLair(nom: string, e: number): [string, number] {
  const tyro = `${nom}-tyrolienne`;
  if (e === ANIM.TYROLIENNE && FEUILLES_DECOR[tyro]) return [tyro, Math.floor(performance.now() / 380) & 1];
  return [`${nom}-saut`, 0];
}
