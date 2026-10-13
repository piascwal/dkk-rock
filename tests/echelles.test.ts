import { describe, expect, it } from 'vitest';
import { litNiveau, type DefNiveau } from '../src/niveaux/format';
import { Carte } from '../src/monde/carte';
import { T } from '../src/monde/tuiles';

const def = (carte: string[]): DefNiveau => ({
  id: 'test',
  titre: 't',
  sousTitre: 's',
  theme: 'garage',
  intro: [],
  dialogues: {},
  outro: [],
  carte,
});

describe('les échelons scellés', () => {
  const lu = litNiveau(def(['   H   ', '   H   ', '   H   ', '   H   ', '   H   ', '@  H  F', '#######']));
  const carte = new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond);

  it('le haut de l’échelle et un barreau sur deux sont incassables', () => {
    const colonne = [0, 1, 2, 3, 4, 5].map((ty) => carte.get(3, ty));
    expect(colonne).toEqual([T.ECHELON, T.ECHELLE, T.ECHELON, T.ECHELLE, T.ECHELON, T.ECHELLE]);
  });

  it('même sous les explosions, il reste de quoi monter de deux tuiles en deux tuiles', () => {
    for (let ty = 0; ty < lu.hauteur; ty++) carte.endommage(3, ty, 999);
    const restes = [0, 1, 2, 3, 4, 5].filter((ty) => carte.get(3, ty) !== T.VIDE);
    expect(restes).toEqual([0, 2, 4]);
    for (let i = 1; i < restes.length; i++) expect(restes[i]! - restes[i - 1]!).toBeLessThanOrEqual(2);
  });
});
