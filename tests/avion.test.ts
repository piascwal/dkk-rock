import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { ConcoursAvion, DECOLLAGE, NIVEAU_AVION, PORTEE, xAvion } from '../src/jeu/avion';
import { BONUS, LONGUEURS, OBSTACLES, parcours, RAMPE, type Objet } from '../src/jeu/avion-parcours';
import { NIVEAUX } from '../src/niveaux';
import { MONDE, niveauOuvert, suivantDansMonde } from '../src/niveaux/arcs';
import { decodeEtat, encodeEtat } from '../src/reseau/protocole';

const pas = (c: ConcoursAvion, bits = 0) => c.maj([bits, 0, 0, 0], [0], () => {});
const appuie = (c: ConcoursAvion, bits: number = C.SAUT) => {
  pas(c, bits);
  pas(c, 0);
};
/** Une course sur un tarmac vide (puis on y pose ce qu'on veut), la course lancée. */
function course(...objets: Objet[]): ConcoursAvion {
  const c = new ConcoursAvion([0], false);
  c.tarmac.splice(0, c.tarmac.length, ...objets);
  appuie(c);
  expect(c.etape).toBe('course');
  return c;
}
const objet = (x: number, voie: number, sorte: Objet['sorte'], hauteur = 0): Objet => ({
  x,
  voie,
  sorte,
  hauteur,
  marche: -1,
});

