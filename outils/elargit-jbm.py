#!/usr/bin/env python3
"""JBM plus large : ses planches étirées en largeur, pour qu'il ait le gabarit des autres héros (Tom, JBT).

Usage : python3 outils/elargit-jbm.py      (Pillow requis)
        Une seule fois, juste après avoir refait ses planches (anime-instrument.py jbm, fixe-objets.py) : il refuse une planche
        déjà étirée.

Entrées et sorties : public/sprites/jbm-instrument.png (la planche du héros, cases de 118 × 123 avant), jbm-saut.png,
          jbm-mur.png, jbm-echelle.png, réécrites en place ; les tailles et les pieds s'affichent : les reporter dans
          feuilles-heros.ts (et assets-sources/heros/meta-jbm.json) et feuilles-objets.ts.

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
    if src.width != w * colonnes:
        raise SystemExit(f'{nom}.png fait {src.width} de large, pas {w * colonnes} : déjà étirée ?')
    w2 = round(w * LARGEUR)
    res = Image.new('RGBA', (w2 * colonnes, h * lignes), (0, 0, 0, 0))
    for j in range(lignes):
        for i in range(colonnes):
            res.alpha_composite(etire(src.crop((i * w, j * h, (i + 1) * w, (j + 1) * h))), (i * w2, j * h))
    res.save(SPRITES / f'{nom}.png', optimize=True)
    print(f'{nom}.png : w {w2}, h {h}, pied {round(pied * LARGEUR)}')


def main():
    planche('jbm-instrument', 118, 123, 68, 6, 15)
    planche('jbm-saut', 86, 112, 43)
    planche('jbm-mur', 144, 248, 94)
    planche('jbm-echelle', 59, 134, 29, 1, 2)


if __name__ == '__main__':
    main()
