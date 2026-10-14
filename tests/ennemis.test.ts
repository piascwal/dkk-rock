import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { Partie } from '../src/jeu/partie';
import { ANIM } from '../src/jeu/vue';
import { T } from '../src/monde/tuiles';

const nouvelle = () => {
  const p = new Partie({ niveau: 0, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

/** Le nombre de changements de direction d'un ennemi pendant `n` pas. */
function demiTours(p: Partie, e: Ennemi, n: number): number {
  let tours = 0;
  let avant = e.dir;
  for (let i = 0; i < n; i++) {
    p.avance();
    p.releveEvenements();
    if (e.dir !== avant) tours++;
    avant = e.dir;
  }
  return tours;
}

describe('les ennemis', () => {
  it('ne font pas demi-tour en rafale contre un mur : un demi-tour de temps en temps seulement', () => {
    const p = nouvelle();
    // l'ennemi le plus loin du héros : il patrouille tranquillement
    const e = p.entites
      .filter((x): x is Ennemi => x instanceof Ennemi)
      .sort((a, b) => b.corps.x - a.corps.x)[0]!;
    const tx = Math.floor(e.cx / TUILE);
    const ty = Math.floor((e.corps.y + e.corps.h - 1) / TUILE);
    // un mur plein juste devant lui
    e.dir = 1;
    for (let k = 0; k < 4; k++) p.carte.pose(tx + 2, ty - k, T.BETON);
    p.carte.pose(tx + 2, ty + 1, T.BETON);
    Object.assign(e.corps, { x: (tx + 2) * TUILE - e.corps.w - 1 });
    e.etat = 'patrouille';
    // le héros assez près pour que le monde tourne (au-delà de 640 px il se met en pause), trop loin pour être vu
    Object.assign(p.joueurs[0]!.corps, { x: e.corps.x - 400, y: e.corps.y });
    p.joueurs[0]!.invulnerable = 9999;
    const tours = demiTours(p, e, 150);
    // 150 pas : avec un délai entre deux demi-tours, au plus 5 ; le défaut en faisait un par pas ou presque
    expect(tours).toBeGreaterThan(0);
    expect(tours).toBeLessThanOrEqual(5);
  });

  it('regardent vers le héros sans clignoter quand il est pile au-dessus d’eux', () => {
    const p = nouvelle();
    const e = p.entites.find((x): x is Ennemi => x instanceof Ennemi && x.def.nom === 'Fêtard autotuné')!;
    const j = p.joueurs[0]!;
    e.etat = 'attaque';
    e.cible = j;
    e.vuA = p.tick;
    let tours = 0;
    let avant = e.dir;
    for (let i = 0; i < 120; i++) {
      // le héros oscille de quelques pixels autour de l'aplomb de l'ennemi
      Object.assign(j.corps, {
        x: e.cx - j.corps.w / 2 + Math.sin(i / 3) * 3,
        y: e.corps.y - 60,
        vx: 0,
        vy: 0,
      });
      j.invulnerable = 999;
      e.vuA = p.tick;
      p.avance();
      p.releveEvenements();
      if (e.dir !== avant) tours++;
      avant = e.dir;
    }
    expect(tours).toBeLessThanOrEqual(2);
  });

  it('un ennemi vaincu reste étendu un moment, sans plus se battre ni encaisser, puis s’efface', () => {
    const p = nouvelle();
    const e = p.entites.find((x): x is Ennemi => x instanceof Ennemi && !x.def.explose)!;
    const points = p.score;
    e.blesse(99, p, 1, false);
    expect(p.score).toBeGreaterThan(points);
    expect(e.vivant()).toBe(false);
    expect(e.fini).toBe(false);
    expect(e.vue().e).toBe(ANIM.TERRASSE);
    // un deuxième coup ne rapporte rien de plus
    const score = p.score;
    e.blesse(99, p, 1, false);
    expect(p.score).toBe(score);
    // le héros reste à portée de simulation sans être touché
    Object.assign(p.joueurs[0]!.corps, { x: e.corps.x - 200, y: e.corps.y });
    p.joueurs[0]!.invulnerable = 9999;
    for (let i = 0; i < 100; i++) p.avance();
    expect(e.fini).toBe(false);
    for (let i = 0; i < 260; i++) p.avance();
    expect(e.fini).toBe(true);
    p.avance();
    expect(p.entites.includes(e)).toBe(false);
  });
});
