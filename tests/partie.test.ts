import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { Objet } from '../src/entites/objets';
import { NIVEAUX } from '../src/niveaux';
import { T } from '../src/monde/tuiles';
import { Ennemi } from '../src/entites/ennemis/ennemi';

const nouvelle = (niveau = 0) => {
  const p = new Partie({ niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

const avance = (p: Partie, n: number, bits = 0) => {
  for (let i = 0; i < n; i++) {
    p.commande(0, bits);
    p.avance();
    p.releveEvenements();
  }
};

describe('la partie', () => {
  it.each(NIVEAUX.map((n, i) => [n.id, i] as const))('%s : 3 000 pas de jeu agité sans erreur', (_id, i) => {
    const p = nouvelle(i);
    p.ajouteJoueur(1, 3);
    for (let t = 0; t < 3000; t++) {
      const bits =
        C.DROITE | (t % 40 < 3 ? C.SAUT : 0) | (t % 3 === 0 ? C.TIR : 0) | (t % 300 === 0 ? C.SPECIAL : 0);
      p.commande(0, bits);
      p.commande(1, t % 2 ? C.TIR | C.GAUCHE : C.SAUT);
      p.avance();
      p.releveEvenements();
      if (p.phase === 'perdu' || p.phase === 'bilan') p.suivant();
    }
    expect(p.vue().entites.length).toBeGreaterThan(0);
  });

  it('une explosion détruit le terrain et blesse les ennemis', () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    const tx = Math.floor(j.cx / TUILE);
    const ty = Math.floor((j.corps.y + j.corps.h) / TUILE);
    expect(p.carte.get(tx, ty)).not.toBe(T.VIDE);
    p.explosion(j.cx, j.corps.y + j.corps.h + 4, 40, 8, 'heros');
    expect(p.carte.get(tx, ty)).toBe(T.VIDE);
    avance(p, 1);
    const e = p.entites.find((x): x is Ennemi => x instanceof Ennemi)!;
    const pv = e.pv;
    p.explosion(e.cx, e.cy, 30, 3, 'heros');
    expect(e.pv < pv || e.fini).toBe(true);
  });

  /** La première tuile de ce type (parcours ligne par ligne) qui vérifie `ok`. */
  const cherche = (p: ReturnType<typeof nouvelle>, type: number, ok: (x: number, y: number) => boolean) => {
    for (let y = 1; y < p.carte.hauteur; y++)
      for (let x = 1; x < p.carte.largeur - 1; x++)
        if (p.carte.get(x, y) === type && ok(x, y)) return { x, y };
    throw new Error('tuile introuvable');
  };

  it('les caissons de basses explosent en chaîne', () => {
    const p = nouvelle();
    // deux caissons côte à côte, quelque part dans le premier niveau
    const { x: tx, y: ty } = cherche(p, T.CAISSON, (x, y) => p.carte.get(x + 1, y) === T.CAISSON);
    p.carte.endommage(tx, ty, 99);
    avance(p, 30);
    expect(p.carte.get(tx + 1, ty)).toBe(T.VIDE);
  });

  it('la neige qui perd son appui tombe', () => {
    const p = nouvelle(2);
    // un bloc de neige posé sur autre chose, avec du vide au-dessus
    const { x, y } = cherche(
      p,
      T.NEIGE,
      (x, y) =>
        p.carte.get(x, y - 1) === T.VIDE && p.carte.solide(x, y + 1) && p.carte.get(x, y + 1) !== T.NEIGE,
    );
    p.carte.endommage(x, y + 1, 99);
    p.carte.endommage(x, y + 1, 99);
    avance(p, 120);
    expect(p.carte.get(x, y)).toBe(T.VIDE);
  });

  it('libérer une cage donne une vie et change de membre', () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    const cage = p.entites.find((e): e is Objet => e instanceof Objet && e.sorte === 'cage')!;
    const membre = j.membre;
    const vies = p.vies;
    Object.assign(j.corps, { x: cage.corps.x, y: cage.corps.y });
    avance(p, 2);
    expect(p.vies).toBe(vies + 1);
    expect(j.membre).not.toBe(membre);
    expect(cage.active).toBe(true);
  });

  it('le van termine le niveau, qui sauvegarde et enchaîne sur le suivant', () => {
    const p = nouvelle();
    const sauvegardes: number[] = [];
    p.onProgression = (prog, fini) => fini && sauvegardes.push(prog.niveau);
    const van = p.entites.find((e): e is Objet => e instanceof Objet && e.sorte === 'van')!;
    Object.assign(p.joueurs[0]!.corps, { x: van.corps.x + 10, y: van.corps.y + 6 });
    avance(p, 2);
    expect(p.phase).toBe('bilan');
    expect(sauvegardes).toEqual([1]);
    while (p.phase === 'bilan') p.suivant();
    expect(p.phase).toBe('histoire');
    expect(p.niveau).toBe(1);
  });

  it.each([1, 2, 3, 4, 5])(
    'au niveau %i, le groupe démarre au départ, pas à la fin du niveau précédent',
    (n) => {
      const p = nouvelle(n - 1);
      p.ajouteJoueur(1, 2);
      // les héros se trouvent loin, comme à la fin d'un niveau long
      for (const j of p.joueurs) if (j) Object.assign(j.corps, { x: 190 * TUILE, y: 5 * TUILE });
      p.termineNiveau();
      while (p.phase === 'bilan') p.suivant();
      expect(p.niveau).toBe(n);
      for (const j of p.joueurs) {
        if (!j) continue;
        expect(Math.abs(j.corps.x - p.lu.depart.x)).toBeLessThan(2 * TUILE);
        expect(j.corps.x).toBeLessThan(p.carte.largeur * TUILE);
      }
    },
  );

  it('sans vies, le groupe se sépare puis reprend au dernier drapeau', () => {
    const p = nouvelle();
    p.vies = 0;
    const d = p.lu.drapeaux[0]!;
    p.drapeau = 0;
    p.joueurs[0]!.meurt(p);
    avance(p, 200);
    expect(p.phase).toBe('perdu');
    while (p.phase === 'perdu') p.suivant();
    expect(p.phase).toBe('jeu');
    expect(p.vies).toBe(VIES_DEPART);
    expect(Math.abs(p.joueurs[0]!.corps.x - d.x)).toBeLessThan(TUILE);
  });

  it('un joueur qui rejoint prend un membre libre, près des autres', () => {
    const p = nouvelle();
    p.ajouteJoueur(2, 0);
    const [a, b] = [p.joueurs[0]!, p.joueurs[2]!];
    expect(b.membre).not.toBe(a.membre);
    expect(Math.abs(a.corps.x - b.corps.x)).toBeLessThan(TUILE);
  });

  it('la mort coûte une vie et fait revenir avec un autre membre', () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    const membre = j.membre;
    j.meurt(p);
    avance(p, 100);
    expect(j.mort).toBe(false);
    expect(p.vies).toBe(VIES_DEPART - 1);
    expect(j.membre).not.toBe(membre);
  });
});
