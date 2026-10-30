import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { G } from '../src/jeu/vue';
import {
  FEUILLES,
  caseDeLaPlanche,
  colonneDuCycle,
  nombreDeRangees,
  rangeeDeLaPlanche,
  type Feuille,
} from '../src/rendu/feuilles';

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

describe('les apparences d’un ennemi', () => {
  const f: Feuille = { fichier: 'x.png', w: 20, h: 40, images: [4], variantes: true };

  it('sont choisies d’après l’identifiant de l’ennemi, toujours les mêmes pour un même ennemi', () => {
    expect(caseDeLaPlanche(f, 1, 7)).toEqual({ col: 3, ligne: 0 });
    expect(caseDeLaPlanche(f, 0, 7)).toEqual(caseDeLaPlanche(f, 9, 7));
  });

  it('se répartissent sur toutes les apparences', () => {
    const vues = new Set(Array.from({ length: 40 }, (_, id) => caseDeLaPlanche(f, 0, id).col));
    expect([...vues].sort()).toEqual([0, 1, 2, 3]);
  });
});

describe('une planche animée à plusieurs apparences', () => {
  // deux apparences côte à côte, chacune un bloc de 8 colonnes : repos 4 images, course 8, étourdi 3
  const f: Feuille = {
    fichier: 'x.png',
    w: 20,
    h: 40,
    images: [4, 8, 0, 0, 0, 0, 0, 0, 0, 3],
    apparences: 2,
  };

  it('garde les lignes des animations et prend le bloc de son apparence', () => {
    expect(caseDeLaPlanche(f, 1, 6, 0)).toEqual({ col: 1, ligne: 1 });
    expect(caseDeLaPlanche(f, 1, 6, 1)).toEqual({ col: 9, ligne: 1 });
    expect(caseDeLaPlanche(f, 9, 0, 3)).toEqual({ col: 8, ligne: 9 });
  });

  it('ne déborde jamais sur le bloc voisin', () => {
    for (let t = 0; t < 100; t++) expect(caseDeLaPlanche(f, 0, t, 0).col).toBeLessThan(4);
  });
});

describe('une planche compacte', () => {
  // repos 4 images (15 ticks chacune), course 8 (6 ticks), étourdi 3 : trois lignes dans le fichier au lieu de dix
  const f: Feuille = {
    fichier: 'x.png',
    w: 20,
    h: 40,
    images: [4, 8, 0, 0, 0, 0, 0, 0, 0, 3],
    compacte: true,
    rythme: 6,
    rythmes: [15, 6, 0, 0, 0, 0, 0, 0, 0, 7],
  };

  it('ne garde que les lignes qui ont des images, dans l’ordre des animations', () => {
    expect(nombreDeRangees(f)).toBe(3);
    expect([0, 1, 9].map((e) => rangeeDeLaPlanche(f, e))).toEqual([0, 1, 2]);
  });

  it('donne à chaque animation sa durée d’image', () => {
    expect(caseDeLaPlanche(f, 0, 14).col).toBe(0);
    expect(caseDeLaPlanche(f, 0, 15).col).toBe(1);
    expect(caseDeLaPlanche(f, 1, 6).col).toBe(1);
    expect(caseDeLaPlanche(f, 9, 14).col).toBe(2);
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
      expect(largeur).toBe(f!.w * Math.max(...f!.images) * (f!.apparences ?? 1));
      expect(hauteur).toBe(f!.h * nombreDeRangees(f!));
      expect(f!.images[0]).toBeGreaterThan(0);
    },
  );
});

describe('le cycle d’animation des héros', () => {
  it('répartit la course à parts égales : chaque image dure autant de ticks', () => {
    const f = FEUILLES[G.TOM]!;
    const duree = new Array<number>(6).fill(0);
    for (let tick = 0; tick < 36; tick++) duree[colonneDuCycle(f, 6, Math.floor(tick / 3) % 12)]!++;
    expect(duree).toEqual([6, 6, 6, 6, 6, 6]);
  });
});
