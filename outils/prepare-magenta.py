#!/usr/bin/env python3
"""Un sprite d'ennemi reçu en JPEG sur fond magenta → assets-sources/ennemis/<type>-1-base.png, prêt pour outils/anime-*.py.

Usage : python3 outils/prepare-magenta.py <image.jpg> <type> [hauteur]      (Pillow et numpy requis)

Le fond magenta est retiré ; le personnage est ramené à `hauteur` pixels (186 par défaut, comme le bouliste et le supporter), chaque
pixel prenant la couleur médiane de sa case dans l'image (le JPEG n'a pas de grille nette) ; le liseré violet que laisse le fond
autour des contours devient le contour sombre. Le résultat est agrandi deux fois (la grille que retrouve natif_et_case) dans une
image de 512 × 512.
"""
import pathlib
import sys

import numpy as np
from PIL import Image

SRC = pathlib.Path(__file__).resolve().parent.parent / 'assets-sources' / 'ennemis'
CONTOUR = (28, 22, 30)


def prepare(chemin, hauteur=186):
    a = np.array(Image.open(chemin).convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    op = ~((r > 140) & (b > 130) & (g < 120) & ((r + b) / 2 - g > 110))
    ys, xs = np.nonzero(op)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    f = (y1 - y0) / hauteur
    w = int(round((x1 - x0) / f))
    nat = np.zeros((hauteur, w, 4), np.uint8)
    for j in range(hauteur):
        for i in range(w):
            ya, yb, xa, xb = int(y0 + j * f), int(y0 + (j + 1) * f), int(x0 + i * f), int(x0 + (i + 1) * f)
            m = op[ya:yb, xa:xb]
            if m.size and m.mean() >= 0.5:
                nat[j, i, :3] = np.median(a[ya:yb, xa:xb][m], axis=0)
                nat[j, i, 3] = 255
    rr, gg, bb = (nat[..., k].astype(int) for k in range(3))
    liseré = (nat[..., 3] > 0) & (rr - gg > 30) & (bb - gg > 30) & (abs(rr - bb) < 70)
    nat[liseré, :3] = CONTOUR
    up = np.repeat(np.repeat(nat, 2, 0), 2, 1)
    base = np.zeros((512, 512, 4), np.uint8)
    oy, ox = (512 - up.shape[0]) // 2, (512 - up.shape[1]) // 2
    base[oy : oy + up.shape[0], ox : ox + up.shape[1]] = up
    return base


def main():
    chemin, type_ = sys.argv[1], sys.argv[2]
    hauteur = int(sys.argv[3]) if len(sys.argv) > 3 else 186
    Image.fromarray(prepare(chemin, hauteur)).save(SRC / f'{type_}-1-base.png')
    print(f'{type_}-1-base.png')


if __name__ == '__main__':
    main()
