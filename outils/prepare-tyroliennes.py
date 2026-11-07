#!/usr/bin/env python3
"""Les tyroliennes de JBG, Tom et JBT : leurs bandes de 4 poses fournies (fond magenta) → public/sprites/<héros>-tyrolienne.png.

Usage : python3 outils/prepare-tyroliennes.py        (Pillow, numpy et scipy requis ; même traitement que outils/prepare-jbm.py)

Entrées : assets-sources/heros/<héros>-source/tyrolienne.jpg. Chaque héros garde deux poses qui se balancent, les deux mains au
câble ; les autres sont écartées : JBG 1 (presque la 3) et 4 (une main au câble, l'autre à la sangle), Tom 1 et 2 (une seule main
au câble), JBT 1 (debout, pieds au sol) et 4 (une main au câble). La densité met chaque héros à l'échelle de sa planche de jeu
(la taille de sa tête) : à reporter, avec les tailles affichées, dans src/rendu/feuilles-tyroliennes.ts.
"""
import importlib.util
import pathlib

RACINE = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('prepare_jbm', RACINE / 'outils' / 'prepare-jbm.py')
pj = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pj)

# héros : (les poses gardées, de 0 à 3 ; pixels de planche par pixel du jeu)
HEROS = {'jbg': ((1, 2), 6.8), 'tom': ((2, 3), 6), 'jbt': ((2, 1), 7.2)}


def main():
    for nom, (gardees, densite) in HEROS.items():
        pj.SRC = RACINE / 'assets-sources' / 'heros' / f'{nom}-source'
        poses = [pj.cases('tyrolienne.jpg')[i] for i in gardees]
        w, h = max(im.width for im in poses) + 4, max(im.height for im in poses)
        pj.ancre_de = lambda im: im.width / 2
        pj.enregistre(pj.planche([[im] for im in poses], w, h, w / 2), f'{nom}-tyrolienne')
        print(f'  {nom} : w {w}, h {h}, pied {w // 2}, densité {densite}')


if __name__ == '__main__':
    main()
