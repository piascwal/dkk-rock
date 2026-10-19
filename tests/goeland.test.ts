import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { Partie } from '../src/jeu/partie';
import { ANIM, G } from '../src/jeu/vue';

/** Une partie au niveau donné, le héros posé et la première étape passée. */
function partieAu(niveau: number): Partie {
  const p = new Partie({ niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
}

const goelands = (p: Partie) =>
  p.entites.filter((x): x is Ennemi => x instanceof Ennemi && x.def.genre === G.GOELAND);

describe('le goéland (arc breton)', () => {
  it('ne vit que dans les niveaux bretons : le drone reste ailleurs', () => {
    expect(goelands(partieAu(0))).toHaveLength(0);
    expect(goelands(partieAu(6)).length).toBeGreaterThan(0);
  });

  it('plane au-dessus du héros, pique sur lui en prenant l’image d’attaque, puis remonte', () => {
    const p = partieAu(6);
    const e = goelands(p)[0]!;
    const j = p.joueurs[0]!;
    j.invulnerable = 9999;
    Object.assign(e.corps, { x: j.corps.x, y: j.corps.y - 150 });
    e.recharge = 0;
    let plonge = false;
    let remonte = false;
    let avantY = e.corps.y;
    for (let i = 0; i < 120; i++) {
      e.etat = 'attaque';
      e.cible = j;
      e.vuA = p.tick;
      p.avance();
      p.releveEvenements();
      if (e.memoire > 0) {
        plonge = true;
        expect(e.vue().e).toBe(ANIM.ATTAQUE);
        expect(e.corps.y).toBeGreaterThanOrEqual(avantY);
      }
      if (e.memoire < 0) {
        remonte = true;
        expect(e.corps.y).toBeLessThanOrEqual(avantY);
      }
      avantY = e.corps.y;
    }
    expect(plonge).toBe(true);
    expect(remonte).toBe(true);
  });
});
