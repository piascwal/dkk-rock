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

  it('plane à hauteur d’écran sans image d’attaque, prévient, pique sur le héros puis remonte', () => {
    const p = partieAu(6);
    const e = goelands(p)[0]!;
    const j = p.joueurs[0]!;
    j.invulnerable = 9999;
    Object.assign(e.corps, { x: j.corps.x, y: j.corps.y - 150 });
    e.recharge = 0;
    let preavis = 0;
    let plonge = false;
    let remonte = false;
    let avantY = e.corps.y;
    for (let i = 0; i < 400; i++) {
      e.etat = 'attaque';
      e.cible = j;
      e.vuA = p.tick;
      p.avance();
      p.releveEvenements();
      const ecart = j.corps.y + j.corps.h / 2 - e.cy; // de combien il est au-dessus du héros
      if (e.memoire === 0 && !plonge) {
        // en vol ou en préavis : l'image de vol, et à hauteur d'écran une fois descendu
        expect(e.vue().e).not.toBe(ANIM.ATTAQUE);
        if (e.minuteur > 0) {
          preavis++;
          expect(ecart).toBeGreaterThan(20);
          expect(ecart).toBeLessThan(60);
        }
      }
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
    // un préavis d'au moins une demi-seconde avant le piqué
    expect(preavis).toBeGreaterThanOrEqual(30);
    expect(plonge).toBe(true);
    expect(remonte).toBe(true);
  });
});
