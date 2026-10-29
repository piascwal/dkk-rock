import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { Baril, DUREE_MECHE, RAYON_BARIL } from '../src/entites/baril';
import { Projectile } from '../src/entites/projectile';
import { BAGUETTE } from '../src/entites/projectiles-defs';
import { NOTE_AUTOTUNE } from '../src/entites/projectiles-ennemis';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { deplace, nouveauCorps } from '../src/monde/physique';
import { Carte } from '../src/monde/carte';
import { T } from '../src/monde/tuiles';

const nouvelle = (niveau: number) => {
  const p = new Partie({ niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

const barils = (p: Partie) => p.entites.filter((e): e is Baril => e instanceof Baril);

/** Le monde attend loin des héros : on amène le héros tout près du baril. */
const pres = (p: Partie, b: Baril, ecart = 0) => {
  const j = p.joueurs[0]!;
  j.corps.x = b.corps.x - ecart;
  j.corps.y = b.corps.y;
};

describe('le baril explosif', () => {
  it('est posé à Saint-Cézaire et dans la ville, et nulle part ailleurs', () => {
    expect(barils(nouvelle(0)).length).toBeGreaterThan(0);
    expect(barils(nouvelle(4)).length).toBeGreaterThan(0);
    expect(barils(nouvelle(1))).toHaveLength(0);
  });

  it('explose deux secondes après le premier coup, avec le rayon voulu', () => {
    const p = nouvelle(0);
    const b = barils(p)[0]!;
    pres(p, b);
    p.releveEvenements();
    b.blesse(1, p);
    for (let t = 0; t < DUREE_MECHE - 1; t++) p.avance();
    expect(b.fini).toBe(false);
    p.avance();
    expect(b.fini).toBe(true);
    const explosions = p.releveEvenements().filter((e) => e.k === 'explo');
    // la sienne (un caisson de basses voisin peut sauter avec lui)
    expect(explosions).toContainEqual(expect.objectContaining({ r: RAYON_BARIL }));
  });

  it("ignore les coups suivants : la mèche n'est allumée qu'une fois", () => {
    const p = nouvelle(0);
    const b = barils(p)[0]!;
    pres(p, b);
    b.blesse(1, p);
    for (let t = 0; t < 60; t++) p.avance();
    b.blesse(1, p);
    for (let t = 0; t < DUREE_MECHE - 60; t++) p.avance();
    expect(b.fini).toBe(true);
  });

  it("n'est visé par personne, mais les tirs des deux camps l'allument", () => {
    for (const [def, camp] of [
      [BAGUETTE, 'heros'],
      [NOTE_AUTOTUNE, 'ennemis'],
    ] as const) {
      const p = nouvelle(0);
      const b = barils(p)[0]!;
      pres(p, b, 120); // le héros à l'écart : le tir ennemi n'a que le baril sur son chemin
      p.avance();
      expect(p.cibles('ennemis')).not.toContain(b);
      expect(p.cibles('heros')).not.toContain(b);
      p.ajoute(new Projectile(p, def, camp, b.corps.x + 7, b.corps.y + 8, 0, 0));
      p.avance();
      for (let t = 0; t < DUREE_MECHE; t++) p.avance();
      expect(b.fini).toBe(true);
    }
  });

  it("s'allume au souffle d'une explosion voisine", () => {
    const p = nouvelle(0);
    const b = barils(p)[0]!;
    pres(p, b);
    p.avance();
    p.explosion(b.corps.x + 20, b.corps.y, 30, 3, 'heros');
    for (let t = 0; t < DUREE_MECHE; t++) p.avance();
    expect(b.fini).toBe(true);
  });

  describe('est plein : on bute contre lui, on monte dessus', () => {
    /** Un sol de terre, un baril de 14 × 16 posé dessus (16 px = une tuile) : à l'abscisse 64. */
    const monde = () => {
      const carte = new Carte(
        12,
        4,
        new Uint8Array(48).fill(0).map((_, i) => (i >= 36 ? T.TERRE : T.VIDE)),
      );
      const baril = nouveauCorps(64, 32, 14, 16);
      carte.obstacles = [baril];
      return { carte, baril };
    };

    it('bloque un corps qui marche contre lui, des deux côtés', () => {
      const { carte } = monde();
      for (const [x0, vx] of [
        [20, 3],
        [130, -3],
      ] as const) {
        const c = nouveauCorps(x0, 16, 12, 32);
        for (let i = 0; i < 60; i++) {
          c.vx = vx;
          c.vy = 1;
          deplace(c, carte);
        }
        expect(c.mur).toBe(vx > 0 ? 1 : -1);
        expect(vx > 0 ? c.x + c.w : c.x).toBe(vx > 0 ? 64 : 78);
      }
    });

    it('porte un corps qui lui tombe dessus, qui peut y marcher et en redescendre', () => {
      const { carte, baril } = monde();
      const c = nouveauCorps(62, 0, 12, 20);
      for (let i = 0; i < 60; i++) {
        c.vy = Math.min(6, c.vy + 0.5);
        deplace(c, carte);
      }
      expect(c.auSol).toBe(true);
      expect(c.y + c.h).toBe(baril.y);
      // il avance sur le baril, puis tombe de l'autre bord jusqu'au sol
      for (let i = 0; i < 40; i++) {
        c.vx = 1;
        c.vy = Math.min(6, c.vy + 0.5);
        deplace(c, carte);
      }
      expect(c.x).toBeGreaterThan(baril.x + baril.w);
      expect(c.y + c.h).toBe(48);
    });

    it("s'y cogne la tête en sautant dessous, et ne se bloque pas lui-même", () => {
      const { carte, baril } = monde();
      baril.y = 16; // en l'air : on passe dessous
      const dessous = nouveauCorps(62, 34, 12, 14);
      dessous.vy = -4;
      deplace(dessous, carte);
      expect(dessous.vy).toBe(0);
      expect(dessous.y).toBe(32);
      // lui-même retombe jusqu'au sol, sans que sa propre boîte le retienne
      for (let i = 0; i < 30; i++) {
        baril.vy = Math.min(6, baril.vy + 0.5);
        deplace(baril, carte);
      }
      expect(baril.y + baril.h).toBe(48);
    });
  });

  it('héros et ennemis y sont bloqués dans la partie, et il disparaît avec son explosion', () => {
    const p = nouvelle(0);
    const b = barils(p)[0]!;
    pres(p, b, 40);
    const j = p.joueurs[0]!;
    for (let t = 0; t < 90; t++) {
      p.commande(0, C.DROITE);
      p.avance();
    }
    expect(p.carte.obstacles).toContain(b.corps);
    expect(j.corps.x + j.corps.w).toBeLessThanOrEqual(b.corps.x + 0.01);
    b.blesse(1, p);
    for (let t = 0; t < DUREE_MECHE + 1; t++) p.avance();
    expect(p.carte.obstacles).not.toContain(b.corps);
  });
});

describe('des barils empilés', () => {
  it("n'en montrent le dessus que pour celui du haut", () => {
    const p = nouvelle(0);
    const bas = barils(p)[0]!;
    pres(p, bas, 200);
    const [tx, ty] = [Math.floor(bas.corps.x / TUILE), Math.floor(bas.corps.y / TUILE)];
    const haut = new Baril(p, tx, ty - 1);
    p.ajoute(haut);
    for (let t = 0; t < 30; t++) p.avance();
    expect(haut.corps.y + haut.corps.h).toBe(bas.corps.y);
    expect(haut.vue()!.e).toBe(0);
    expect(bas.vue()!.e).toBe(1);
  });

  it('retrouvent leur dessus quand celui qui les couvrait a explosé', () => {
    const p = nouvelle(0);
    const bas = barils(p)[0]!;
    pres(p, bas, 200);
    const haut = new Baril(p, Math.floor(bas.corps.x / TUILE), Math.floor(bas.corps.y / TUILE) - 1);
    p.ajoute(haut);
    for (let t = 0; t < 30; t++) p.avance();
    haut.blesse(1, p);
    for (let t = 0; t < DUREE_MECHE + 2; t++) p.avance();
    expect(haut.fini).toBe(true);
    if (!bas.fini) expect(bas.vue()!.e).toBe(0);
  });
});
