import { describe, expect, it } from 'vitest';
import { HAUTEUR_VUE } from '../src/config';
import { indicateurVers } from '../src/rendu/indicateurs';

const L = 360;

describe('la flèche vers un équipier hors champ', () => {
  it("n'apparaît pas quand l'équipier est à l'écran", () => {
    expect(indicateurVers(L / 2 + 60, HAUTEUR_VUE / 2 - 20, L, HAUTEUR_VUE)).toBeNull();
    expect(indicateurVers(40, 80, L, HAUTEUR_VUE)).toBeNull();
  });

  it('se colle au bord droit quand il est loin à droite, et regarde vers la droite', () => {
    const i = indicateurVers(L + 500, HAUTEUR_VUE / 2, L, HAUTEUR_VUE)!;
    expect(i.x).toBeCloseTo(L - 12);
    expect(i.y).toBeCloseTo(HAUTEUR_VUE / 2);
    expect(i.angle).toBeCloseTo(0);
  });

  it('se colle au bord bas quand il est tombé plus bas, et regarde vers le bas', () => {
    const i = indicateurVers(L / 2, HAUTEUR_VUE + 300, L, HAUTEUR_VUE)!;
    expect(i.y).toBeCloseTo(HAUTEUR_VUE - 16);
    expect(i.angle).toBeCloseTo(Math.PI / 2);
  });

  it('reste dans le cadre en diagonale, sous la barre du haut', () => {
    const i = indicateurVers(-400, -400, L, HAUTEUR_VUE)!;
    expect(i.x).toBeGreaterThanOrEqual(12 - 1e-6);
    expect(i.y).toBeGreaterThanOrEqual(26 - 1e-6);
    expect(i.angle).toBeLessThan(-Math.PI / 2);
  });
});
