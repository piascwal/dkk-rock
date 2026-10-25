#!/usr/bin/env python3
"""Exporte les pièces du générateur (outils/genere-niveaux.py) en modules préconstruits pour l'éditeur de niveau du jeu.

Usage : python3 outils/exporte-modules.py      Sortie : src/editeur/modules.json (généré : ne pas modifier à la main)

Chaque pièce est posée seule sur un terrain plat, puis découpée : le rectangle de ce qui a changé (une colonne de marge de
chaque côté, une rangée au-dessus), jusqu'au sol au moins. `sol` : la rangée du rectangle qui est le sol du terrain à gauche
de la pièce (l'éditeur pose le module sur le sol touché). Le décor placé par la pièce suit, en coordonnées du rectangle.
"""
import importlib.util
import json
import pathlib
import sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / 'outils' / 'niveaux'))
spec = importlib.util.spec_from_file_location('genere', RACINE / 'outils' / 'genere-niveaux.py')
genere = importlib.util.module_from_spec(spec)
spec.loader.exec_module(genere)
from structures import complexe  # noqa: E402

SORTIE = RACINE / 'src' / 'editeur' / 'modules.json'
BASE, X0 = 30, 6

# (identifiant, nom, famille, pièce du générateur, largeur, options)
MODULES = [
    ('maison', 'Maison', 'Bâtiments', 'maison', 14, {}),
    ('toits', 'Toits', 'Bâtiments', 'toits', 42, {}),
    ('echafaudage', 'Échafaudage', 'Bâtiments', 'echafaudage', 22, {'niveaux': 3}),
    ('tour', 'Tour et tyrolienne', 'Bâtiments', 'tour', 18, {'etages': 3, 'tyro': 9}),
    ('forteresse', 'Forteresse', 'Bâtiments', 'forteresse', 34, {'etages': 3, 'cage': True}),
    ('tours', 'Deux tours et passerelle', 'Bâtiments', 'tours', 44, {'etages': 3}),
    ('colline', 'Colline', 'Relief', 'colline', 18, {'haut': 3}),
    ('corniches', 'Corniches (on monte)', 'Relief', 'corniches', 22, {'monte': 6}),
    ('grotte', 'Grotte (on monte dedans)', 'Relief', 'grotte', 20, {'monte': 6}),
    ('descente', 'Descente en tyrolienne', 'Relief', 'descente', 24, {'chute': 6}),
    ('barrage', 'À-pic et échafaudage', 'Relief', 'barrage', 20, {'haut': 12, 'tyro': 11}),
    ('gouffre', 'Gouffre à pitons', 'Vide', 'gouffre', 20, {'nb': 4}),
    ('pont_singe', 'Pont de singe', 'Vide', 'pont_singe', 22, {}),
    ('iles', 'Traversée d’îles', 'Vide', 'traversee', 36, {'mode': 'iles'}),
    ('pont', 'Traversée par un pont', 'Vide', 'traversee', 36, {'mode': 'pont'}),
    ('bastion', 'Bastion de pierre de taille', 'Détours', 'bastion', 26, {'haut': 8}),
    ('passe_haute', 'Passe haute', 'Détours', 'passe_haute', 22, {'haut': 10}),
    ('puits', 'Puits sous la dalle', 'Détours', 'puits', 24, {}),
    ('lac_gele', 'Lac gelé', 'Eau et glace', 'lac_gele', 36, {}),
    ('luge', 'Butte de luge', 'Eau et glace', 'luge', 44, {}),
    ('patinoire', 'Patinoire de hockey', 'Eau et glace', 'patinoire', 64, {}),
    ('shannon', 'Fleuve et pont de pierre', 'Eau et glace', 'shannon', 30, {}),
    ('gymnase', 'Gymnase de JBT', 'Monuments', 'gymnase', 46, {}),
    ('cathedrale_beauvais', 'Cathédrale de Beauvais', 'Monuments', 'cathedrale_beauvais', 40, {}),
    ('chateau', 'Château du roi Jean', 'Monuments', 'chateau_roi_jean', 44, {}),
    ('pub', 'Pub irlandais', 'Monuments', 'pub', 26, {}),
    ('universite', 'Université de Limerick', 'Monuments', 'universite', 40, {}),
    ('cathedrale_lund', 'Cathédrale de Lund', 'Monuments', 'cathedrale_lund', 48, {}),
    ('maisons_rouges', 'Maisons rouges', 'Monuments', 'maisons_rouges', 36, {}),
    ('gratte_ciel', 'Gratte-ciel', 'Monuments', 'gratte_ciel', 26, {'etages': 5}),
    ('metro', 'Métro', 'Monuments', 'metro', 44, {}),
    ('brooklyn', 'Pont de Brooklyn', 'Monuments', 'pont_brooklyn', 56, {}),
    ('bonne_mere', 'Notre-Dame de la Garde', 'Monuments', 'bonne_mere', 44, {}),
    ('calanques', 'Calanques', 'Monuments', 'calanques', 36, {}),
    ('parlement', 'Parlement d’Ottawa', 'Monuments', 'parlement', 46, {}),
    ('glebe', 'Glebe Collegiate', 'Monuments', 'glebe', 34, {'chute': 6}),
    ('halfpipe', 'Half-pipe en bois', 'FISE', 'halfpipe_bois', 40, {'haut': 6}),
    ('bigair', 'Big air', 'FISE', 'bigair', 30, {}),
    ('gradins', 'Gradins', 'FISE', 'gradins', 30, {'haut': 6}),
    ('remparts', 'Remparts', 'Provence', 'remparts', 18, {'haut': 6}),
    ('calade', 'Calade', 'Provence', 'calade', 34, {}),
    ('chapelle', 'Chapelle', 'Provence', 'chapelle', 22, {}),
    ('restanques', 'Restanques', 'Provence', 'restanques', 34, {}),
]


