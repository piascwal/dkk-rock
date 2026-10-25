import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { catalogue, cleAGarder, lettreDe } from '../src/editeur/catalogue';
import { DocumentNiveau } from '../src/editeur/document';
import { exporteModules, extraisModule, lisModules } from '../src/editeur/modules-perso';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { CYCLE_APPARENCES, lisPersonnage } from '../src/entites/ennemis/gens';
import { Partie } from '../src/jeu/partie';
import { ajouteNiveauEssai } from '../src/niveaux';

/** Une page blanche avec, sur le sol, une bigoudène à la harpe bis et un hockeyeur d'Ottawa (dans le garage). */
function docAvecGens(): DocumentNiveau {
  const d = DocumentNiveau.vierge(60, 30, 'garage');
  const sol = d.lignes().findIndex((l) => l.includes('#')) - 1;
  d.commence();
  d.pose(30, sol, 'h');
  d.choisitGens(30, sol, '_/h#2');
  d.pose(36, sol, 'a');
  d.choisitGens(36, sol, 'ottawa/a');
  d.termine();
  return d;
}

describe('les gens de l’éditeur : tous les visages, et ceux des autres villes', () => {
  it('la palette propose chaque apparence (les trois bigoudènes) et les gens de chaque ville', () => {
    const gens = catalogue('gens');
    expect(gens.filter((c) => c.cle.startsWith('_/h#')).length).toBe(3);
    expect(gens.some((c) => c.cle === 'ottawa/a' && c.nom === 'Hockeyeur')).toBe(true);
    expect(lettreDe('ottawa/a')).toBe('a');
    expect(lettreDe('_/h#2')).toBe('h');
    // la lettre seule suffit : rien à garder sur la case
    expect(cleAGarder('ottawa/a', 'ottawa')).toBeNull();
    expect(cleAGarder('ottawa/a', 'garage')).toBe('ottawa/a');
  });

  it('un niveau joué pose le personnage choisi, avec son apparence', () => {
    const d = docAvecGens();
    const p = new Partie({
      niveau: ajouteNiveauEssai(d.versDef('essai-gens')),
      drapeau: -1,
      vies: VIES_DEPART,
      score: 0,
    });
    p.ajouteJoueur(0, 0);
    while (p.phase === 'histoire') p.suivant();
    const ennemis = p.entites.filter((e): e is Ennemi => e instanceof Ennemi);
    const bigoudene = ennemis.find((e) => e.def.nom === 'Bigoudène')!;
    expect(bigoudene.id % CYCLE_APPARENCES).toBe(2);
    expect(bigoudene.id % 3).toBe(2);
    expect(ennemis.some((e) => e.def === lisPersonnage('ottawa/a', 'garage')!.def)).toBe(true);
  });

  it('les gens choisis survivent à l’annulation, à l’export et au changement de taille', () => {
    const d = docAvecGens();
    const avant = d.listeGens();
    d.commence();
    d.pose(30, avant[0]![1], 'b');
    d.termine();
    expect(d.listeGens().length).toBe(1); // une autre lettre : le choix s'en va
    d.annule();
    expect(d.listeGens()).toEqual(avant);
    const e = DocumentNiveau.depuisJSON(JSON.stringify(d.versJSON()));
    expect(e.listeGens()).toEqual(avant);
    e.commence();
    e.redimensionne(60, 34);
    e.termine();
    expect(e.listeGens().map(([x, y]) => [x, y])).toEqual(avant.map(([x, y]) => [x, y + 4]));
  });
});

describe('mes modules', () => {
  it('une sélection devient un module, qui se repose ailleurs à l’identique', () => {
    const d = docAvecGens();
    const sol = d.lignes().findIndex((l) => l.includes('#'));
    d.ajouteDecor('sapinNeige', 32, sol);
    const m = extraisModule(d, [28, sol - 3, 38, sol + 1], 'Coin des gens');
    expect(m.sol).toBe(3);
    expect(m.lignes.length).toBe(5);
    expect(m.gens?.length).toBe(2);
    expect(m.decor).toEqual([['sapinNeige', 4, 3]]);
    const e = DocumentNiveau.vierge(60, 30, 'garage');
    e.commence();
    e.tampon(m, 5, sol);
    e.termine();
    expect(e.gensEn(7, sol - 1)).toBe('_/h#2');
    expect(e.get(13, sol - 1)).toBe('a');
    expect(e.decor).toContainEqual(['sapinNeige', 9, sol]);
  });

  it('s’exportent et se réimportent ; un autre fichier est refusé', () => {
    const m = extraisModule(docAvecGens(), [25, 10, 40, 22], 'Essai');
    const l = lisModules(JSON.stringify(exporteModules([m])));
    expect(l).toEqual([m]);
    expect(() => lisModules('{"format":"dkk-niveau"}')).toThrow(/export de modules/);
    expect(() => lisModules('{"format":"dkk-modules","version":1,"modules":[{"nom":3}]}')).toThrow(
      /Aucun module/,
    );
  });
});
