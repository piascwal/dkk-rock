import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { TremplinMural } from '../src/entites/tremplin-mural';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { NIVEAUX, ajouteNiveauEssai } from '../src/niveaux';

const avance = (p: Partie, n: number, bits = 0) => {
  for (let i = 0; i < n; i++) {
    p.commande(0, bits);
    p.avance();
  }
};
const un = <T>(p: Partie, classe: new (...a: never[]) => T): T =>
  p.entites.find((e) => e instanceof classe) as T;

describe('le trampoline mural', () => {
  /** Un mur à gauche (colonne 5), le trampoline contre lui (colonne 6), le sol dessous, une chute libre au-dessus. */
  const partieMur = () => {
    const carte = [
      ...Array(7).fill('#' + ' '.repeat(40)),
      '#' + ' '.repeat(19) + '@' + ' '.repeat(18) + 'F ',
      '#####`' + ' '.repeat(35),
      '#'.repeat(41),
      'X'.repeat(41),
    ];
    const p = new Partie({
      niveau: ajouteNiveauEssai({ ...NIVEAUX[0]!, id: 'essai-mur', carte, decor: [] }),
      drapeau: -1,
      vies: VIES_DEPART,
      score: 0,
    });
    p.ajouteJoueur(0, 0);
    while (p.phase === 'histoire') p.suivant();
    return p;
  };
  it('lance en cloche, loin du mur, celui qui retombe dessus', () => {
    const p = partieMur();
    const [j, m] = [p.joueurs[0]!, un(p, TremplinMural)];
    avance(p, 5);
    Object.assign(j.corps, { x: 5 * TUILE + 2, y: 7 * TUILE, vx: 0, vy: 1 });
    avance(p, 12);
    expect(j.corps.vx).toBeGreaterThan(1.5);
    expect(m.vue().gauche).toBe(false);
  });
  it('laisse passer qui grimpe (en poussant vers le mur)', () => {
    const p = partieMur();
    const j = p.joueurs[0]!;
    avance(p, 5);
    Object.assign(j.corps, { x: 5 * TUILE + 2, y: 7 * TUILE, vx: 0, vy: 1 });
    avance(p, 6, C.GAUCHE);
    expect(j.corps.vx).toBeLessThan(0.5);
  });
});
