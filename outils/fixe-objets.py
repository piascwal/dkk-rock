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
# objet : (fichiers sources, un par état (une ligne de la planche chacun), genre dans jeu/vue.ts, largeur en jeu en pixels)
OBJETS = {
    'van': (['van-base.png'], 'VAN', 56),
    'cage': (['cage-1-base.png', 'cage-2-base.png'], 'CAGE', 22),  # fermée, puis ouverte
}


def agrandit(chemin, largeur):
    """Le sprite remis sur sa grille, recadré, agrandi sans lissage à `largeur` px de planche."""
    nat, case = natif_et_case(chemin)
    ys, xs = np.nonzero(nat[..., 3])
    return nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1], case


def main():
    lignes = []
    for nom, (sources, genre, largeur) in OBJETS.items():
        etats = [agrandit(RACINE / 'assets-sources' / s, largeur) for s in sources]
        # tous les états ont la même échelle (celle du premier) pour que l'objet ne change pas de taille en s'ouvrant
        h0, w0 = etats[0][0].shape[:2]
        echelle = largeur * DENSITE / w0
        images = []
        for nat, _ in etats:
            h, w = nat.shape[:2]
            nw, nh = round(w * echelle), round(h * echelle)
            yy = np.minimum((np.arange(nh) / echelle).astype(int), h - 1)
            xx = np.minimum((np.arange(nw) / echelle).astype(int), w - 1)
            images.append(Image.fromarray(nat[np.ix_(yy, xx)]))
        cw, ch = max(i.width for i in images), max(i.height for i in images)
        planche = Image.new('RGBA', (cw, ch * len(images)), (0, 0, 0, 0))
        for k, im in enumerate(images):  # centré, posé en bas de sa case
            planche.alpha_composite(im, ((cw - im.width) // 2, k * ch + ch - im.height))
        planche.save(RACINE / 'public' / 'sprites' / f'{nom}.png')
        print(f'{nom}.png : {len(images)} état(s), {cw}x{ch} px de planche, {cw / DENSITE:.0f}x{ch / DENSITE:.0f} en jeu')
        ligne = ', '.join(['1'] * len(images))
        lignes.append(
            f"  [G.{genre}]: {{ fichier: '{nom}.png', w: {cw}, h: {ch}, images: [{ligne}], rythme: 1, densite: {DENSITE}, pied: {cw // 2} }},"
        )
    (RACINE / 'src' / 'rendu' / 'feuilles-objets.ts').write_text(
        "// Fichier généré par outils/fixe-objets.py : ne pas modifier à la main.\n"
        "import { G, type Genre } from '../jeu/vue';\n"
        "import type { Feuille } from './feuilles';\n\n"
        "export const FEUILLES_OBJETS: Partial<Record<Genre, Feuille>> = {\n" + '\n'.join(lignes) + '\n};\n'
    )


if __name__ == '__main__':
    main()
