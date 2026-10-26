import { CARTES_ARENES, DEPARTS_ARENES } from './cartes/arenes';
import type { DefNiveau } from './format';
import type { NomTheme } from '../rendu/themes';

/**
 * Les cartes du battle royale (générées par outils/arenes.py) : petites et tout en hauteur, faites pour se croiser. Elles
 * viennent après les niveaux de l'histoire dans NIVEAUX, hors de tout arc : on ne les joue qu'en battle royale.
 */
const arene = (id: string, titre: string, sousTitre: string, theme: NomTheme): DefNiveau => ({
  id: `arene-${id}`,
  titre,
  sousTitre,
  theme,
  intro: [],
  dialogues: {},
  outro: [],
  arene: true,
  departs: DEPARTS_ARENES[id],
  carte: CARTES_ARENES[id]!,
});

export const ARENES: DefNiveau[] = [
  arene(
    'tour-de-mixage',
    'La Tour de Mixage',
    'Quatre étages de club et deux tours, reliés par les airs',
    'club',
  ),
  arene(
    'echafaudages',
    'Les Échafaudages',
    'Un chantier en hauteur, des planchers troués, une tyrolienne qui ondule',
    'garage',
  ),
  arene('port', 'Le Port', 'Deux bateaux à quai, leurs mâts, un bassin au milieu', 'port'),
  arene(
    'sommet',
    'Le Sommet',
    'Une montagne creusée de grottes, une tyrolienne d’une vallée à l’autre',
    'neige',
  ),
];