def recette(largeur):
    return genere.Recette('module', 'garage', '01-stc.ts', largeur=largeur, base=BASE, graine=7, profondeur=30)


def cave_complexe(n):
    complexe(n, X0, 28, 'aa', 5, 'K')
    n.puits(X0 + 8, None, n.yg - 4)


def caverne(n):
    px, py = n.caverne(X0, 18, 7)
    n.puits(X0 + 2)
    n.repere(px, '*', ymin=py - 2)


CAVES = [('cave_complexe', 'Complexe souterrain', cave_complexe, 28), ('caverne', 'Caverne à pitons', caverne, 18)]


def decoupe(r, ref, ident, nom, famille, largeur):
    n, m = r.n, ref.n
    diff = [(x, y) for y in range(n.h) for x in range(n.w) if n.g[y][x] != m.g[y][x]]
    if not diff:
        return None
    x0 = max(0, min(x for x, _ in diff) - 1)
    x1 = min(n.w, max(max(x for x, _ in diff) + 2, X0 + largeur))
    y0 = max(0, min(y for _, y in diff) - 1)
    y1 = min(n.h, max(max(y for _, y in diff), BASE) + 2)
    lignes = [''.join(n.g[y][x0:x1]) for y in range(y0, y1)]
    decor = [[d, x - x0, y - y0] for d, x, y in n.decors]
    return {'id': ident, 'nom': nom, 'famille': famille, 'sol': BASE - y0, 'lignes': lignes, 'decor': decor}


def main():
    sortie = []
    for ident, nom, famille, piece, largeur, kw in MODULES:
        r, ref = recette(largeur + 40), recette(largeur + 40)
        r.x = X0
        try:
            r.suite(piece, largeur, **kw)
        except Exception as e:  # une pièce qui demande un contexte (un thème, un voisin) : on la laisse de côté
            print(f'{ident} : ignoré ({e})')
            continue
        m = decoupe(r, ref, ident, nom, famille, largeur)
        if m:
            sortie.append(m)
    for ident, nom, f, largeur in CAVES:
        r, ref = recette(largeur + 40), recette(largeur + 40)
        f(r.n)
        m = decoupe(r, ref, ident, nom, 'Caves', largeur)
        if m:
            sortie.append(m)
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    SORTIE.write_text(json.dumps(sortie, ensure_ascii=False) + '\n')
    print(f'{len(sortie)} modules, {SORTIE.stat().st_size // 1024} Ko')


if __name__ == '__main__':
    main()
