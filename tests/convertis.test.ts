import { describe, expect, it } from 'vitest';
import { GENRES_CONVERTIS, G } from '../src/jeu/vue';
import { NIVEAUX } from '../src/niveaux';
import { etatsDuTrajet, MONDE } from '../src/niveaux/arcs';
import {
  dispose,
  formateTemps,
  genresEmpiles,
  HAUTEUR_SPRITE,
  LARGEUR_SPRITE,
  melange,
  PAS_SPRITES,
} from '../src/ui/pile-convertis';

describe('l’écran des convertis', () => {
  it('empile chaque type autant de fois qu’il a été converti, dans l’ordre des compteurs', () => {
    const c = GENRES_CONVERTIS.map(() => 0);
    c[GENRES_CONVERTIS.indexOf(G.FETARD)] = 2;
    c[GENRES_CONVERTIS.indexOf(G.VIDEUR)] = 1;
    expect(genresEmpiles(c)).toEqual([G.FETARD, G.FETARD, G.VIDEUR]);
    expect(genresEmpiles([])).toEqual([]);
  });

  it('les types sont mélangés, toujours dans le même ordre pour la même pile', () => {
    const c = GENRES_CONVERTIS.map(() => 0);
    c[GENRES_CONVERTIS.indexOf(G.FETARD)] = 8;
    c[GENRES_CONVERTIS.indexOf(G.VIDEUR)] = 8;
    const pile = genresEmpiles(c);
    const m = melange(pile);
    expect(m).toEqual(melange(pile));
    expect(m).not.toEqual(pile);
    expect([...m].sort()).toEqual([...pile].sort());
  });

  it('les sprites se touchent presque, en ligne, et tiennent tous dans l’image, quel que soit leur nombre', () => {
    const un = dispose(2, 900, 300);
    expect(un.echelle).toBe(3);
    expect(un.positions[1]![0] - un.positions[0]![0]).toBe(Math.round(LARGEUR_SPRITE * 3 * PAS_SPRITES)); // à peine recouvert
    expect(un.positions[1]![1]).toBe(un.positions[0]![1]); // sur la même ligne
    for (const n of [1, 12, 80, 400, 3000]) {
      const d = dispose(n, 600, 180);
      expect(d.positions).toHaveLength(n);
      for (const [x, y] of d.positions) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x + LARGEUR_SPRITE * d.echelle).toBeLessThanOrEqual(600 + 1);
        expect(y).toBeGreaterThanOrEqual(-1);
        expect(y + HAUTEUR_SPRITE * d.echelle).toBeLessThanOrEqual(180 + 1);
      }
    }
  });

  it('quand il y a plusieurs lignes, une marge les sépare', () => {
    const d = dispose(80, 600, 300);
    const h = HAUTEUR_SPRITE * d.echelle;
    const lignes = [...new Set(d.positions.map(([, y]) => y))].sort((a, b) => a - b);
    expect(lignes.length).toBeGreaterThan(1);
    for (let k = 1; k < lignes.length; k++) expect(lignes[k]! - lignes[k - 1]!).toBeGreaterThan(h); // pas de recouvrement vertical
    // et d'un sprite au suivant, sur une ligne, l'écart n'est jamais plus grand que la largeur
    const [a, b] = [d.positions[0]!, d.positions[1]!];
    expect(b[0] - a[0]).toBeLessThanOrEqual(LARGEUR_SPRITE * d.echelle);
  });

  it('le temps de la run s’écrit minutes:secondes', () => {
    expect(formateTemps(0)).toBe('0:00');
    expect(formateTemps(187)).toBe('3:07');
    expect(formateTemps(4000)).toBe('66:40');
  });
});

describe('le brouillard de la carte du monde', () => {
  const alpages = NIVEAUX.findIndex((n) => n.id === 'alpages');
  const cimes = NIVEAUX.findIndex((n) => n.id === 'cimes');

  it('au premier passage, tout ce qui est après la destination est sous le brouillard', () => {
    const etats = etatsDuTrajet(0, MONDE[1]!, []);
    expect(etats[0]).toBe('faite');
    expect(etats[1]).toBe('cible');
    expect(etats.slice(2).every((e) => e === 'fermee')).toBe(true);
  });

  it('en rejouant un niveau précédent, ce qui a déjà été dévoilé le reste', () => {
    const k = MONDE.indexOf(cimes);
    const etats = etatsDuTrajet(MONDE[0]!, MONDE[1]!, [MONDE[0]!, alpages, cimes]);
    expect(etats[MONDE.indexOf(alpages)]).toBe('faite');
    expect(etats[k]).toBe('faite');
    expect(etats[k + 1]).toBe('fermee'); // ce qu'on n'a jamais fait reste voilé
  });
});
