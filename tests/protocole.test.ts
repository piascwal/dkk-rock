import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { G } from '../src/jeu/vue';
import { Partie } from '../src/jeu/partie';
import {
  decodeCommandes,
  decodeEtat,
  encodeCommandes,
  encodeEtat,
  valideMsgClient,
  valideMsgHote,
} from '../src/reseau/protocole';
import { valideAnnonceDkk } from '../src/reseau/annonce';
import { Carte } from '../src/monde/carte';
import { niveauLu } from '../src/niveaux';

describe('le protocole réseau', () => {
  it('un instantané fait l’aller-retour et tient dans un paquet', () => {
    const p = new Partie({ niveau: 5, drapeau: -1, vies: VIES_DEPART, score: 1234 });
    for (let s = 0; s < 4; s++) p.ajouteJoueur(s, s);
    while (p.phase === 'histoire') p.suivant();
    for (let t = 0; t < 600; t++) {
      for (let s = 0; s < 4; s++)
        p.commande(s, C.TIR | (t % 50 < 2 ? C.SAUT : 0) | (s % 2 ? C.DROITE : C.GAUCHE));
      p.avance();
      p.releveEvenements();
    }
    const v = p.vue();
    const buf = encodeEtat(v);
    expect(buf.byteLength).toBeLessThanOrEqual(4096);
    const d = decodeEtat(buf)!;
    expect(d.phase).toBe(v.phase);
    expect(d.score).toBe(v.score);
    expect(d.entites.length).toBe(v.entites.length);
    expect(d.joueurs.map((j) => j.membre)).toEqual(v.joueurs.map((j) => j.membre));
    const e = v.entites[0]!;
    expect(d.entites[0]).toMatchObject({ id: e.id, g: e.g, x: Math.round(e.x), gauche: e.gauche });
  });

  it('les compteurs de convertis traversent le réseau', () => {
    const p = new Partie({ niveau: 0, drapeau: -1, vies: 5, score: 0 });
    p.ajouteJoueur(0, 0);
    p.ennemiVaincu(0, 0, 100, G.FETARD);
    p.ennemiVaincu(0, 0, 100, G.ROBOT);
    p.ennemiVaincu(0, 0, 100, G.ROBOT);
    const d = decodeEtat(encodeEtat(p.vue()))!;
    expect(d.convertis).toEqual(p.vue().convertis);
    expect(d.convertis.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('le temps de traversée en ferry traverse le réseau (et -1 hors traversée)', () => {
    const p = new Partie({ niveau: 7, drapeau: -1, vies: 5, score: 0 });
    p.ajouteJoueur(0, 0);
    expect(decodeEtat(encodeEtat(p.vue()))!.traversee).toBe(-1);
    const v = { ...p.vue(), traversee: 1234 };
    expect(decodeEtat(encodeEtat(v))!.traversee).toBe(1234);
  });

  it("l'aura d'invincibilité traverse le réseau", () => {
    const p = new Partie({ niveau: 0, drapeau: -1, vies: 5, score: 0 });
    p.ajouteJoueur(0, 0);
    p.joueurs[0]!.invincible = 100;
    const d = decodeEtat(encodeEtat(p.vue()))!;
    const heros = d.entites.find((e) => e.id === p.joueurs[0]!.id)!;
    expect(heros.aura).toBe(true);
    expect(d.entites.filter((e) => e.aura).length).toBe(1);
  });

  it('refuse un instantané tronqué ou d’un autre type', () => {
    const p = new Partie({ niveau: 0, drapeau: -1, vies: 5, score: 0 });
    p.ajouteJoueur(0, 0);
    const buf = encodeEtat(p.vue());
    expect(decodeEtat(buf.slice(0, buf.byteLength - 3))).toBeNull();
    expect(decodeEtat(new ArrayBuffer(3))).toBeNull();
    expect(decodeEtat(encodeCommandes(3, 1))).toBeNull();
  });

  it('les commandes tiennent en 4 octets', () => {
    expect(decodeCommandes(encodeCommandes(C.TIR | C.SAUT, 70000))).toEqual({
      bits: C.TIR | C.SAUT,
      seq: 70000 & 0xffff,
    });
    expect(decodeCommandes(new ArrayBuffer(5))).toBeNull();
  });

  it('valide les messages de contrôle', () => {
    expect(valideMsgClient({ t: 'salut', nom: 'LYNX', membre: 2, v: 1 })).toEqual({
      t: 'salut',
      nom: 'LYNX',
      membre: 2,
      v: 1,
    });
    expect(valideMsgClient({ t: 'salut', nom: '<script>', membre: 2, v: 1 })).toBeNull();
    expect(valideMsgClient({ t: 'salut', nom: 'LYNX', membre: 9, v: 1 })).toBeNull();
    expect(valideMsgClient({ t: 'triche' })).toBeNull();
    expect(valideMsgHote({ t: 'bienvenue', siege: 1, niveau: 0, carte: 'abc' })).toMatchObject({ siege: 1 });
    expect(valideMsgHote({ t: 'bienvenue', siege: 7, niveau: 0, carte: 'abc' })).toBeNull();
    expect(valideMsgHote({ t: 'ev', l: [{ k: 'son', n: 'saut', x: 1, y: 2 }, { k: 'pirate' }] })).toEqual({
      t: 'ev',
      l: [{ k: 'son', n: 'saut', x: 1, y: 2 }],
    });
  });

  it('valide les annonces de partie', () => {
    expect(valideAnnonceDkk({ nom: 'JBM 2', niveau: 3, joueurs: 2 })).toEqual({
      nom: 'JBM 2',
      niveau: 3,
      joueurs: 2,
    });
    expect(valideAnnonceDkk({ nom: 'jbm', niveau: 3, joueurs: 2 })).toBeNull();
    expect(valideAnnonceDkk({ nom: 'JBM', niveau: 3, joueurs: 5 })).toBeNull();
  });

  it('la carte d’un joueur qui arrive en cours de route est celle de l’hôte', () => {
    const p = new Partie({ niveau: 1, drapeau: -1, vies: 5, score: 0 });
    p.explosion(300, 360, 60, 20, 'heros');
    const lu = niveauLu(1);
    const c = new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond);
    c.appliqueTexte(p.carte.versTexte());
    expect(Array.from(c.tuiles)).toEqual(Array.from(p.carte.tuiles));
  });
});
