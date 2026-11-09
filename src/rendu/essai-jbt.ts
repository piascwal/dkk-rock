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

/**
 * 161 pixels pour JBT debout (l'ancien en faisait 118, à la densité 6) : 7,6 le fait un peu plus grand que les autres (comme
 * Mat), sa silhouette fine se voit mieux. JBM aussi, en essai (7,5 au lieu de 8,1).
 */
const DENSITE = 7.6;
const DENSITE_JBM = 7.5;

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
  FEUILLES_DECOR['jbt-mur'] = decor('mur', 105, 147, 73);
  FEUILLES_DECOR['jbt-echelle'] = decor('echelle', 84, 160, 42, [1, 1]);
  FEUILLES_DECOR['jbt-tyrolienne'] = decor('tyrolienne', 85, 158, 53);
  // la batterie de l'écran titre en scène (ui/titre-batterie.ts) : seule, JBT qui en joue, puis qui la casse ; une image par ligne
  FEUILLES_DECOR['batterie'] = {
    fichier: 'batterie.png',
    w: 256,
    h: 247,
    pied: 128,
    images: Array(9).fill(1),
    rythme: 1,
  };
  // JBM aussi, un peu plus grand : sa planche et ses images à part
  const jbm = { ...FEUILLES[G.JBM]!, densite: DENSITE_JBM };
  FEUILLES[G.JBM] = jbm;
  FEUILLES_HEROS[G.JBM] = jbm;
  for (const nom of ['jbm-saut', 'jbm-mur', 'jbm-echelle', 'jbm-tyrolienne'])
    FEUILLES_DECOR[nom] = { ...FEUILLES_DECOR[nom]!, densite: DENSITE_JBM };
  // contre la paroi : le pied à 4,2 pixels du jeu du bord, à la nouvelle densité
  FEUILLES_DECOR['jbm-mur']!.pied = 58;
}
