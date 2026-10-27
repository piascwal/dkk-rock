import { describe, expect, it } from 'vitest';
import { Carte } from '../src/monde/carte';
import { PROPRIETES, T, tuileDuCaractere } from '../src/monde/tuiles';
import { COTE, cotesLibres } from '../src/rendu/bords-tuiles';

/** Une carte de n × n cases où seul le tissu (et le bloc du centre) est plein. */
function carteDeTissu(cases: [number, number][]): Carte {
  const n = 5;
  const tuiles = new Uint8Array(n * n);
  for (const [x, y] of cases) tuiles[y * n + x] = T.TISSU;
  return new Carte(n, n, tuiles, new Uint8Array(n * n));
}

describe('le tissu', () => {
  it('se tape au clavier avec « / » (tissu) et « \\ » (voile blanche), et se pose dans l’éditeur comme les autres matières', () => {
    expect(PROPRIETES[T.TISSU].car).toBe('/');
    expect(tuileDuCaractere('/')).toBe(T.TISSU);
    expect(tuileDuCaractere('\\')).toBe(T.TISSU_BLANC);
    expect(PROPRIETES[T.TISSU_BLANC].solide).toBe(true);
  });

  it('la voile blanche ondule au bord libre, comme le tissu', () => {
    const c = carteDeTissu([]);
    c.pose(1, 1, T.TISSU_BLANC);
    c.pose(2, 1, T.TISSU_BLANC);
    expect(cotesLibres(c, T.TISSU_BLANC, 1, 1) & COTE.DROITE).toBe(0);
    expect(cotesLibres(c, T.TISSU_BLANC, 2, 1) & COTE.GAUCHE).toBe(0);
    expect(cotesLibres(c, T.TISSU_BLANC, 1, 1) & COTE.BAS).toBe(COTE.BAS);
  });

  it('une tuile de tissu entourée de tissu n’a aucun bord libre : pas de vague', () => {
    const c = carteDeTissu([
      [1, 1],
      [0, 1],
      [2, 1],
      [1, 0],
      [1, 2],
    ]);
    expect(cotesLibres(c, T.TISSU, 1, 1)).toBe(0);
  });

  it('seul le bas ondule, et seulement quand rien ne le continue : ni côtés ni haut, pas de vague entre deux tuiles', () => {
    const c = carteDeTissu([
      [1, 1],
      [2, 1],
    ]);
    expect(cotesLibres(c, T.TISSU, 1, 1)).toBe(COTE.BAS);
    expect(cotesLibres(c, T.TISSU, 2, 1)).toBe(COTE.BAS);
    c.pose(1, 2, T.TISSU);
    expect(cotesLibres(c, T.TISSU, 1, 1)).toBe(0);
  });
});
