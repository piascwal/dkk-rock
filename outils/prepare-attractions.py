#!/usr/bin/env python3
"""Les images des attractions de la scène (grosses caisses trampolines en bois et en métal, tonneau-fusée en métal) : les images
fournies (fond magenta, un pixel y fait 5,12 pixels) → trois images du jeu.

Usage : python3 outils/prepare-attractions.py        (Pillow, numpy et scipy requis)

Entrées : assets-sources/decor/attractions/ : tonneau-metal.jpg, trampoline-metal.jpg, trampoline-bois.jpg.
Sorties : public/sprites/<même nom>.png, recadrées sur leur silhouette. Les tailles s'affichent : à reporter dans
          src/rendu/feuilles-attractions.ts.
"""
import importlib.util
import pathlib

import numpy as np
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('prepare_casse', RACINE / 'outils' / 'prepare-casse.py')
pc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pc)
SRC = RACINE / 'assets-sources' / 'decor' / 'attractions'
GRAIN = 5.12


def main():
    for nom in ('tonneau-metal', 'trampoline-metal', 'trampoline-bois'):
        im = pc.detoure(pc.natif(np.array(Image.open(SRC / f'{nom}.jpg').convert('RGB')).astype(float), GRAIN))
        p = Image.fromarray(im)
        p = p.crop(p.getbbox())
        q = p.quantize(80, method=Image.FASTOCTREE, dither=Image.NONE)
        sortie = pc.SPRITES / f'{nom}.png'
        q.save(sortie, optimize=True)
        print(f'{nom}.png : {p.width} x {p.height}, {sortie.stat().st_size // 1024} Ko')


if __name__ == '__main__':
    main()
