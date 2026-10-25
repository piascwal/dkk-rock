import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { bouliste, hockeyeur } from '../src/entites/ennemis/comportements';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { ENNEMIS_PAR_LETTRE } from '../src/entites/ennemis/definitions';
import { ENNEMIS_LOCAUX, ENNEMIS_SPECIAUX } from '../src/entites/ennemis/locaux';
import { Projectile } from '../src/entites/projectile';
import { Partie } from '../src/jeu/partie';
import { G, GENRES_CONVERTIS, estPersonnage, estUnTir } from '../src/jeu/vue';
import { NIVEAUX } from '../src/niveaux';
import { ARCS, MONDE, niveauOuvert, suivantDansMonde } from '../src/niveaux/arcs';
import { DESSINS_ENNEMIS } from '../src/rendu/dessins-ennemis';
import { THEMES } from '../src/rendu/themes';

const VILLES = ['limerick', 'newyork', 'ottawa', 'lund', 'beauvais', 'marseille'] as const;
const indice = (id: string) => NIVEAUX.findIndex((n) => n.id === id);

const enJeu = (niveau: number) => {
  const p = new Partie({ niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

describe('l’International Tour', () => {
  it('s’ouvre après le FISE : Limerick, New York, Ottawa, Lund, Beauvais, Marseille, au bout de la route', () => {
    const arc = ARCS.find((a) => a.id === 'international')!;
    expect(arc.niveaux.map((n) => NIVEAUX[n]!.id)).toEqual([...VILLES]);
    const fise = indice('fise');
    expect(arc.apres).toBe(fise);
    expect(suivantDansMonde(fise)).toBe(indice('limerick'));
    expect(niveauOuvert(indice('limerick'), [])).toBe(false);
    expect(niveauOuvert(indice('limerick'), [fise])).toBe(true);
    expect(MONDE.slice(-arc.niveaux.length)).toEqual(arc.niveaux);
  });

  it('chaque ville a son thème, son décor, et un héros du groupe en guide dans l’intro', () => {
    const guides = {
      beauvais: 'JBT',
      limerick: 'MAT',
      lund: 'TOM',
      newyork: 'JBM',
      marseille: 'JBG',
      ottawa: 'MAT',
    };
    for (const v of VILLES) {
      const def = NIVEAUX[indice(v)]!;
      expect(def.theme).toBe(v);
      expect(THEMES[def.theme].decor).toBe(v);
      expect(def.intro.some((r) => r.qui === guides[v])).toBe(true);
    }
  });

  it('« a » et « c » y sont des gens du coin, jamais les fêtards autotunés', () => {
    for (const v of VILLES) {
      const p = enJeu(indice(v));
      const genres = new Set(
        p.entites.filter((e) => e instanceof Ennemi).map((e) => (e as Ennemi).def.genre),
      );
      expect(genres.has(G.FETARD), v).toBe(false);
      expect(genres.has(ENNEMIS_LOCAUX[v]!.a!.genre), v).toBe(true);
      expect(genres.has(ENNEMIS_LOCAUX[v]!.c!.genre), v).toBe(true);
    }
  });

  it('les spéciaux ont leur lettre, chaque nouveau personnage est dessiné et compté parmi les convertis', () => {
    for (const lettre of 'zujnqwi') expect(ENNEMIS_PAR_LETTRE[lettre]).toBe(ENNEMIS_SPECIAUX[lettre]);
    const nouveaux = [
      ...Object.values(ENNEMIS_SPECIAUX),
      ...Object.values(ENNEMIS_LOCAUX).flatMap((l) => Object.values(l!)),
    ].map((d) => d.genre);
    for (const g of nouveaux) {
      expect(DESSINS_ENNEMIS[g], `genre ${g}`).toBeDefined();
      expect(GENRES_CONVERTIS).toContain(g);
      expect(estPersonnage(g)).toBe(true);
      expect(estUnTir(g)).toBe(false);
    }
    expect(estUnTir(G.P_BOULE)).toBe(true);
    expect(estUnTir(G.P_RONDELLE)).toBe(true);
  });

  it('le bouliste de Marseille pointe une boule de pétanque, en cloche', () => {
    const p = enJeu(indice('marseille'));
    const j = p.joueurs[0]!;
    const b = new Ennemi(p, ENNEMIS_SPECIAUX.q!, j.corps.x + 90, j.corps.y);
    b.recharge = 0;
    b.peutTirer = () => true;
    bouliste(b, p, j);
    const boule = p.entites.find(
      (e): e is Projectile => e instanceof Projectile && e.def.genre === G.P_BOULE,
    );
    expect(boule).toBeDefined();
    expect(boule!.def.gravite).toBeGreaterThan(0);
    expect(b.recharge).toBe(ENNEMIS_SPECIAUX.q!.cadence);
  });

  it('le hockeyeur d’Ottawa décoche une rondelle qui glisse au ras du sol', () => {
    const p = enJeu(indice('ottawa'));
    const j = p.joueurs[0]!;
    const h = new Ennemi(p, ENNEMIS_LOCAUX.ottawa!.a!, j.corps.x + 90, j.corps.y);
    h.recharge = 0;
    h.peutTirer = () => true;
    hockeyeur(h, p, j);
    const rondelle = p.entites.find(
      (e): e is Projectile => e instanceof Projectile && e.def.genre === G.P_RONDELLE,
    );
    expect(rondelle).toBeDefined();
    expect(rondelle!.def.roule).toBe(true);
    expect(h.recharge).toBe(ENNEMIS_LOCAUX.ottawa!.a!.cadence);
  });
});
