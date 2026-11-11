import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { Bonbonne, Tremplin } from '../src/entites/attractions';
import { Sirene } from '../src/entites/ennemis/alarme';
import { ENNEMIS_PAR_LETTRE } from '../src/entites/ennemis/definitions';
import { Teleporteur } from '../src/entites/teleporteur';
import { C } from '../src/jeu/commandes';
import { Projecteur } from '../src/entites/suspendus';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { Partie } from '../src/jeu/partie';
import { G } from '../src/jeu/vue';
import { NIVEAUX, ajouteNiveauEssai } from '../src/niveaux';
import { litNiveau } from '../src/niveaux/format';
import { NOUVEAUTES_PUBLIEES, POSES } from '../src/niveaux/nouveautes';
import { T, proprietes } from '../src/monde/tuiles';

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

describe('le téléporteur', () => {
  /** Un sol, une cave dessous ; une porte en haut (`>`), l'autre dans la cave (`<`) ; le héros au départ à gauche. */
  const partieAvecPortes = () => {
    const vide = ' '.repeat(40);
    const carte = [
      ...Array(8).fill(vide),
      '@' + ' '.repeat(7) + '>' + ' '.repeat(30) + 'F',
      '#'.repeat(40),
      '#' + ' '.repeat(38) + '#',
      '#' + ' '.repeat(28) + '<' + ' '.repeat(9) + '#',
      'X'.repeat(40),
      'X'.repeat(40),
    ];
    const p = new Partie({
      niveau: ajouteNiveauEssai({ ...NIVEAUX[0]!, id: 'essai-portes', carte, decor: [] }),
      drapeau: -1,
      vies: VIES_DEPART,
      score: 0,
    });
    p.ajouteJoueur(0, 0);
    while (p.phase === 'histoire') p.suivant();
    return p;
  };
  const portes = (p: Partie) => p.entites.filter((e): e is Teleporteur => e instanceof Teleporteur);
  const devant = (p: Partie, t: Teleporteur) => {
    const j = p.joueurs[0]!;
    Object.assign(j.corps, { x: t.x - j.corps.w / 2, y: t.y - j.corps.h, vx: 0, vy: 0 });
  };

  it('s’allume devant un héros qui s’arrête, puis l’emmène à l’autre porte', () => {
    const p = partieAvecPortes();
    const [haut, bas] = portes(p) as [Teleporteur, Teleporteur];
    expect(haut.autre).toBe(bas);
    const j = p.joueurs[0]!;
    avance(p, 20);
    expect(haut.vue().e).toBe(0);
    devant(p, haut);
    avance(p, 5);
    expect(haut.vue().e).toBe(1);
    avance(p, 20);
    expect(haut.vue().e).toBe(2);
    avance(p, 90);
    expect(Math.abs(j.corps.x + j.corps.w / 2 - bas.x)).toBeLessThan(6);
    expect(Math.abs(j.corps.y + j.corps.h - bas.y)).toBeLessThan(3);
    // à l'arrivée, la porte ne le reprend pas tant qu'il n'est pas parti
    avance(p, 200);
    expect(Math.abs(j.corps.x + j.corps.w / 2 - bas.x)).toBeLessThan(6);
  });
  it('part tout de suite avec la flèche du bas, une fois allumé', () => {
    const p = partieAvecPortes();
    const [haut, bas] = portes(p) as [Teleporteur, Teleporteur];
    const j = p.joueurs[0]!;
    avance(p, 20);
    devant(p, haut);
    avance(p, 5, C.BAS);
    expect(Math.abs(j.corps.x + j.corps.w / 2 - haut.x)).toBeLessThan(6); // pas encore allumée
    avance(p, 15, C.BAS);
    expect(Math.abs(j.corps.x + j.corps.w / 2 - bas.x)).toBeLessThan(6);
  });
  it('reste éteinte quand on ne fait que passer', () => {
    const p = partieAvecPortes();
    const [haut] = portes(p) as [Teleporteur, Teleporteur];
    avance(p, 20);
    for (let i = 0; i < 5; i++) {
      devant(p, haut);
      avance(p, 8);
      const j = p.joueurs[0]!;
      j.corps.x += 60;
      avance(p, 2);
    }
    expect(Math.abs(p.joueurs[0]!.corps.x - haut.x)).toBeGreaterThan(20);
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

describe('les niveaux et leurs nouveautés', () => {
  it.each(Object.keys(NOUVEAUTES_PUBLIEES))('%s : chaque nouveauté tient (sol, plafond, puits)', (id) => {
    const def = NIVEAUX.find((n) => n.id === id)!;
    const lu = litNiveau({ ...def, ...NOUVEAUTES_PUBLIEES[id] });
    const solide = (x: number, y: number) => proprietes(lu.tuiles[y * lu.largeur + x]!).solide;
    // les caissons (T) et barils (%) des réactions en chaîne ne sont pas des attractions : `pose` les a vérifiés
    const poses = POSES[id]!.filter(([c]) => c !== 'T' && c !== '%');
    for (const [c, x, y] of poses) {
      if (c === '>' || c === '<') {
        // la porte pose sur du socle incassable, sur ses cinq colonnes, avec de la place au-dessus
        for (const dx of [-2, -1, 0, 1, 2]) {
          expect(lu.tuiles[(y + 1) * lu.largeur + x + dx], `${c} en ${x},${y} : le sol`).toBe(T.SOCLE);
          for (const dy of [1, 2])
            expect(solide(x + dx, y - dy), `${c} en ${x},${y} : de la place`).toBe(false);
        }
      } else if (c === '"') {
        let r = y - 1;
        while (r > 0 && !solide(x, r)) r--;
        expect(solide(x, r), `${c} en ${x},${y} : un plafond`).toBe(true);
      } else expect(solide(x, y + 1), `${c} en ${x},${y}`).toBe(true);
    }
    expect(lu.attractions.length + lu.ennemis.filter((e) => e.lettre === '?').length).toBe(poses.length);
  });
});
