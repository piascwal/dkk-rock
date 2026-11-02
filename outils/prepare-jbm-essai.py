#!/usr/bin/env python3
"""JBM plus large (mode essai) : ses planches étirées en largeur, pour qu'il ait le gabarit des autres héros (Tom, le nouveau Mat).

Usage : python3 outils/prepare-jbm-essai.py      (Pillow requis)

Entrées : public/sprites/jbm-instrument.png (la planche du héros, cases de 118 × 123), jbm-saut.png, jbm-mur.png, jbm-echelle.png
Sorties : les mêmes, suffixées -essai (jbm-instrument-essai.png…) ; les tailles et les pieds s'affichent (voir essai-jbm.ts).

Chaque case est étirée sans lissage (au plus proche voisin) : une colonne sur cinq est doublée, le pixel art reste net.
"""
import pathlib

from PIL import Image

SPRITES = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'sprites'
LARGEUR = 1.2  # l'étirement


def etire(im):
    return im.resize((round(im.width * LARGEUR), im.height), Image.NEAREST)


def planche(nom, w, h, pied, colonnes=1, lignes=1):
    """La planche `nom`, découpée en cases de w × h, chaque case étirée ; le pied suit."""
    src = Image.open(SPRITES / f'{nom}.png').convert('RGBA')
    w2 = round(w * LARGEUR)
    res = Image.new('RGBA', (w2 * colonnes, h * lignes), (0, 0, 0, 0))
    for j in range(lignes):
        for i in range(colonnes):
            res.alpha_composite(etire(src.crop((i * w, j * h, (i + 1) * w, (j + 1) * h))), (i * w2, j * h))
    res.save(SPRITES / f'{nom}-essai.png', optimize=True)
    print(f'{nom}-essai.png : w {w2}, h {h}, pied {round(pied * LARGEUR)}')


def main():
    planche('jbm-instrument', 118, 123, 68, 6, 15)
    planche('jbm-saut', 86, 112, 43)
    planche('jbm-mur', 144, 248, 94)
    planche('jbm-echelle', 59, 134, 29, 1, 2)


if __name__ == '__main__':
    main()
