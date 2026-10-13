#!/usr/bin/env python3
"""Planches des objets du décor fournis en sprite (le van), sans animation.

Usage : python3 outils/fixe-objets.py      (Pillow et numpy requis)

Entrées : assets-sources/<objet>-base.png     Sorties : public/sprites/<objet>.png + src/rendu/feuilles-objets.ts (généré)
Le sprite est remis sur sa grille de pixels (prepare_instrument.py), recadré sur sa silhouette et agrandi sans lissage à la
largeur voulue en jeu (6 pixels de planche par pixel du jeu).
"""
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

RACINE = pathlib.Path(__file__).resolve().parent.parent
DENSITE = 6
# objet : (fichier source, genre dans jeu/vue.ts, largeur en jeu en pixels)
OBJETS = {'van': ('van-base.png', 'VAN', 56)}


def main():
    lignes = []
    for nom, (source, genre, largeur) in OBJETS.items():
        nat, case = natif_et_case(RACINE / 'assets-sources' / source)
        ys, xs = np.nonzero(nat[..., 3])
        nat = nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
        h, w = nat.shape[:2]
        nw = largeur * DENSITE
        nh = round(h * nw / w)
        yy = np.minimum((np.arange(nh) * h / nh).astype(int), h - 1)
        xx = np.minimum((np.arange(nw) * w / nw).astype(int), w - 1)
        Image.fromarray(nat[np.ix_(yy, xx)]).save(RACINE / 'public' / 'sprites' / f'{nom}.png')
        print(f'{nom}.png : case {case:.2f} px, {w}x{h} natif, {nw}x{nh} px de planche, {nw / DENSITE:.0f}x{nh / DENSITE:.0f} en jeu')
        lignes.append(
            f"  [G.{genre}]: {{ fichier: '{nom}.png', w: {nw}, h: {nh}, images: [1], rythme: 1, densite: {DENSITE}, pied: {nw // 2} }},"
        )
    (RACINE / 'src' / 'rendu' / 'feuilles-objets.ts').write_text(
        "// Fichier généré par outils/fixe-objets.py : ne pas modifier à la main.\n"
        "import { G, type Genre } from '../jeu/vue';\n"
        "import type { Feuille } from './feuilles';\n\n"
        "export const FEUILLES_OBJETS: Partial<Record<Genre, Feuille>> = {\n" + '\n'.join(lignes) + '\n};\n'
    )


if __name__ == '__main__':
    main()