describe('l’avion de JBG', () => {
  it('le tarmac de chaque course est tiré d’après son numéro : tous les obstacles, des cartes, des bonus', () => {
    for (let m = 1; m < 30; m++) {
      const t = parcours(m);
      expect(t).toEqual(parcours(m));
      for (let i = 1; i < t.length; i++) expect(t[i]!.x).toBeGreaterThanOrEqual(t[i - 1]!.x);
      const sortes = new Set(t.map((o) => o.sorte));
      for (const s of OBSTACLES) expect(sortes.has(s)).toBe(true);
      expect(t.filter((o) => o.sorte === 'carte').length).toBeGreaterThan(150);
      expect(t.filter((o) => (BONUS as readonly string[]).includes(o.sorte)).length).toBeGreaterThan(5);
    }
  });

  it('sans un faux pas, il rattrape l’avion vers la demi-minute, et saute sur l’échelle par la voie du milieu', () => {
    const c = course();
    expect(c.voie).toBe(1); // la voie du milieu, sous l'échelle qui pend de la queue de l'avion
    while (xAvion(c.temps) - c.x > PORTEE - 10) pas(c);
    expect(c.temps / 60).toBeGreaterThan(25);
    expect(c.temps / 60).toBeLessThan(40);
    appuie(c);
    expect(c.etape).toBe('embarque');
    while (c.etape === 'embarque') pas(c);
    expect(c.etape).toBe('resultat');
    expect(c.score).toBeGreaterThanOrEqual(300 + 10 * 20);
  });

  it('chaque faux pas fait perdre du terrain ; on saute ce qui est bas, pas ce qui est haut', () => {
    const c = course(objet(60, 1, 'cone'), objet(400, 1, 'agent'));
    while (c.x < 40) pas(c);
    appuie(c); // par-dessus le cône
    while (c.x < 120) pas(c);
    expect(c.chutes).toBe(0);
    while (c.x < 380) pas(c);
    appuie(c); // un agent de piste : un saut ordinaire ne suffit pas
    while (c.x < 420) pas(c);
    expect(c.chutes).toBe(1);
    expect(c.trebuche).toBeGreaterThan(0);
  });

  it('gauche et droite changent de voie ; haut saute ; bas glisse sous le portique, qu’aucun saut ne passe', () => {
    const c = course();
    appuie(c, C.GAUCHE);
    expect(c.voie).toBe(0);
    appuie(c, C.DROITE);
    appuie(c, C.DROITE);
    expect(c.voie).toBe(2);
    appuie(c, C.HAUT);
    expect(c.z).toBeGreaterThan(0);
    const g = course(objet(80, 1, 'portique'));
    while (g.x < 66) pas(g);
    appuie(g, C.BAS);
    expect(g.vue().glisse).toBeGreaterThan(0);
    while (g.x < 110) pas(g);
    expect(g.chutes).toBe(0);
    const s = course(objet(80, 1, 'portique'));
    while (s.x < 60) pas(s);
    appuie(s); // en sautant, on se cogne à la barre
    while (s.x < 110) pas(s);
    expect(s.chutes).toBe(1);
  });

  it('l’échelle ne se prend que depuis la voie du milieu', () => {
    const c = course();
    appuie(c, C.GAUCHE);
    while (xAvion(c.temps) - c.x > PORTEE - 10) pas(c);
    appuie(c);
    expect(c.etape).toBe('course');
    appuie(c, C.DROITE);
    while (c.z > 0) pas(c);
    appuie(c);
    expect(c.etape).toBe('embarque');
  });

  it('le camion à tapis : par la rampe on court dessus et on prend ses cartes ; par le côté on s’y cogne', () => {
    const c = course(objet(80, 1, 'convoyeur'), objet(80 + RAMPE + 10, 1, 'carte', 14));
    while (c.x < 80 + RAMPE + 20) pas(c);
    expect(c.vue().surTapis).toBe(true);
    expect(c.cartes).toBe(1);
    while (c.x < 80 + LONGUEURS.convoyeur + 30) pas(c);
    expect(c.vue().surTapis).toBe(false);
    expect(c.chutes).toBe(0);
    const d = course(objet(60, 2, 'convoyeur'));
    while (d.x < 60 + RAMPE + 10) pas(d);
    appuie(d, C.DROITE); // on change de voie en plein milieu du camion
    pas(d);
    expect(d.chutes).toBe(1);
  });

  it('les bonus : le solo casse tout devant, la trottinette encaisse un choc, l’aimant attire les cartes des autres voies', () => {
    const c = course(objet(30, 1, 'solo'), objet(90, 1, 'chariots'), objet(150, 1, 'agent'));
    while (c.x < 200) pas(c);
    expect(c.chutes).toBe(0);
    expect(c.consommes).toEqual(expect.arrayContaining([0, 1, 2]));
    const d = course(objet(30, 1, 'trottinette'), objet(120, 1, 'agent'));
    while (d.x < 160) pas(d);
    expect(d.chutes).toBe(0);
    expect(d.bonus).toBe(-1); // la trottinette a encaissé le choc
    const e = course(objet(30, 1, 'aimant'), objet(80, 0, 'carte'), objet(90, 2, 'carte'));
    while (e.x < 120) pas(e);
    expect(e.cartes).toBe(2);
  });

  it('trop de faux pas : l’avion décolle sans lui ; seules les cartes comptent', () => {
    const c = course();
    c.cartes = 7;
    while (c.etape === 'course') {
      c.x = Math.min(c.x, xAvion(c.temps) - 400); // il a trébuché partout
      pas(c);
    }
    expect(c.etape).toBe('rate');
    expect(c.temps / 60).toBeGreaterThanOrEqual(DECOLLAGE);
    while (c.etape === 'rate') pas(c);
    expect(c.embarque).toBe(false);
    expect(c.score).toBe(35);
  });

  it('ouvre le Breizh Tour, après le Club Infini ; se laisse de côté ; passe par le réseau', () => {
    const club = NIVEAUX.findIndex((n) => n.id === 'club');
    const foret = NIVEAUX.findIndex((n) => n.id === 'foret');
    expect(NIVEAUX[NIVEAU_AVION]!.miniJeu).toBe('avion');
    expect(suivantDansMonde(club)).toBe(NIVEAU_AVION);
    expect(suivantDansMonde(NIVEAU_AVION)).toBe(foret);
    expect(MONDE.indexOf(NIVEAU_AVION)).toBe(MONDE.indexOf(club) + 1);
    expect(niveauOuvert(foret, [club])).toBe(true);

    const p = new Partie({ niveau: NIVEAU_AVION, drapeau: -1, vies: VIES_DEPART, score: 0 });
    p.ajouteJoueur(0, 2);
    while (p.phase === 'histoire') p.suivant();
    expect(p.phase).toBe('avion');
    p.commande(0, C.SAUT);
    p.avance();
    p.commande(0, 0);
    for (let t = 0; t < 40; t++) p.avance();
    const v = p.vue();
    expect(v.avion?.etape).toBe('course');
    const d = decodeEtat(encodeEtat(v))!;
    expect(d.avion).toMatchObject({
      etape: 'course',
      manche: v.avion!.manche,
      voie: v.avion!.voie,
      temps: v.avion!.temps,
    });
    expect(d.avion!.x).toBeCloseTo(v.avion!.x, 0);
  });
});
