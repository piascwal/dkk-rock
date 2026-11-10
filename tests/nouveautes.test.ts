import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { Bonbonne, Tremplin } from '../src/entites/attractions';
import { Sirene } from '../src/entites/ennemis/alarme';
import { ENNEMIS_PAR_LETTRE } from '../src/entites/ennemis/definitions';
import { MonteCharge } from '../src/entites/monte-charge';
import { Projecteur } from '../src/entites/suspendus';
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
  it('tombe tout de suite au premier coup, clignote, puis file et explose sur le premier ennemi', () => {
    const p = partie('@   :            a               F');
    const b = un(p, Bonbonne);
    avance(p, 30);
    const [x0, h0] = [b.corps.x, b.corps.h];
    b.blesse(1, p, 1);
    // couchée aussitôt (large et basse), sur place
    expect(b.corps.h).toBeLessThan(h0);
    avance(p, 20);
    expect(b.corps.x).toBeLessThan(x0 + 2 * TUILE);
    expect(b.vue()?.e).toBe(1);
    // elle clignote (blanc) pendant qu'elle est couchée
    const blancs = new Set<boolean>();
    for (let i = 0; i < 30; i++) {
      avance(p, 1);
      if (b.vue()?.e === 1) blancs.add(b.vue()!.clignote);
    }
    expect(blancs.size).toBe(2);
    // puis elle part
    avance(p, 40);
    expect(b.corps.x).toBeGreaterThan(x0 + 3 * TUILE);
    avance(p, 120);
    expect(b.fini).toBe(true);
    const e = un(p, Ennemi);
    expect(!e || !e.vivant()).toBe(true);
  });
});

describe('le tonneau-fusée', () => {
  it('emporte avec lui le héros qui est dessus quand il part', () => {
    const p = partie('@   :                              a   F');
    const [j, b] = [p.joueurs[0]!, un(p, Bonbonne)];
    avance(p, 30);
    b.blesse(1, p, 1);
    avance(p, 20);
    // le héros monte dessus (il est couché, immobile) et attend le départ
    Object.assign(j.corps, { x: b.corps.x + 3, y: b.corps.y - j.corps.h, vx: 0, vy: 0 });
    let depart = 0;
    for (let i = 0; i < 200 && !depart; i++) {
      avance(p, 1);
      if (b.vue()?.e === 2) depart = i;
    }
    expect(depart).toBeGreaterThan(0);
    const x0 = j.corps.x;
    avance(p, 14);
    // il a avancé avec le tonneau, toujours posé dessus
    expect(j.corps.x).toBeGreaterThan(x0 + 3 * TUILE);
    expect(Math.abs(j.corps.y + j.corps.h - b.corps.y)).toBeLessThan(2);
    expect(Math.abs(j.corps.x + j.corps.w / 2 - (b.corps.x + b.corps.w / 2))).toBeLessThan(12);
  });
});

describe('le monte-charge', () => {
  /** Un puits de cinq tuiles creusé dans le sol, le monte-charge à son sommet, le héros juste à côté. */
  const partieAvecPuits = () => {
    const vide = ' '.repeat(34);
    const carte = [
      ...Array(8).fill(vide),
      '@' + ' '.repeat(32) + 'F',
      '###>.' + '#'.repeat(29),
      ...Array(4).fill('###..' + '#'.repeat(29)),
      'X'.repeat(34),
    ];
    const p = new Partie({
      niveau: ajouteNiveauEssai({ ...NIVEAUX[0]!, id: 'essai-monte', carte, decor: [] }),
      drapeau: -1,
      vies: VIES_DEPART,
      score: 0,
    });
    p.ajouteJoueur(0, 0);
    while (p.phase === 'histoire') p.suivant();
    return p;
  };
  it('emmène le héros qui s’y tient jusqu’au fond du puits, puis le remonte', () => {
    const p = partieAvecPuits();
    const [j, m] = [p.joueurs[0]!, un(p, MonteCharge)];
    const haut = m.corps.y;
    avance(p, 20);
    Object.assign(j.corps, { x: m.corps.x + 8, y: haut - j.corps.h, vx: 0, vy: 0 });
    // une demi-seconde d'attente, puis il descend avec lui
    avance(p, 70);
    expect(m.corps.y).toBeGreaterThan(haut + TUILE);
    expect(Math.abs(j.corps.y + j.corps.h - m.corps.y)).toBeLessThan(2);
    // au fond du puits (cinq tuiles), toujours dessus
    avance(p, 80);
    expect(m.corps.y).toBe(haut + 5 * TUILE);
    expect(Math.abs(j.corps.y + j.corps.h - m.corps.y)).toBeLessThan(2);
    // s'il reste, il le remonte (après un temps pour en descendre)
    avance(p, 180);
    expect(m.corps.y).toBe(haut);
    expect(Math.abs(j.corps.y + j.corps.h - m.corps.y)).toBeLessThan(2);
  });
  it('ne bouge pas tant que personne n’est dessus', () => {
    const p = partieAvecPuits();
    const m = un(p, MonteCharge);
    const y0 = m.corps.y;
    avance(p, 200);
    expect(m.corps.y).toBe(y0);
  });
});

