import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { Partie } from '../src/jeu/partie';
import { G } from '../src/jeu/vue';

function partieAu(niveau: number): Partie {
  const p = new Partie({ niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
}

const marins = (p: Partie) =>
  p.entites.filter((x): x is Ennemi => x instanceof Ennemi && x.def.genre === G.MARIN);

describe('le marin (arc breton)', () => {
  it('vit au port et sur l’île, pas dans la forêt ni dans la tournée', () => {
    expect(marins(partieAu(0))).toHaveLength(0);
    expect(marins(partieAu(6))).toHaveLength(0);
    expect(marins(partieAu(7)).length).toBeGreaterThan(0);
    expect(marins(partieAu(8)).length).toBeGreaterThan(0);
  });

  it('marche droit sur le héros, et plus vite pendant son coup de reins', () => {
    const p = partieAu(7);
    const e = marins(p)[0]!;
    const j = p.joueurs[0]!;
    j.invulnerable = 9999;
    Object.assign(j.corps, { x: e.corps.x - 150, y: e.corps.y });
    e.etat = 'attaque';
    e.cible = j;
    let vitesseMax = 0;
    let vitesseMin = Infinity;
    const avant = Math.abs(e.cx - j.corps.x);
    for (let i = 0; i < 120; i++) {
      e.etat = 'attaque';
      e.cible = j;
      e.vuA = p.tick;
      j.corps.x = Math.min(j.corps.x, e.corps.x - 30); // le héros ne bouge pas : on l'empêche de se faire pousser
      p.avance();
      p.releveEvenements();
      if (e.memoire > 0 && Math.abs(e.corps.vx) > 0) {
        vitesseMax = Math.max(vitesseMax, Math.abs(e.corps.vx));
        vitesseMin = Math.min(vitesseMin, Math.abs(e.corps.vx));
      }
    }
    expect(Math.abs(e.cx - j.corps.x)).toBeLessThan(avant);
    expect(vitesseMax).toBeGreaterThan(vitesseMin * 2);
  });
});
