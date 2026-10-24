import { describe, expect, it } from 'vitest';
import { C } from '../src/jeu/commandes';
import { ConcoursKart, POINTS_VICTOIRE, TOURS } from '../src/jeu/kart';
import { Aleatoire } from '../src/moteur/maths';
import { nouvelleIA, piloteIA } from '../src/jeu/kart-ia';
import { LONGUEUR_TOUR, MUR, grille, projetteLoin, surPiste } from '../src/jeu/kart-piste';
import { PILOTES, VoitureKart } from '../src/jeu/kart-voiture';
import { Partie } from '../src/jeu/partie';
import { NIVEAUX } from '../src/niveaux';
import { NIVEAU_KART } from '../src/jeu/kart';
import { MONDE, suivantDansMonde } from '../src/niveaux/arcs';
import { decodeEtat, encodeEtat } from '../src/reseau/protocole';
import { VIES_DEPART } from '../src/config';

const pas = (c: ConcoursKart, bits: number[] = [0, 0, 0, 0], presents = [0]) =>
  c.maj(bits, presents, () => {});
const appuie = (c: ConcoursKart, bits: number, siege = 0, presents = [0]) => {
  const b = [0, 0, 0, 0];
  b[siege] = bits;
  pas(c, b, presents);
  pas(c, [0, 0, 0, 0], presents);
};

/** Les commandes de l'ordinateur, traduites en touches : pour faire conduire le « joueur » dans les tests. */
function touchesIA(c: ConcoursKart, k: number, rng: Aleatoire, ia = nouvelleIA()): number {
  const r = piloteIA(c.voitures[k]!, ia, c.voitures, rng);
  return (
    (r.k.gauche ? C.GAUCHE : 0) |
    (r.k.droite ? C.DROITE : 0) |
    (r.k.gaz ? C.SAUT : 0) |
    (r.k.frein ? C.BAS : 0)
  );
}

describe('le Grand Prix de la Sarré', () => {
  it('la piste est une boucle ; la grille est derrière la ligne, sur l’asphalte', () => {
    expect(LONGUEUR_TOUR).toBeGreaterThan(2500);
    const a = surPiste(0);
    const b = surPiste(0.9999);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(5);
    for (let k = 0; k < 5; k++) {
      const g = grille(k);
      expect(Math.abs(projetteLoin(g.x, g.y).d)).toBeLessThan(20);
    }
  });

  it('les pilotes de l’ordinateur bouclent leurs trois tours, chacun en une à deux minutes, sans se perdre', () => {
    const rng = new Aleatoire(7);
    const voitures = PILOTES.map((_, k) => new VoitureKart(k));
    const ias = voitures.map(() => nouvelleIA());
    voitures.forEach((v, k) => {
      const g = grille(k);
      v.pose(g.x, g.y, g.a, g.i, 0);
    });
    const arrivees = voitures.map(() => -1);
    for (let t = 0; t < 150 * 60 && arrivees.includes(-1); t++)
      voitures.forEach((v, k) => {
        if (arrivees[k]! >= 0) return;
        v.avanceUnPas(piloteIA(v, ias[k]!, voitures, rng).k);
        expect(Math.abs(v.d)).toBeLessThanOrEqual(MUR + 0.01);
        if (v.avance >= TOURS * LONGUEUR_TOUR) arrivees[k] = t;
      });
    for (const t of arrivees) {
      expect(t).toBeGreaterThan(40 * 60);
      expect(t).toBeLessThan(120 * 60);
    }
  });

  it('seul : on choisit son pilote, on part quatrième, on court trois tours, puis le podium', () => {
    const c = new ConcoursKart([0], [2], false);
    expect(c.choix[0]!.pilote).toBe(2); // JBG, son héros, proposé d'office
    appuie(c, C.DROITE);
    expect(c.choix[0]!.pilote).toBe(3); // Mat
    appuie(c, C.SAUT);
    expect(c.etape).toBe('depart');
    expect(c.voitures).toHaveLength(5);
    expect(c.voitures[3]!.pilote).toBe(3);
    const rng = new Aleatoire(3);
    const ia = nouvelleIA();
    for (let t = 0; t < 200 * 60 && c.etape !== 'podium'; t++) {
      const b = [0, 0, 0, 0];
      if (c.etape === 'course') b[0] = touchesIA(c, 3, rng, ia);
      pas(c, b);
    }
    expect(c.etape).toBe('podium');
    expect(c.classement).toHaveLength(5);
    expect(c.vue().voitures[3]!.effets & 64).toBe(64); // il a passé la ligne
    for (let t = 0; t < 70; t++) pas(c);
    appuie(c, C.SAUT);
    expect(c.fini).toBe(true);
  });

  it('à plusieurs : la règle de l’écran ; qui sort perd la manche, le premier à huit points gagne', () => {
    const c = new ConcoursKart([0, 1], [3, 3], true);
    expect(c.choix.map((x) => x.pilote)).toEqual([3, 4]); // pas deux fois la même voiture
    appuie(c, C.SAUT, 0, [0, 1]);
    appuie(c, C.SAUT, 1, [0, 1]);
    expect(c.voitures).toHaveLength(2);
    const rng = new Aleatoire(5);
    const ia = nouvelleIA();
    for (let t = 0; t < 600 * 60 && c.etape !== 'podium'; t++) {
      const b = [0, 0, 0, 0];
      if (c.etape === 'course') b[0] = touchesIA(c, 0, rng, ia); // le second joueur ne touche à rien : il reste derrière
      pas(c, b, [0, 1]);
    }
    expect(c.etape).toBe('podium');
    expect(c.points[0]).toBe(POINTS_VICTOIRE);
    expect(c.classement[0]).toBe(0);
  });

  it('vient juste après Gréau dans la tournée, mène aux Plages ; passe par le réseau', () => {
    const greau = NIVEAUX.findIndex((n) => n.id === 'cimes');
    expect(NIVEAUX[NIVEAU_KART]!.miniJeu).toBe('kart');
    expect(suivantDansMonde(greau)).toBe(NIVEAU_KART);
    expect(MONDE.indexOf(NIVEAU_KART)).toBe(MONDE.indexOf(greau) + 1);
    expect(NIVEAUX[suivantDansMonde(NIVEAU_KART)!]!.id).toBe('plage');
    const p = new Partie({ niveau: NIVEAU_KART, drapeau: -1, vies: VIES_DEPART, score: 0 });
    p.ajouteJoueur(0, 4);
    while (p.phase === 'histoire') p.suivant();
    expect(p.phase).toBe('kart');
    p.commande(0, C.SAUT);
    p.avance();
    p.commande(0, C.SAUT);
    for (let t = 0; t < 300; t++) p.avance();
    const v = p.vue();
    expect(v.kart?.etape).toBe('course');
    const d = decodeEtat(encodeEtat(v))!;
    expect(d.kart).toMatchObject({ etape: 'course', temps: v.kart!.temps, caisses: v.kart!.caisses });
    expect(d.kart!.voitures.map((x) => x.pilote)).toEqual(v.kart!.voitures.map((x) => x.pilote));
    expect(d.kart!.voitures[3]!.x).toBeCloseTo(v.kart!.voitures[3]!.x, 0);
    expect(d.kart!.choix).toEqual(v.kart!.choix);
  });
});
