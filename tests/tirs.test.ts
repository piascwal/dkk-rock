import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Partie } from '../src/jeu/partie';
import { Projectile } from '../src/entites/projectile';
import { BAGUETTE, ONDE_CRI } from '../src/entites/projectiles-defs';
import { DROP, NOTE_AUTOTUNE } from '../src/entites/projectiles-ennemis';

const nouvelle = () => {
  const p = new Partie({ niveau: 0, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

/** Pose un tir de héros et un tir ennemi au même endroit, loin de tout, et laisse la partie les croiser. */
function croise(ennemi: typeof DROP, heros: typeof BAGUETTE) {
  const p = nouvelle();
  const j = p.joueurs[0]!.corps;
  const x = j.x + 120;
  const y = j.y - 40;
  const a = new Projectile(p, heros, 'heros', x, y, 0, 0);
  const b = new Projectile(p, ennemi, 'ennemis', x, y, 0, 0);
  p.ajoute(a);
  p.ajoute(b);
  p.avance();
  return { a, b };
}

describe('les tirs entre eux', () => {
  it('un tir de héros arrête un petit tir ennemi, et s’y use', () => {
    const { a, b } = croise(NOTE_AUTOTUNE, BAGUETTE);
    expect(b.fini).toBe(true);
    expect(a.fini).toBe(true);
  });

  it('un tir qui perce arrête le tir ennemi et continue', () => {
    const { a, b } = croise(NOTE_AUTOTUNE, ONDE_CRI);
    expect(b.fini).toBe(true);
    expect(a.fini).toBe(false);
  });

  it('une grosse bombe n’est pas arrêtée par un tir de héros', () => {
    const { a, b } = croise(DROP, BAGUETTE);
    expect(b.fini).toBe(false);
    expect(a.fini).toBe(false);
  });
});
