import { describe, expect, it } from 'vitest';
import { caseDeLaPlanche, type Feuille } from '../src/rendu/feuilles';

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
