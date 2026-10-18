import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Baril, DUREE_MECHE, RAYON_BARIL } from '../src/entites/baril';
import { Partie } from '../src/jeu/partie';

const nouvelle = (niveau: number) => {
  const p = new Partie({ niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

const barils = (p: Partie) => p.entites.filter((e): e is Baril => e instanceof Baril);

/** Le monde attend loin des héros : on amène le héros tout près du baril. */
const pres = (p: Partie, b: Baril) => {
  const j = p.joueurs[0]!;
  j.corps.x = b.corps.x;
  j.corps.y = b.corps.y;
};

describe('le baril explosif', () => {
  it('est posé dans le garage et dans la ville, et nulle part ailleurs', () => {
    expect(barils(nouvelle(0)).length).toBeGreaterThan(0);
    expect(barils(nouvelle(4)).length).toBeGreaterThan(0);
    expect(barils(nouvelle(1))).toHaveLength(0);
  });

  it('explose deux secondes après le premier coup, avec le rayon voulu', () => {
    const p = nouvelle(0);
    const b = barils(p)[0]!;
    pres(p, b);
    p.releveEvenements();
    b.blesse(1, p);
    for (let t = 0; t < DUREE_MECHE - 1; t++) p.avance();
    expect(b.fini).toBe(false);
    p.avance();
    expect(b.fini).toBe(true);
    const explosions = p.releveEvenements().filter((e) => e.k === 'explo');
    expect(explosions).toMatchObject([{ r: RAYON_BARIL }]);
  });

  it("ignore les coups suivants : la mèche n'est allumée qu'une fois", () => {
    const p = nouvelle(0);
    const b = barils(p)[0]!;
    pres(p, b);
    b.blesse(1, p);
    for (let t = 0; t < 60; t++) p.avance();
    b.blesse(1, p);
    for (let t = 0; t < DUREE_MECHE - 60; t++) p.avance();
    expect(b.fini).toBe(true);
  });
});
