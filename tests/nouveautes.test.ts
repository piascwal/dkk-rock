import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { Bonbonne, Tremplin } from '../src/entites/attractions';
import { Sirene } from '../src/entites/ennemis/alarme';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { Partie } from '../src/jeu/partie';
import { G } from '../src/jeu/vue';
import { NIVEAUX, ajouteNiveauEssai } from '../src/niveaux';
import { litNiveau } from '../src/niveaux/format';
import { ESSAIS_NOUVEAUTES, POSES } from '../src/niveaux/nouveautes';
import { proprietes } from '../src/monde/tuiles';

/** Une partie sur une petite carte : un long plat, le héros à gauche, et ce qu'on y pose. */
const partie = (sol: string) => {
  const vide = ' '.repeat(sol.length);
  const carte = [...Array(12).fill(vide), sol, 'X'.repeat(sol.length), 'X'.repeat(sol.length)];
  const p = new Partie({
    niveau: ajouteNiveauEssai({ ...NIVEAUX[0]!, id: 'essai-nouveautes', carte, decor: [] }),
    drapeau: -1,
    vies: VIES_DEPART,
    score: 0,
  });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};
const avance = (p: Partie, n: number, bits = 0) => {
  for (let i = 0; i < n; i++) {
    p.commande(0, bits);
    p.avance();
  }
};
const un = <T>(p: Partie, classe: new (...a: never[]) => T): T =>
  p.entites.find((e) => e instanceof classe) as T;

describe('la grosse caisse trampoline', () => {
  it('renvoie haut le héros qui tombe dessus', () => {
    const p = partie('@   _                            F');
    const [j, t] = [p.joueurs[0]!, un(p, Tremplin)];
    avance(p, 30);
    const sol = j.corps.y;
    Object.assign(j.corps, { x: t.corps.x + 4, y: sol - 40, vx: 0, vy: 0 });
    let haut = Infinity;
    for (let i = 0; i < 120; i++) {
      avance(p, 1);
      haut = Math.min(haut, j.corps.y);
    }
    // plus haut que d'où il est tombé : au moins trois tuiles au-dessus du sol
    expect(sol - haut).toBeGreaterThan(3 * TUILE);
  });
});

describe('la bonbonne de fumée', () => {
  it('file du côté opposé au coup et explose sur le premier ennemi', () => {
    const p = partie('@   :            a               F');
    const b = un(p, Bonbonne);
    avance(p, 30);
    const x0 = b.corps.x;
    b.blesse(1, p, 1, false);
    avance(p, 30);
    expect(b.corps.x).toBeGreaterThan(x0 + TUILE);
    expect(b.fini).toBe(false);
    avance(p, 90);
    expect(b.fini).toBe(true);
    // l'ennemi a pris l'explosion
    const e = un(p, Ennemi);
    expect(!e || !e.vivant()).toBe(true);
  });

  it('part droit en l’air sous une explosion', () => {
    const p = partie('@         :                      F');
    const b = un(p, Bonbonne);
    avance(p, 30);
    const y0 = b.corps.y;
    b.blesse(5, p, 1, true);
    avance(p, 40);
    expect(b.corps.y).toBeLessThan(y0 - 2 * TUILE);
  });
});

describe('le porteur de pancarte', () => {
  it('ne craint rien de face, mais tombe sous les coups dans le dos ou une explosion', () => {
    const p = partie('@           ]                    F');
    avance(p, 2);
    const e = un(p, Ennemi);
    expect(e.def.genre).toBe(G.PANCARTE);
    e.dir = -1;
    const pv = e.pv;
    e.blesse(2, p, 1, false); // un tir qui va vers la droite, lui regarde à gauche : de face
    expect(e.pv).toBe(pv);
    e.blesse(1, p, -1, false); // dans le dos
    expect(e.pv).toBe(pv - 1);
    e.dir = -1;
    e.blesse(1, p, 1, true); // une explosion, même de face
    expect(e.pv).toBe(pv - 2);
  });
});

describe('le sonneur d’alarme', () => {
  it('court à la sirène, qui appelle des renforts', () => {
    const p = partie('@       ?           }            F');
    avance(p, 2);
    const [s, sonneur] = [un(p, Sirene), un(p, Ennemi)];
    const avant = p.entites.filter((e) => e instanceof Ennemi).length;
    // il regarde vers le héros (sa ronde part d'un côté au hasard) : il le repère, et file à la sirène
    for (let i = 0; i < 400 && !s.sonnee; i++) {
      if (sonneur.etat === 'patrouille') sonneur.dir = -1;
      avance(p, 1);
    }
    expect(sonneur.def.genre).toBe(G.SONNEUR);
    expect(s.sonnee).toBe(true);
    expect(p.entites.filter((e) => e instanceof Ennemi).length).toBeGreaterThan(avant);
  });

  it('une sirène cassée ne sonne plus', () => {
    const p = partie('@       ?           }            F');
    avance(p, 2);
    const s = un(p, Sirene);
    for (let i = 0; i < 3; i++) s.blesse(1, p);
    expect(s.fini).toBe(true);
    const avant = p.entites.filter((e) => e instanceof Ennemi).length;
    avance(p, 400);
    expect(p.entites.filter((e) => e instanceof Ennemi).length).toBeLessThanOrEqual(avant);
  });
});

describe('les niveaux à l’essai', () => {
  it.each(Object.keys(ESSAIS_NOUVEAUTES))('%s : chaque nouveauté tient debout sur du sol', (id) => {
    const def = NIVEAUX.find((n) => n.id === id)!;
    const lu = litNiveau({ ...def, ...ESSAIS_NOUVEAUTES[id] });
    for (const [c, x, y] of POSES[id]!)
      expect(proprietes(lu.tuiles[(y + 1) * lu.largeur + x]!).solide, `${c} en ${x},${y}`).toBe(true);
    expect(
      lu.attractions.length + lu.ennemis.filter((e) => e.lettre === ']' || e.lettre === '?').length,
    ).toBe(POSES[id]!.length);
  });
});
