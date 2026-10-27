import { ACCESSOIRES, type NomAccessoire } from '../rendu/decor-objets';
import { SPRITES } from '../rendu/decor-sprites';
import { FEUILLES_DECOR } from '../rendu/feuilles-objets';
import type { Pinceau } from '../rendu/pinceau';

/**
 * Les apparences d'un accessoire de décor, pour les choisir à la main dans la palette (voir palette.ts) : celles de sa planche
 * pour un accessoire en image, et pour un accessoire dessiné en code, le nombre de dessins différents qu'il sort pour une
 * apparence de 0 à 11.
 */

const memo = new Map<string, number>();

export function nombreVariantes(nom: string): number {
  let n = memo.get(nom);
  if (n === undefined) {
    n = calcule(nom);
    memo.set(nom, n);
  }
  return n;
}

function calcule(nom: string): number {
  if (SPRITES.has(nom)) return FEUILLES_DECOR[nom]?.images.length ?? 1;
  const dessin = ACCESSOIRES[nom as NomAccessoire] as ((p: Pinceau, v: number) => void) | undefined;
  if (!dessin) return 1;
  const vus = new Set<string>();
  for (let v = 0; v < 12; v++) {
    const traits: string[] = [];
    dessin((x, y, w, h, c) => traits.push(`${x},${y},${w},${h},${c}`), v);
    vus.add(traits.join(';'));
  }
  return vus.size;
}
