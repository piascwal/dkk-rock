#!/usr/bin/env python3
"""Mat casse sa basse (écran titre en scène, pendant que JBT casse sa batterie) : les images fournies → une planche du jeu.

Usage : python3 outils/prepare-mat-basse.py        (Pillow, numpy et scipy requis)

Entrées : assets-sources/heros/mat-basse/ : joue.jpg (il joue), leve.jpg (la basse au-dessus de la tête), frappe.jpg (il l'écrase
          au sol), cassee.jpg (le manche cassé) ; fond magenta, gros pixels (un pixel fait 9,8 pixels de l'image).
Sortie : public/sprites/mat-basse.png, une pose par ligne dans cet ordre, calées sur les pieds et le milieu du torse. Les tailles
         s'affichent : à reporter dans src/rendu/essai-jbt.ts (« mat-basse »).

Les images ont une vraie grille de gros pixels (presque régulière) : chacune est ramenée à sa résolution d'origine en prenant la
médiane du centre de chaque case (le décalage de la grille est cherché), puis détourée, les traits roses des effets retirés.
"""
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'heros' / 'mat-basse'
SPRITES = RACINE / 'public' / 'sprites'
POSES = ['joue', 'leve', 'frappe', 'cassee']
GRAIN = 9.77
CONTOUR = (24, 18, 26)


def natif(a, g=GRAIN):
    """L'image à la résolution de sa grille : la médiane du centre de chaque case, au décalage où les cases sont les plus unies."""
    meilleur = None
    for oy in np.arange(0, g, 1):
        for ox in np.arange(0, g, 1):
            ys = (oy + g / 2 + np.arange(int((a.shape[0] - oy) / g)) * g).astype(int)
            xs = (ox + g / 2 + np.arange(int((a.shape[1] - ox) / g)) * g).astype(int)
            ys, xs = ys[ys + 2 < a.shape[0]], xs[xs + 2 < a.shape[1]]
            paquets = np.stack([a[ys + dy][:, xs + dx] for dy in (-2, 0, 2) for dx in (-2, 0, 2)])
            ecart = paquets.std(0).mean()
            if meilleur is None or ecart < meilleur[0]:
                meilleur = (ecart, np.median(paquets, 0))
    return meilleur[1]


def detoure(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    fond = (r > 130) & (b > 120) & (g < 140) & ((r + b) / 2 - g > 80)
    im = np.zeros(c.shape[:2] + (4,), np.uint8)
    im[..., :3] = np.clip(c, 0, 255)
    im[..., 3] = np.where(fond, 0, 255)
    rr, gg, bb = (im[..., i].astype(int) for i in range(3))
    # les traits roses ou mauves des effets (mouvement de la basse) : retirés ; le liseré violet au bord : le contour sombre
    op = im[..., 3] > 0
    im[op & (rr - gg > 40) & (bb - gg > 40)] = 0
    op = im[..., 3] > 0
    bord = op & ~ndimage.binary_erosion(op)
    im[bord & (rr - gg > 15) & (bb - gg > 15), :3] = CONTOUR
    et, n = ndimage.label(op)
    if n > 1:
        t = ndimage.sum(np.ones_like(et), et, range(1, n + 1))
        im[~np.isin(et, 1 + np.nonzero(t >= 2)[0])] = 0
    return im


def reperes(im):
    """Le milieu du torse (le t-shirt noir) et le bas des chaussures (blanches)."""
    rgb, op = im[..., :3].astype(int), im[..., 3] > 0
    noir = op & (rgb.max(-1) < 55)
    ys, xs = np.nonzero(noir)
    haut = ys.min()
    torse = noir & (np.arange(im.shape[0])[:, None] < haut + 25)
    blanc = op & (rgb.min(-1) > 190) & (np.arange(im.shape[0])[:, None] > im.shape[0] * 0.6)
    return np.nonzero(torse)[1].mean(), np.nonzero(blanc)[0].max() + 1


def main():
    poses = []
    for nom in POSES:
        im = detoure(natif(np.array(Image.open(SRC / f'{nom}.jpg').convert('RGB')).astype(float)))
        cx, bas = reperes(im)
        poses.append((im, cx, bas))
        print(f'{nom} : {im.shape[1]} x {im.shape[0]}, torse {cx:.0f}, pieds {bas}')
    # le cadre commun : chaque pose placée torse sur torse, pieds sur pieds
    gauche = max(cx for _, cx, _ in poses)
    droite = max(im.shape[1] - cx for im, cx, _ in poses)
    haut = max(bas for _, _, bas in poses)
    dessous = max(im.shape[0] - bas for im, _, bas in poses)
    w, h = int(np.ceil(gauche + droite)), int(np.ceil(haut + dessous))
    planche = Image.new('RGBA', (w, h * len(poses)), (0, 0, 0, 0))
    for i, (im, cx, bas) in enumerate(poses):
        planche.alpha_composite(Image.fromarray(im), (round(gauche - cx), i * h + round(haut - bas)))
    # recadrée au plus juste (mêmes marges pour toutes les poses)
    boites = [planche.crop((0, i * h, w, (i + 1) * h)).getbbox() for i in range(len(poses))]
    x0, y0 = min(b[0] for b in boites), min(b[1] for b in boites)
    x1, y1 = max(b[2] for b in boites), max(b[3] for b in boites)
    finale = Image.new('RGBA', (x1 - x0, (y1 - y0) * len(poses)), (0, 0, 0, 0))
    for i in range(len(poses)):
        finale.alpha_composite(planche.crop((x0, i * h + y0, x1, i * h + y1)), (0, i * (y1 - y0)))
    q = finale.quantize(96, method=Image.FASTOCTREE, dither=Image.NONE)
    q.save(SPRITES / 'mat-basse.png', optimize=True)
    print(f'mat-basse.png : {x1 - x0} x {y1 - y0} par pose, {(SPRITES / "mat-basse.png").stat().st_size // 1024} Ko')
    print(f'  pied {round(gauche - x0)}, sol à {round(haut - y0)} (sur {y1 - y0})')
    debout = reperes(poses[0][0])[1] - np.nonzero(poses[0][0][..., 3].any(1))[0].min()
    print(f'  Mat (joue) : {debout} pixels de haut')


if __name__ == '__main__':
    main()
