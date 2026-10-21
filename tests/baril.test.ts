import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Baril, DUREE_MECHE, RAYON_BARIL } from '../src/entites/baril';
import { Projectile } from '../src/entites/projectile';
import { BAGUETTE } from '../src/entites/projectiles-defs';
import { NOTE_AUTOTUNE } from '../src/entites/projectiles-ennemis';
import { Partie } from '../src/jeu/partie';

const nouvelle = (niveau: number) => {
  const p = new Partie({ niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

const barils = (p: Partie) => p.entites.filter((e): e is Baril => e instanceof Baril);

/** Le monde attend loin des héros : on amène le héros tout près du baril. */
const pres = (p: Partie, b: Baril, ecart = 0) => {
  const j = p.joueurs[0]!;
  j.corps.x = b.corps.x - ecart;
  j.corps.y = b.corps.y;
};

describe('le baril explosif', () => {
  it('est posé à Saint-Cézaire et dans la ville, et nulle part ailleurs', () => {
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
    // la sienne (un caisson de basses voisin peut sauter avec lui)
    expect(explosions).toContainEqual(expect.objectContaining({ r: RAYON_BARIL }));
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

  it("n'est visé par personne, mais les tirs des deux camps l'allument", () => {
    for (const [def, camp] of [
      [BAGUETTE, 'heros'],
      [NOTE_AUTOTUNE, 'ennemis'],
    ] as const) {
      const p = nouvelle(0);
      const b = barils(p)[0]!;
      pres(p, b, 120); // le héros à l'écart : le tir ennemi n'a que le baril sur son chemin
      p.avance();
      expect(p.cibles('ennemis')).not.toContain(b);
      expect(p.cibles('heros')).not.toContain(b);
      p.ajoute(new Projectile(p, def, camp, b.corps.x + 7, b.corps.y + 8, 0, 0));
      p.avance();
      for (let t = 0; t < DUREE_MECHE; t++) p.avance();
      expect(b.fini).toBe(true);
    }
  });

  it("s'allume au souffle d'une explosion voisine", () => {
    const p = nouvelle(0);
    const b = barils(p)[0]!;
    pres(p, b);
    p.avance();
    p.explosion(b.corps.x + 20, b.corps.y, 30, 3, 'heros');
    for (let t = 0; t < DUREE_MECHE; t++) p.avance();
    expect(b.fini).toBe(true);
  });
});
