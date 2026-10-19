import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { Partie } from '../src/jeu/partie';

const nouvelle = () => {
  const p = new Partie({ niveau: 0, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

describe('la réaction d’un ennemi touché', () => {
  it('clignote et montre sa barre de vie, puis les deux disparaissent', () => {
    const p = nouvelle();
    const e = p.entites.find((x): x is Ennemi => x instanceof Ennemi && x.def.pv > 1)!;
    const j = p.joueurs[0]!;
    j.corps.x = e.corps.x - 90;
    j.corps.y = e.corps.y;
    p.avance();
    e.blesse(1, p, 1, false);
    expect(e.vue()).toMatchObject({ clignote: true });
    expect(e.vue()!.vie).toBeGreaterThan(0);
    expect(e.vue()!.vie).toBeLessThan(255);
    for (let t = 0; t < 10; t++) p.avance();
    expect(e.vue()).toMatchObject({ clignote: false });
    for (let t = 0; t < 150; t++) p.avance();
    expect(e.vue()!.vie ?? 0).toBe(0);
  });
});
