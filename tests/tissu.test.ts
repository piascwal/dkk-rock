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
  it('se tape au clavier avec « / » et se pose dans l’éditeur comme les autres matières', () => {
    expect(PROPRIETES[T.TISSU].car).toBe('/');
    expect(tuileDuCaractere('/')).toBe(T.TISSU);
    expect(PROPRIETES[T.TISSU].solide).toBe(true);
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

  it('côte à côte, les tuiles ne font pas de vague entre elles ; le bord qui reste libre ondule', () => {
    const c = carteDeTissu([
      [1, 1],
      [2, 1],
    ]);
    const cotes = cotesLibres(c, T.TISSU, 1, 1);
    expect(cotes & COTE.DROITE).toBe(0);
    expect(cotes & COTE.GAUCHE).toBe(COTE.GAUCHE);
    expect(cotes & COTE.HAUT).toBe(COTE.HAUT);
    expect(cotes & COTE.BAS).toBe(COTE.BAS);
  });
});
