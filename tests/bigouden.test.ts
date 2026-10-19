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

const bigoudens = (p: Partie) =>
  p.entites.filter((x): x is Ennemi => x instanceof Ennemi && x.def.genre === G.BIGOUDEN);

describe('la bigoudène (arc breton)', () => {
  it('ne vit que dans les niveaux bretons', () => {
    expect(bigoudens(partieAu(0))).toHaveLength(0);
    expect(bigoudens(partieAu(6)).length).toBeGreaterThan(0);
  });

  it('joue un air de trois notes, souffle, puis recommence', () => {
    const p = partieAu(6);
    const e = bigoudens(p)[0]!;
    const j = p.joueurs[0]!;
    j.invulnerable = 9999;
    Object.assign(j.corps, { x: e.corps.x - 100, y: e.corps.y });
    e.recharge = 0;
    const notesApres = (ticks: number) => {
      for (let i = 0; i < ticks; i++) {
        e.etat = 'attaque';
        e.cible = j;
        e.vuA = p.tick;
        p.avance();
        p.releveEvenements();
      }
      return e.memoire;
    };
    // les trois notes (14 images entre deux), puis la pause de `cadence` images : pas de quatrième note tout de suite
    expect(notesApres(45)).toBe(3);
    expect(notesApres(40)).toBe(3);
    // la pause finie, un second air commence
    expect(notesApres(200)).toBeGreaterThan(3);
  });
});
