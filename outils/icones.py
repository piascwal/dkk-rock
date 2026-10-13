#!/usr/bin/env python3
"""Les icônes de l'application installée (PWA) : Fadatchi, le kiwi du groupe, sur fond de scène avec un projecteur.

Usage : python3 outils/icones.py      Sorties : public/icone-192.png, public/icone-512.png, public/icone-maskable-512.png
Le kiwi vient de assets-sources/fadatchi/pose-b-pieds-joints.png, lu sur sa grille : aucun pixel n'est redessiné.
"""
import pathlib
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

RACINE = pathlib.Path(__file__).resolve().parent.parent


def detoure(a):
    """Rend transparent le fond blanc relié aux bords de l'image (le blanc à l'intérieur du kiwi reste)."""
    h, w = a.shape[:2]
    blanc = (a[..., :3].astype(int) > 225).all(-1) | (a[..., 3] < 128)
    vu = np.zeros((h, w), bool)
    pile = [(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)]
    while pile:
        y, x = pile.pop()
        if not (0 <= y < h and 0 <= x < w) or vu[y, x] or not blanc[y, x]:
            continue
        vu[y, x] = True
        pile += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    a[vu] = 0
    return a


def icone(taille, zone):
    """`zone` : part de l'icône occupée par le kiwi (plus petite pour l'icône « maskable », rognée en cercle)."""
    n = 96  # dessinée sur une grille de 96, agrandie sans lissage
    im = Image.new('RGBA', (n, n), (18, 9, 20, 255))
    d = ImageDraw.Draw(im)
    # le projecteur : un cône violet qui éclaire la scène
    for y in range(n):
        demi = 6 + y * 0.42
        d.line([(n / 2 - demi, y), (n / 2 + demi, y)], fill=(42, 16, 51, 255))
    # la bande de tartan, en bas
    for i, couleur in enumerate([(196, 23, 44), (11, 110, 79), (27, 58, 138)] * 8):
        d.rectangle([i * 4, n - 10, i * 4 + 3, n - 7], fill=couleur)
    nat, _ = natif_et_case(RACINE / 'assets-sources' / 'fadatchi' / 'pose-b-pieds-joints.png')
    a = detoure(nat.copy())
    ys, xs = np.nonzero(a[..., 3] > 128)
    a = a[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
    kiwi = Image.fromarray(a)
    k = max(1, int(n * zone / max(kiwi.size)))
    kiwi = kiwi.resize((kiwi.width * k // 1, kiwi.height * k // 1), Image.NEAREST) if k > 1 else kiwi
    im.alpha_composite(kiwi, ((n - kiwi.width) // 2, n - 11 - kiwi.height))
    return im.resize((taille, taille), Image.NEAREST)


if __name__ == '__main__':
    for t in (192, 512):
        icone(t, 0.8).save(RACINE / 'public' / f'icone-{t}.png')
    icone(512, 0.6).save(RACINE / 'public' / 'icone-maskable-512.png')
    print('ok')
