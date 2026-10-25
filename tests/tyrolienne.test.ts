import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { T } from '../src/monde/tuiles';
import { relieTyroliennes } from '../src/niveaux/tyroliennes';

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

describe('les jointures ($) : une seule tyrolienne qui change de pente', () => {
  const p = (tx: number, ty: number) => ({ tx, ty });

  it('chaque départ file de poteau en poteau jusqu’à une arrivée', () => {
    const l = relieTyroliennes([p(0, 2)], [p(30, 4)], [p(10, 8), p(20, 8)]);
    expect(l.length).toBe(3);
    expect(l[0]!.suivante).toBe(l[1]);
    expect(l[1]!.precedente).toBe(l[0]);
    expect(l[2]!.suivante).toBeUndefined();
    expect(l[1]!.y1).toBe(l[1]!.y2); // le tronçon du milieu est plat
    expect(() => relieTyroliennes([p(0, 2)], [], [p(10, 8)])).toThrow(/jointure sans suite/);
    expect(() => relieTyroliennes([p(0, 2)], [p(5, 4)], [p(10, 8)])).toThrow(/aucun départ/);
  });

  it('descendre, filer à plat, puis remonter au joystick, sans lâcher', () => {
    const { p: partie, j } = surLeCable();
    const t = relieTyroliennes([p(40, 3)], [p(70, 4)], [p(50, 9), p(60, 9)]);
    partie.tyroliennes = t;
    for (let ty = 0; ty < 16; ty++) for (let tx = 38; tx < 74; tx++) partie.carte.pose(tx, ty, T.VIDE);
    const s0 = t[0]!;
    const y = s0.y1 + (8 / (s0.x2 - s0.x1)) * (s0.y2 - s0.y1) + 2;
    Object.assign(j.corps, { x: s0.x1 + 8 - j.corps.w / 2, y, vx: 0 });
    pas(partie, 1, 0);
    const vu = new Set<number>();
    for (let i = 0; i < 600 && j.corps.x < t[2]!.x2 - 20; i++) {
      pas(partie, 1, C.DROITE);
      const k = t.findIndex((s) => j.cx >= s.x1 && j.cx <= s.x2);
      if (k >= 0) vu.add(k);
    }
    expect([...vu]).toEqual([0, 1, 2]);
    expect(j.corps.x).toBeGreaterThan(t[2]!.x2 - 21);
    expect(j.corps.y).toBeLessThan(t[1]!.y1); // on est remonté au-dessus du plat
  });
});
