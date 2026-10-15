import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { ARME_CHAUFFAGE, ARMES_RAMASSABLES } from '../src/entites/armes';
import { Chauffage } from '../src/entites/chauffage';
import { Projectile } from '../src/entites/projectile';
import { C } from '../src/jeu/commandes';
import { Objet } from '../src/entites/objets';
import { Partie } from '../src/jeu/partie';
import { G } from '../src/jeu/vue';
import { JET_FLAMME } from '../src/entites/projectiles-defs';

const nouvelle = () => {
  const p = new Partie({ niveau: 0, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

/** Pose l'arme-chauffage sur le héros, qui la ramasse au pas suivant. */
function ramasse(p: Partie) {
  const j = p.joueurs[0]!;
  p.ajoute(
    new Objet(p, 'arme', Math.floor(j.corps.x / 16) * 16, Math.floor(j.corps.y / 16) * 16, ARME_CHAUFFAGE),
  );
  p.avance();
  return j;
}

const chauffages = (p: Partie) => p.entites.filter((e): e is Chauffage => e instanceof Chauffage && !e.fini);
const genres = (p: Partie) => p.vue().entites.map((e) => e.g);

describe('le chauffage soufflant', () => {
  it('est la dernière arme à ramasser, et un compagnon', () => {
    expect(ARME_CHAUFFAGE).toBe(ARMES_RAMASSABLES.length);
    expect(ARMES_RAMASSABLES[ARME_CHAUFFAGE - 1]!.compagnon).toBe(true);
  });

  it('apparaît quand on le ramasse et prend la place de Fadatchi', () => {
    const p = nouvelle();
    expect(genres(p)).toContain(G.KIWI);
    const j = ramasse(p);
    p.avance();
    expect(j.arme).toBe(ARME_CHAUFFAGE);
    expect(chauffages(p)).toHaveLength(1);
    expect(genres(p)).toContain(G.CHAUFFAGE);
    expect(genres(p)).not.toContain(G.KIWI);
  });

  it('souffle un jet de flammes depuis lui, pas depuis le héros, en dépensant des munitions', () => {
    const p = nouvelle();
    const j = ramasse(p);
    p.avance();
    const avant = j.munitions;
    for (let t = 0; t < 12; t++) {
      p.commande(0, C.TIR);
      p.avance();
    }
    const jets = p.entites.filter((e): e is Projectile => e instanceof Projectile && e.def === JET_FLAMME);
    expect(jets.length).toBeGreaterThan(0);
    expect(j.munitions).toBeLessThan(avant);
    const c = chauffages(p)[0]!.corps;
    // le jet naît au niveau du chauffage (devant lui, à hauteur du cercle de sa grille), pas contre le héros
    expect(Math.abs(jets[0]!.y - (c.y + c.h - 7))).toBeLessThan(12);
  });

  it('s’en va quand les munitions s’épuisent : Fadatchi revient', () => {
    const p = nouvelle();
    const j = ramasse(p);
    p.avance();
    j.munitions = 1;
    p.commande(0, C.TIR);
    p.avance();
    p.commande(0, 0);
    p.avance();
    p.avance();
    expect(j.arme).toBe(0);
    expect(chauffages(p)).toHaveLength(0);
    expect(j.compagnon).toBeNull();
    expect(genres(p)).toContain(G.KIWI);
    expect(genres(p)).not.toContain(G.CHAUFFAGE);
  });

  it('avance par petits bonds derrière le héros qui marche', () => {
    const p = nouvelle();
    ramasse(p);
    let enLAir = 0;
    for (let t = 0; t < 90; t++) {
      p.commande(0, C.DROITE);
      p.avance();
      if (chauffages(p)[0] && !chauffages(p)[0]!.corps.auSol) enLAir++;
    }
    expect(enLAir).toBeGreaterThan(5);
    expect(chauffages(p)).toHaveLength(1);
  });
});
