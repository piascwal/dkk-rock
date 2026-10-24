import { VERSION } from '../version';

/**
 * Les images du Grand Prix de la Sarré (outils/fixe-kart.py) : les cinq voitures et les cinq DKK vus de dessus. Elles ne se
 * chargent qu'à la première image du Grand Prix : le reste du jeu n'en paie pas le poids.
 */

/** Les voitures et les héros, dans l'ordre des pilotes (JBT, JBM, JBG, Mat, Tom). */
export const VOITURES_KART = ['clio', 'xantia', 'megane', 'corsa', 'r11'] as const;
export const HEROS_KART = ['jbt', 'jbm', 'jbg', 'mat', 'tom'] as const;

const images = new Map<string, HTMLImageElement>();
let lance = false;

function charge(): void {
  lance = true;
  for (const nom of [...VOITURES_KART, ...HEROS_KART]) {
    const img = new Image();
    img.onload = () => images.set(nom, img);
    img.src = `${import.meta.env.BASE_URL}sprites/kart-${nom}.png?v=${VERSION}`;
  }
}

/** L'image d'une voiture ou d'un héros, si elle est chargée (le premier appel lance le chargement). */
export function imageKart(nom: string): HTMLImageElement | undefined {
  if (!lance) charge();
  return images.get(nom);
}
