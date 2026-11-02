import { describe, expect, it } from 'vitest';
import { TUILE } from '../src/config';
import { Carte } from '../src/monde/carte';

// une carte de 6 × 8 : un sol épais de 2 rangées à gauche (rangées 4-5), un gouffre au milieu, un sol plus profond à droite
const T = 1; // de la terre
const lignes = ['......', '......', '......', '......', 'TT..TT', 'TT..TT', '....TT', '......'];
const tuiles = lignes.flatMap((l) => [...l].map((c) => (c === 'T' ? T : 0)));

describe('le plancher (Carte.plancher)', () => {
  it("au bas de la carte tant qu'elle n'est pas allégée", () => {
    const c = new Carte(6, 8, tuiles);
    expect(c.plancher(0)).toBe(8 * TUILE);
  });
  it('au bas du terrain le moins profond alentour ; le gouffre ne compte pas', () => {
    const c = new Carte(6, 8, tuiles);
    c.plancherActif = true;
    expect(c.plancherEntre(0, 1)).toBe(6 * TUILE);
    expect(c.plancherEntre(4, 5)).toBe(7 * TUILE);
    expect(c.plancherEntre(2, 3)).toBe(8 * TUILE); // rien que le gouffre : le bas de la carte
    expect(c.plancherEntre(0, 5)).toBe(6 * TUILE);
  });
});
