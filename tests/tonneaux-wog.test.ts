import { describe, expect, it } from 'vitest';
import { DUREE_INVINCIBLE, PV_HEROS, QUARTS_PAR_COEUR, TUILE, VIES_DEPART } from '../src/config';
import { Objet } from '../src/entites/objets';
import { Partie } from '../src/jeu/partie';
import { T } from '../src/monde/tuiles';

const nouvelle = (niveau = 0) => {
  const p = new Partie({ niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

const avance = (p: Partie, n: number) => {
  for (let i = 0; i < n; i++) {
    p.commande(0, 0);
    p.avance();
    p.releveEvenements();
  }
};

describe('les tonneaux WOG', () => {
  /** Casse un tonneau posé à côté du héros et rend le cœur qu'il libère. */
  const casse = (type: number, sorte: 'coeur' | 'coeurOr') => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    const tx = Math.floor(j.cx / TUILE) + 3;
    const ty = Math.floor((j.corps.y + j.corps.h) / TUILE) - 1;
    p.carte.pose(tx, ty, type as never);
    p.carte.endommage(tx, ty, 99);
    avance(p, 1);
    const coeur = p.entites.find((e): e is Objet => e instanceof Objet && e.sorte === sorte);
    expect(coeur).toBeDefined();
    return { p, j, coeur: coeur! };
  };
  const ramasse = (p: Partie, j: Partie['joueurs'][number] & object, coeur: Objet) => {
    Object.assign(j.corps, { x: coeur.corps.x, y: coeur.corps.y });
    avance(p, 2);
  };

  it('le cœur jaillit du tonneau, puis retombe au sol', () => {
    const { p, coeur } = casse(T.TONNEAU_WOG, 'coeur');
    const y0 = coeur.corps.y;
    avance(p, 6);
    expect(coeur.corps.y).toBeLessThan(y0);
    avance(p, 120);
    expect(coeur.corps.auSol).toBe(true);
  });

  it('un tonneau WOG libère un cœur qui redonne un point de vie à qui en a perdu', () => {
    const { p, j, coeur } = casse(T.TONNEAU_WOG, 'coeur');
    j.pv = 1;
    ramasse(p, j, coeur);
    expect(j.pv).toBe(1 + QUARTS_PAR_COEUR); // un cœur entier (quatre quarts)
    expect(coeur.fini).toBe(true);
  });

  it('un cœur rend un point de vie (3 au plus) et ne donne jamais de vie : seules les cages en donnent', () => {
    const { p, j, coeur } = casse(T.TONNEAU_WOG, 'coeur');
    const vies = p.vies;
    j.pv = PV_HEROS;
    ramasse(p, j, coeur);
    expect(p.vies).toBe(vies);
    expect(j.pv).toBe(PV_HEROS);
  });

  it("un tonneau d'or libère un cœur d'or : toute la vie, et dix secondes d'invincibilité", () => {
    const { p, j, coeur } = casse(T.TONNEAU_OR, 'coeurOr');
    j.pv = 1;
    ramasse(p, j, coeur);
    expect(j.pv).toBe(PV_HEROS);
    expect(j.invincible).toBeGreaterThan(DUREE_INVINCIBLE - 5);
    expect(p.vue().entites.find((e) => e.id === j.id)?.aura).toBe(true);
    j.blesse(1, p, 1);
    expect(j.pv).toBe(PV_HEROS);
    avance(p, DUREE_INVINCIBLE + 5);
    expect(j.invincible).toBe(0);
    expect(p.vue().entites.find((e) => e.id === j.id)?.aura).toBeFalsy();
  });
});
