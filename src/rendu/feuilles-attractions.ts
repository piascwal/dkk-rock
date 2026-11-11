import type { Feuille } from './feuilles';

/**
 * Les images des attractions de la scène (outils/prepare-attractions.py, sources dans assets-sources/decor/attractions/) : les
 * grosses caisses trampolines en bois et en métal, et le tonneau-fusée en métal (la bonbonne : il se couche, clignote, puis part).
 */
const image = (fichier: string, w: number, h: number, densite: number): Feuille => ({
  fichier,
  w,
  h,
  pied: Math.floor(w / 2),
  images: [1],
  rythme: 1,
  densite,
});

export const DECOR_ATTRACTIONS: Record<string, Feuille> = {
  // 15 pixels du jeu de large (129 de planche), 18,5 de haut
  'tonneau-metal': image('tonneau-metal.png', 129, 157, 8.5),
  // 18 pixels de large, 16,7 de haut (rogné sous la dernière ligne pleine : le fût rond est enterré)
  'trampoline-metal': image('trampoline-metal.png', 156, 145, 8.7),
  'trampoline-bois': image('trampoline-bois.png', 156, 145, 8.7),
};
