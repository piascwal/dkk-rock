import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { Voltigeur } from '../src/entites/ennemis/voltigeur';
import { Partie } from '../src/jeu/partie';
import { G } from '../src/jeu/vue';

function fise(): Partie {
  const p = new Partie({ niveau: 10, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
}

describe('les riders du FISE', () => {
  it('rôdent dans tout leur module au repos : ils roulent, sautent, et n’en sortent pas', () => {
    const p = fise();
    const j = p.joueurs[0]!;
    const r = p.entites.find((e): e is Ennemi => e instanceof Ennemi && e.def.genre === G.SKATEUR)!;
    let xMin = Infinity;
    let xMax = -Infinity;
    let saute = false;
    for (let i = 0; i < 900; i++) {
      j.invulnerable = 99999;
      // le héros reste à l'écart, hors de vue du rider
      Object.assign(j.corps, { x: r.cx - 400, y: r.corps.y - 20, vx: 0, vy: 0 });
      p.avance();
      p.releveEvenements();
      if (r.fini) break;
      xMin = Math.min(xMin, r.cx);
      xMax = Math.max(xMax, r.cx);
      if (r.corps.vy < -1) saute = true;
    }
    expect(xMax - xMin).toBeGreaterThan(30);
    expect(saute).toBe(true);
    // il reste dans son module (les bornes, à deux pixels près) et y roule sur une bonne partie de sa largeur
    const [gauche, droite] = r.zone!;
    expect(xMin).toBeGreaterThanOrEqual(gauche - 2);
    expect(xMax).toBeLessThanOrEqual(droite + 2);
    expect(xMax - xMin).toBeGreaterThan(3 * TUILE);
  });

  it('un assaut fait tomber des pros du BMX en figure, qui se posent à l’endroit', () => {
    const p = fise();
    const j = p.joueurs[0]!;
    const col = p.lu.def.assauts![0]!;
    j.invulnerable = 99999;
    const n = () => p.entites.filter((e): e is Voltigeur => e instanceof Voltigeur);
    expect(n().length).toBe(0);
    let ty = 0;
    while (!p.carte.props(col, ty).solide) ty++;
    Object.assign(j.corps, { x: col * TUILE + 8, y: ty * TUILE - j.corps.h, vx: 0, vy: 0 });
    for (let i = 0; i < 2; i++) {
      Object.assign(j.corps, { x: col * TUILE + 8 });
      p.avance();
    }
    expect(n().length).toBeGreaterThan(0);
    let tourne = false;
    for (let i = 0; i < 200; i++) {
      j.invulnerable = 99999;
      p.avance();
      p.releveEvenements();
      if (n().some((v) => v.vue().f !== 0)) tourne = true;
    }
    expect(tourne).toBe(true);
    // une fois posés, tous roulent à l'endroit
    expect(n().every((v) => v.fini || v.vue().f === 0)).toBe(true);
  });
});
