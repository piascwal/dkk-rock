import { CARTE_GARAGE } from './cartes/01-garage';
import { CARTE_ALPAGES } from './cartes/02-alpages';
import { CARTE_CIMES } from './cartes/03-cimes';
import { CARTE_PLAGE } from './cartes/04-plage';
import { CARTE_VILLE } from './cartes/05-ville';
import { CARTE_CLUB } from './cartes/06-club';
import { CARTE_FORET } from './cartes/07-foret';
import { CARTE_PORT } from './cartes/08-port';
import { CARTE_GROIX } from './cartes/09-groix';
import { CARTE_FERRY } from './cartes/10-ferry';
import { litNiveau, type DefNiveau, type NiveauLu } from './format';
import { GARAGE } from './textes/01-garage';
import { ALPAGES } from './textes/02-alpages';
import { CIMES } from './textes/03-cimes';
import { PLAGE } from './textes/04-plage';
import { VILLE } from './textes/05-ville';
import { CLUB } from './textes/06-club';
import { FORET } from './textes/07-foret';
import { PORT } from './textes/08-port';
import { GROIX } from './textes/09-groix';
import { FERRY } from './textes/10-ferry';

/** Les niveaux, arc après arc (voir arcs.ts). Pour en ajouter un : un texte, une carte, une ligne ici. */
export const NIVEAUX: DefNiveau[] = [
  { ...GARAGE, carte: CARTE_GARAGE },
  { ...ALPAGES, carte: CARTE_ALPAGES },
  { ...CIMES, carte: CARTE_CIMES },
  { ...PLAGE, carte: CARTE_PLAGE },
  { ...VILLE, carte: CARTE_VILLE },
  { ...CLUB, carte: CARTE_CLUB },
  // l'arc breton
  { ...FORET, carte: CARTE_FORET },
  { ...PORT, carte: CARTE_PORT },
  { ...GROIX, carte: CARTE_GROIX },
  // ajouté après coup : il vient avant Groix dans son arc (voir arcs.ts), mais garde la fin de la liste pour ne pas décaler les sauvegardes
  { ...FERRY, carte: CARTE_FERRY },
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
