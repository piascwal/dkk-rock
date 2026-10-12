import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FEUILLES, caseDeLaPlanche, type Feuille } from '../src/rendu/feuilles';

const f: Feuille = { fichier: 'x.png', w: 32, h: 32, images: [2, 4, 1], rythme: 5 };

describe('les planches de sprites', () => {
  it('choisit la ligne de l’animation et boucle sur ses images', () => {
    expect(caseDeLaPlanche(f, 1, 0)).toEqual({ col: 0, ligne: 1 });
    expect(caseDeLaPlanche(f, 1, 5)).toEqual({ col: 1, ligne: 1 });
    expect(caseDeLaPlanche(f, 1, 20)).toEqual({ col: 0, ligne: 1 });
  });

  it('retombe sur la ligne 0 quand l’animation n’existe pas', () => {
    expect(caseDeLaPlanche(f, 7, 10)).toEqual({ col: 0, ligne: 0 });
    expect(caseDeLaPlanche({ ...f, images: [3] }, 2, 10)).toEqual({ col: 2, ligne: 0 });
  });
});

describe('les planches déclarées', () => {
  it.each(Object.entries(FEUILLES))(
    'le genre %s : le fichier existe et ses dimensions collent à la déclaration',
    (_g, f) => {
      const png = readFileSync(fileURLToPath(new URL(`../public/sprites/${f!.fichier}`, import.meta.url)));
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      const largeur = png.readUInt32BE(16);
      const hauteur = png.readUInt32BE(20);
      expect(largeur).toBe(f!.w * Math.max(...f!.images));
      expect(hauteur).toBe(f!.h * f!.images.length);
      expect(f!.images[0]).toBeGreaterThan(0);
    },
  );
});
