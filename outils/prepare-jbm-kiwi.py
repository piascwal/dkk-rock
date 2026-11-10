#!/usr/bin/env python3
"""JBM sur Fadatchi (écran titre en scène : son numéro pendant que JBT casse sa batterie) : les images fournies → une planche.

Usage : python3 outils/prepare-jbm-kiwi.py        (Pillow, numpy et scipy requis)

Entrées : assets-sources/heros/jbm-kiwi/ : attend.jpg (assis, les mains sur les cuisses), selle.jpg (il tient la selle),
          bras.jpg (un bras levé), decolle.jpg (en l'air, au-dessus du kiwi) ; fond magenta, un pixel y fait 5,1 pixels.
Sortie : public/sprites/jbm-kiwi.png, une pose par ligne dans cet ordre. Le kiwi est au même endroit sur les quatre images :
         elles gardent leur cadre commun (le sol : les pattes du kiwi). Les tailles s'affichent : à reporter dans
         src/rendu/feuilles-concert.ts (« jbm-kiwi »).
"""
import importlib.util
import pathlib

import numpy as np
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('prepare_casse', RACINE / 'outils' / 'prepare-casse.py')
pc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pc)
SRC = RACINE / 'assets-sources' / 'heros' / 'jbm-kiwi'
POSES = ['attend', 'selle', 'bras', 'decolle']
GRAIN = 5.12


def main():
    images = [pc.detoure(pc.natif(np.array(Image.open(SRC / f'{p}.jpg').convert('RGB')).astype(float), GRAIN)) for p in POSES]
    h0 = min(im.shape[0] for im in images)
    w0 = min(im.shape[1] for im in images)
    images = [Image.fromarray(im[:h0, :w0]) for im in images]
    boites = [im.getbbox() for im in images]
    x0, y0 = min(b[0] for b in boites), min(b[1] for b in boites)
    x1, y1 = max(b[2] for b in boites), max(b[3] for b in boites)
    w, h = x1 - x0, y1 - y0
    planche = Image.new('RGBA', (w, h * len(images)), (0, 0, 0, 0))
    for i, im in enumerate(images):
        planche.alpha_composite(im.crop((x0, y0, x1, y1)), (0, i * h))
    q = planche.quantize(96, method=Image.FASTOCTREE, dither=Image.NONE)
    q.save(pc.SPRITES / 'jbm-kiwi.png', optimize=True)
    # le kiwi (le milieu de ses pattes) : le pied de l'image ; la tête de JBM (sa largeur, pour la densité)
    al = np.array(images[0].crop((x0, y0, x1, y1)))[..., 3] > 0
    bas = np.nonzero(al.any(1))[0].max()
    pattes = np.nonzero(al[bas - 3 : bas + 1].any(0))[0]
    haut = np.nonzero(al.any(1))[0].min()
    tete = np.nonzero(al[haut + 8])[0]
    print(f'jbm-kiwi.png : {w} x {h} par pose, {(pc.SPRITES / "jbm-kiwi.png").stat().st_size // 1024} Ko')
    print(f'  pied {round((pattes.min() + pattes.max()) / 2)}, sol à {bas + 1} (sur {h}), tête {tete.max() - tete.min()} de large')


if __name__ == '__main__':
    main()