describe('les projecteurs suspendus', () => {
  /** Une salle avec un plafond, et des projecteurs pendus sous lui. */
  const salle = (lampes: string) => {
    const larg = lampes.length;
    const carte = [
      'X'.repeat(larg),
      lampes,
      ' '.repeat(larg),
      ' '.repeat(larg),
      ' '.repeat(larg),
      '@' + ' '.repeat(larg - 2) + 'F',
      'X'.repeat(larg),
      'X'.repeat(larg),
    ];
    const p = new Partie({
      niveau: ajouteNiveauEssai({ ...NIVEAUX[0]!, id: 'essai-lampes', carte, decor: [] }),
      drapeau: -1,
      vies: VIES_DEPART,
      score: 0,
    });
    p.ajouteJoueur(0, 0);
    while (p.phase === 'histoire') p.suivant();
    return p;
  };
  it('un tir sur le câble la fait tomber, et le choc coupe les câbles voisins : la chaîne', () => {
    const p = salle('X  "  "  "  X   ');
    const lampes = p.entites.filter((e): e is Projecteur => e instanceof Projecteur);
    expect(lampes).toHaveLength(3);
    avance(p, 5);
    expect(lampes.every((l) => l.vivant())).toBe(true);
    lampes[0]!.blesse(1, p);
    expect(lampes[0]!.vivant()).toBe(false);
    avance(p, 40);
    // la première a atterri ; les autres, secouées, cèdent l'une après l'autre
    expect(lampes[0]!.vue()?.e).toBe(2);
    avance(p, 160);
    expect(lampes.map((l) => l.vue()?.e)).toEqual([2, 2, 2]);
  });
  it('écrase un ennemi dessous', () => {
    const p = salle('X  "                 ');
    const [lampe] = p.entites.filter((e): e is Projecteur => e instanceof Projecteur);
    const e = new Ennemi(p, ENNEMIS_PAR_LETTRE['a']!, lampe!.corps.x - 4, 5 * TUILE);
    p.ajoute(e);
    avance(p, 2);
    const pv = e.pv;
    lampe!.blesse(1, p);
    avance(p, 60);
    expect(e.pv < pv || !e.vivant()).toBe(true);
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
  it.each(Object.keys(ESSAIS_NOUVEAUTES))('%s : chaque nouveauté tient (sol, plafond, puits)', (id) => {
    const def = NIVEAUX.find((n) => n.id === id)!;
    const lu = litNiveau({ ...def, ...ESSAIS_NOUVEAUTES[id] });
    const solide = (x: number, y: number) => proprietes(lu.tuiles[y * lu.largeur + x]!).solide;
    for (const [c, x, y, sol] of POSES[id]!) {
      if (c === '>') {
        // des deux côtés de la case de départ, le sol de la surface ; au fond, le sol de la cave sous les deux colonnes
        expect(solide(x - 1, y) && solide(x + 2, y), `${c} en ${x},${y} : la surface`).toBe(true);
        expect(solide(x, sol!) && solide(x + 1, sol!), `${c} en ${x},${y} : le fond`).toBe(true);
      } else if (c === '"') {
        let r = y - 1;
        while (r > 0 && !solide(x, r)) r--;
        expect(solide(x, r), `${c} en ${x},${y} : un plafond`).toBe(true);
      } else expect(solide(x, y + 1), `${c} en ${x},${y}`).toBe(true);
    }
    expect(lu.attractions.length + lu.ennemis.filter((e) => e.lettre === '?').length).toBe(POSES[id]!.length);
  });
});
