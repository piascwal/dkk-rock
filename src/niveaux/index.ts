import { CARTE_GARAGE } from './cartes/01-garage';
import { CARTE_ALPAGES } from './cartes/02-alpages';
import { CARTE_CIMES } from './cartes/03-cimes';
import { CARTE_PLAGE } from './cartes/04-plage';
import { CARTE_VILLE } from './cartes/05-ville';
import { CARTE_CLUB } from './cartes/06-club';
import { litNiveau, type DefNiveau, type NiveauLu } from './format';
import { GARAGE } from './textes/01-garage';
import { ALPAGES } from './textes/02-alpages';
import { CIMES } from './textes/03-cimes';
import { PLAGE } from './textes/04-plage';
import { VILLE } from './textes/05-ville';
import { CLUB } from './textes/06-club';

/** Les niveaux, dans l'ordre de la tournée. Pour en ajouter un : un texte, une carte, une ligne ici. */
export const NIVEAUX: DefNiveau[] = [
  { ...GARAGE, carte: CARTE_GARAGE },
  { ...ALPAGES, carte: CARTE_ALPAGES },
  { ...CIMES, carte: CARTE_CIMES },
  { ...PLAGE, carte: CARTE_PLAGE },
  { ...VILLE, carte: CARTE_VILLE },
  { ...CLUB, carte: CARTE_CLUB },
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
