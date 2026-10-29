import { describe, expect, it } from 'vitest';
import { DocumentNiveau, TAILLE_MAX, TAILLE_MIN } from '../src/editeur/document';
import {
  copieDansLePressePapier,
  extraisModule,
  pressePapier,
  trouveModule,
} from '../src/editeur/modules-perso';

/** Un petit niveau repérable : un « B » aux quatre coins de la zone utile, de quoi voir où ils vont. */
function repere(): DocumentNiveau {
  const d = DocumentNiveau.vide(40, 20);
  d.pose(2, 3, 'B');
  d.pose(30, 15, 'B');
  d.ajouteDecor('arbre', 10, 12);
  d.ajouteDecor('figuier', 12, 12, 2);
  d.choisitGens(5, 5, 'a');
  d.tyroliennes = [
    [
      [3, 4],
      [20, 8],
    ],
  ];
  return d;
}

describe('recadrer la carte', () => {
  it('ajouter à gauche et en haut décale tout ce qui est posé ; ajouter à droite et en bas ne bouge rien', () => {
    const d = repere();
    expect(d.recadre(5, 4, 0, 0)).toBe(true);
    expect([d.largeur, d.hauteur]).toEqual([45, 24]);
    expect(d.get(7, 7)).toBe('B');
    expect(d.get(35, 19)).toBe('B');
    expect(d.decor).toContainEqual(['arbre', 15, 16]);
    expect(d.decor).toContainEqual(['figuier', 17, 16, 2]);
    expect(d.gensEn(10, 9)).toBe('a');
    expect(d.tyroliennes[0]).toEqual([
      [8, 8],
      [25, 12],
    ]);
    d.recadre(0, 0, 10, 10);
    expect([d.largeur, d.hauteur]).toEqual([55, 34]);
    expect(d.get(7, 7)).toBe('B');
  });

  it('rogner retire ce qui sort du cadre (carte, décor, gens, tyroliennes), le reste suit', () => {
    const d = repere();
    expect(d.recadre(-5, -2, -8, -1)).toBe(true);
    expect([d.largeur, d.hauteur]).toEqual([27, 17]);
    expect(d.lignes().join('').match(/B/g)).toHaveLength(1); // le premier B était à gauche du nouveau cadre
    expect(d.get(30 - 5, 15 - 2)).toBe('B'); // le second reste, décalé
    expect(d.decor.map((x) => x[0])).toEqual(['arbre', 'figuier']);
    expect(d.tyroliennes).toEqual([]); // le départ est sorti du cadre : plus qu'un poteau
    expect(d.gensEn(0, 3)).toBe('a');
  });

  it('refuse une taille hors des limites, sans rien changer ; annuler rend la carte', () => {
    const d = repere();
    expect(d.recadre(0, 0, -(40 - TAILLE_MIN[0] + 1), 0)).toBe(false);
    expect(d.recadre(TAILLE_MAX[0], 0, 0, 0)).toBe(false);
    expect(d.largeur).toBe(40);
    d.commence();
    d.recadre(3, 3, 3, 3);
    d.termine();
    expect(d.largeur).toBe(46);
    d.annule();
    expect([d.largeur, d.hauteur]).toEqual([40, 20]);
    expect(d.get(2, 3)).toBe('B');
  });

  it('redimensionne garde son sens : colonnes à droite, rangées en haut', () => {
    const d = repere();
    d.redimensionne(50, 25);
    expect([d.largeur, d.hauteur]).toEqual([50, 25]);
    expect(d.get(2, 8)).toBe('B');
  });

  it('un niveau vide n’a ni sol, ni départ, ni van', () => {
    const d = DocumentNiveau.vide(60, 30);
    expect(d.lignes().every((l) => l.trim() === '')).toBe(true);
    expect(d.verifie().ok).toBe(false);
  });
});

describe('copier une sélection', () => {
  it('le presse-papier se pose comme un module : son bas sur la rangée touchée, décor compris', () => {
    const d = repere();
    d.pose(2, 3, 'B');
    d.ajouteDecor('figuier', 3, 4, 1);
    const m = extraisModule(d, [2, 2, 4, 4], '');
    copieDansLePressePapier(m);
    expect(pressePapier()!.lignes.length).toBe(3);
    expect(trouveModule('presse-papier')).toBeDefined();
    d.tampon(pressePapier()!, 20, 11 + 1); // bas de la copie sur la rangée 11
    expect(d.get(20, 11 - 2 + 1)).toBe('B');
    expect(d.decor).toContainEqual(['figuier', 21, 11, 1]); // en bas de la copie, comme à l'origine
  });

  it('le départ et le van restent dans le niveau : ils ne partent pas dans la copie', () => {
    const d = DocumentNiveau.vierge(60, 30);
    const l = d.lignes();
    const y = l.findIndex((r) => r.includes('@'));
    const m = extraisModule(d, [0, y, 10, y], '');
    expect(m.lignes[0]).not.toContain('@');
  });
});
