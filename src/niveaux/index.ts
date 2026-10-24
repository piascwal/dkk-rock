import { CARTE_STC, DECOR_STC } from './cartes/01-stc';
import { CARTE_ALPAGES } from './cartes/02-alpages';
import { CARTE_CIMES } from './cartes/03-cimes';
import { CARTE_PLAGE, DECOR_PLAGE } from './cartes/04-plage';
import { CARTE_VILLE } from './cartes/05-ville';
import { CARTE_CLUB } from './cartes/06-club';
import { CARTE_FORET } from './cartes/07-foret';
import { CARTE_PORT } from './cartes/08-port';
import { CARTE_GROIX } from './cartes/09-groix';
import { CARTE_FERRY } from './cartes/10-ferry';
import { CARTE_PRE_DU_CLOS } from './cartes/12-pre-du-clos';
import { CARTE_PLONGEON } from './cartes/14-plongeon';
import { CARTE_REVE } from './cartes/15-reve';
import { CARTE_AVION } from './cartes/16-avion';
import { CARTE_TUVES, DECOR_TUVES } from './cartes/13-tuves';
import { ASSAUTS_FISE, CARTE_FISE, DECOR_FISE, ZONES_FISE } from './cartes/11-fise';
import { CARTE_BEAUVAIS } from './cartes/17-beauvais';
import { CARTE_LIMERICK, DECOR_LIMERICK } from './cartes/18-limerick';
import { CARTE_LUND } from './cartes/19-lund';
import { CARTE_NEW_YORK } from './cartes/20-new-york';
import { CARTE_MARSEILLE } from './cartes/21-marseille';
import { litNiveau, type DefNiveau, type NiveauLu } from './format';
import { STC } from './textes/01-stc';
import { ALPAGES } from './textes/02-alpages';
import { CIMES } from './textes/03-cimes';
import { PLAGE } from './textes/04-plage';
import { VILLE } from './textes/05-ville';
import { CLUB } from './textes/06-club';
import { FORET } from './textes/07-foret';
import { PORT } from './textes/08-port';
import { GROIX } from './textes/09-groix';
import { FERRY } from './textes/10-ferry';
import { FISE } from './textes/11-fise';
import { PRE_DU_CLOS } from './textes/12-pre-du-clos';
import { PLONGEON } from './textes/14-plongeon';
import { REVE } from './textes/15-reve';
import { AVION } from './textes/16-avion';
import { TUVES } from './textes/13-tuves';
import { BEAUVAIS } from './textes/17-beauvais';
import { LIMERICK } from './textes/18-limerick';
import { LUND } from './textes/19-lund';
import { NEW_YORK } from './textes/20-new-york';
import { MARSEILLE } from './textes/21-marseille';

/** Les niveaux, arc après arc (voir arcs.ts). Pour en ajouter un : un texte, une carte, une ligne ici. */
export const NIVEAUX: DefNiveau[] = [
  { ...STC, carte: CARTE_STC, decor: DECOR_STC },
  { ...ALPAGES, carte: CARTE_ALPAGES },
  { ...CIMES, carte: CARTE_CIMES },
  { ...PLAGE, carte: CARTE_PLAGE, decor: DECOR_PLAGE },
  { ...VILLE, carte: CARTE_VILLE },
  { ...CLUB, carte: CARTE_CLUB },
  // l'arc breton
  { ...FORET, carte: CARTE_FORET },
  { ...PORT, carte: CARTE_PORT },
  { ...GROIX, carte: CARTE_GROIX },
  // ajouté après coup : il vient avant Groix dans son arc (voir arcs.ts), mais garde la fin de la liste pour ne pas décaler les sauvegardes
  { ...FERRY, carte: CARTE_FERRY },
  // le FISE de Montpellier, après Groix (son propre arc)
  { ...FISE, carte: CARTE_FISE, decor: DECOR_FISE, assauts: ASSAUTS_FISE, zones: ZONES_FISE },
  // le concours de drift du pré du Clos (un mini-jeu), ajouté après coup : il vient juste après le garage dans la tournée
  { ...PRE_DU_CLOS, carte: CARTE_PRE_DU_CLOS },
  // le pont des Tuves, ajouté après coup : il vient juste après Saint-Cézaire dans la tournée
  { ...TUVES, carte: CARTE_TUVES, decor: DECOR_TUVES },
  // le saut du pont des Tuves (un mini-jeu, le concours de plongeon), ajouté après coup : il vient juste après le pont
  { ...PLONGEON, carte: CARTE_PLONGEON },
  // le rêve de JBT (un mini-jeu), ajouté après coup : il vient entre la Ville Autotunée et le Club Infini
  { ...REVE, carte: CARTE_REVE },
  // l'avion de JBG (un mini-jeu), ajouté après coup : il ouvre le Breizh Tour (on prend l'avion pour la Bretagne)
  { ...AVION, carte: CARTE_AVION },
  // l'International Tour, après le FISE : une ville par membre du groupe (voir arcs.ts)
  { ...BEAUVAIS, carte: CARTE_BEAUVAIS },
  { ...LIMERICK, carte: CARTE_LIMERICK, decor: DECOR_LIMERICK },
  { ...LUND, carte: CARTE_LUND },
  { ...NEW_YORK, carte: CARTE_NEW_YORK },
  { ...MARSEILLE, carte: CARTE_MARSEILLE },
];

const lus = new Map<number, NiveauLu>();

/** Le niveau lu (et gardé en mémoire : la carte d'origine ne change jamais). */
export function niveauLu(i: number): NiveauLu {
  let lu = lus.get(i);
  if (!lu) {
    lu = litNiveau(NIVEAUX[i]!);
    lus.set(i, lu);
  }
  return lu;
}
