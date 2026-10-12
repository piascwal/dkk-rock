import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { Projectile } from '../src/entites/projectile';
import { T } from '../src/monde/tuiles';
import { angleDuCode, angleVisee, codeVisee } from '../src/entites/visee';
import { EtatCommandes } from '../src/jeu/commandes';

const nouvelle = () => {
  const p = new Partie({ niveau: 0, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 2); // JBG : un seul projectile par tir
  while (p.phase === 'histoire') p.suivant();
  p.entites = [];
  return p;
};

const pas = (p: Partie, n: number, bits: number) => {
  for (let i = 0; i < n; i++) {
    p.commande(0, bits);
    p.avance();
    p.releveEvenements();
  }
};

const tirs = (p: Partie) => p.entites.filter((e): e is Projectile => e instanceof Projectile);

describe('viser', () => {
  it('haut tire droit en l’air, haut et côté en diagonale, bas seulement en l’air', () => {
    const k = new EtatCommandes();
    k.avance(C.HAUT);
    expect(angleVisee(k, false)).toBeCloseTo(Math.PI / 2);
    k.avance(C.HAUT | C.DROITE);
    expect(angleVisee(k, false)).toBeCloseTo(Math.PI / 4);
    k.avance(C.BAS);
    expect(angleVisee(k, false)).toBe(0);
    expect(angleVisee(k, true)).toBeCloseTo(-Math.PI / 2);
    k.avance(C.BAS | C.GAUCHE);
    expect(angleVisee(k, true)).toBeCloseTo(-Math.PI / 4);
    k.avance(0);
    expect(angleVisee(k, true)).toBe(0);
  });

  it('le code réseau de la visée fait l’aller-retour', () => {
    for (const a of [0, Math.PI / 4, Math.PI / 2, -Math.PI / 4, -Math.PI / 2])
      expect(angleDuCode(codeVisee(a))).toBeCloseTo(a);
  });

  it.each([
    ['droit en l’air', C.HAUT, 0, -1],
    ['en diagonale', C.HAUT | C.DROITE, 1, -1],
    ['devant', C.DROITE, 1, 0],
  ])('un tir %s part dans la bonne direction', (_n, bits, sx, sy) => {
    const p = nouvelle();
    pas(p, 3, C.TIR | bits);
    const t = tirs(p)[0]!;
    expect(Math.sign(Math.round(t.vx * 10) / 10)).toBe(sx);
    expect(Math.sign(Math.round(t.vy * 10) / 10)).toBe(sy);
  });
});

describe('le saut contre un mur', () => {
  /** Un mur plein à droite du héros, en l'air à côté. */
  const contreUnMur = () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    const tx = Math.floor(j.cx / TUILE) + 3;
    for (let ty = 0; ty < p.carte.hauteur - 2; ty++) p.carte.pose(tx, ty, T.BETON);
    Object.assign(j.corps, { x: tx * TUILE - j.corps.w - 1, y: 8 * TUILE, vx: 0, vy: 0 });
    j.dir = 1;
    return { p, j };
  };

  it('en poussant à l’opposé : on rebondit loin du mur', () => {
    const { p, j } = contreUnMur();
    pas(p, 1, C.GAUCHE);
    pas(p, 1, C.GAUCHE | C.SAUT);
    expect(j.corps.vx).toBeLessThan(-1);
  });

  it('en poussant vers le mur, ou sans rien : on monte le long du mur', () => {
    for (const bits of [C.DROITE, 0]) {
      const { p, j } = contreUnMur();
      pas(p, 1, bits);
      pas(p, 1, bits | C.SAUT);
      expect(j.corps.vy).toBeLessThan(-3);
      expect(j.corps.vx).toBeGreaterThanOrEqual(0);
    }
  });
});
