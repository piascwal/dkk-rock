import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { T } from '../src/monde/tuiles';

/** Un ciel dégagé, une tyrolienne qui descend vers la droite, le héros accroché près de son milieu. */
function surLeCable(pente = true) {
  const p = new Partie({ niveau: 0, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  p.entites = [];
  const j = p.joueurs[0]!;
  const x0 = 40 * TUILE;
  for (let ty = 0; ty < 16; ty++) for (let tx = 38; tx < 64; tx++) p.carte.pose(tx, ty, T.VIDE);
  const t = { x1: x0, y1: 3 * TUILE, x2: x0 + 20 * TUILE, y2: (pente ? 9 : 3) * TUILE };
  p.tyroliennes = [t];
  const mx = x0 + 10 * TUILE;
  const ly = t.y1 + ((mx - t.x1) / (t.x2 - t.x1)) * (t.y2 - t.y1);
  Object.assign(j.corps, { x: mx - j.corps.w / 2, y: ly + 2, vx: 0, vy: 0 });
  return { p, j };
}

const pas = (p: Partie, n: number, bits: number) => {
  for (let i = 0; i < n; i++) {
    p.commande(0, bits);
    p.avance();
    p.releveEvenements();
  }
};

describe('les tyroliennes, dans les deux sens', () => {
  it('sans rien toucher, on suit la pente', () => {
    const { p, j } = surLeCable();
    const [x, y] = [j.corps.x, j.corps.y];
    pas(p, 30, 0);
    expect(j.corps.x).toBeGreaterThan(x + 20);
    expect(j.corps.y).toBeGreaterThan(y);
  });

  it('le joystick vers le haut de la pente : on remonte, plus lentement ; lâché, on redescend', () => {
    const { p, j } = surLeCable();
    const [x, y] = [j.corps.x, j.corps.y];
    pas(p, 40, C.GAUCHE);
    expect(j.corps.x).toBeLessThan(x - 20);
    expect(j.corps.y).toBeLessThan(y);
    expect(Math.abs(j.corps.vx)).toBeLessThan(2);
    expect(j.dir).toBe(-1);
    const xHaut = j.corps.x;
    pas(p, 40, 0);
    expect(j.corps.x).toBeGreaterThan(xHaut);
  });

  it('à plat, on va où pousse le joystick, et on garde son élan', () => {
    const { p, j } = surLeCable(false);
    const x = j.corps.x;
    pas(p, 30, C.GAUCHE);
    expect(j.corps.x).toBeLessThan(x - 15);
    const x2 = j.corps.x;
    pas(p, 10, 0);
    expect(j.corps.x).toBeLessThan(x2);
  });
});
