import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Champion } from '../src/entites/ennemis/champion';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { Partie } from '../src/jeu/partie';
import { G } from '../src/jeu/vue';

function finale(): { p: Partie; boss: Champion } {
  const p = new Partie({ niveau: 10, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  const boss = p.entites.find((e): e is Champion => e instanceof Champion)!;
  return { p, boss };
}

describe('le Champion du FISE (boss de la finale)', () => {
  it('est dans la finale du FISE, et nulle part ailleurs', () => {
    expect(finale().boss).toBeDefined();
    const p = new Partie({ niveau: 2, drapeau: -1, vies: VIES_DEPART, score: 0 });
    p.ajouteJoueur(0, 0);
    expect(p.entites.some((e) => e instanceof Champion)).toBe(false);
  });

  it('s’éveille quand le héros approche, s’élance, saute en figure, et appelle des riders', () => {
    const { p, boss } = finale();
    const j = p.joueurs[0]!;
    const place = () => {
      j.invulnerable = 99999;
      Object.assign(j.corps, { x: boss.cx - 120, y: boss.corps.y + boss.corps.h - j.corps.h, vx: 0, vy: 0 });
    };
    place();
    let xMin = Infinity;
    let xMax = -Infinity;
    let vuEnAir = false;
    for (let i = 0; i < 900; i++) {
      p.avance();
      p.releveEvenements();
      place();
      xMin = Math.min(xMin, boss.cx);
      xMax = Math.max(xMax, boss.cx);
      if (boss.vue().e === 10) vuEnAir = true;
      if (i === 5) boss.pv = boss.pvMax * 0.5; // à moitié de sa vie : les renforts viennent
    }
    expect(boss.eveille).toBe(true);
    expect(xMax - xMin).toBeGreaterThan(40); // il roule
    expect(vuEnAir).toBe(true); // il saute, en figure
    const riders = p.entites.filter((e): e is Ennemi => e instanceof Ennemi && e.def.genre === G.SKATEUR);
    expect(riders.length).toBeGreaterThan(0);
  });
});
