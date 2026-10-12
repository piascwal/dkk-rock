"""Remet les sprites « avec instrument » sur leur grille réelle, puis les agrandit au plus proche voisin à ~240 px de haut.

Les fichiers de 1024 px ont des cases de tailles différentes (2, 5, 10 ou 11 px) : on détecte la grille par la position
des contours, on lit le centre de chaque case, puis on agrandit d'un facteur choisi pour que tous les héros fassent
à peu près la même hauteur. Le résultat est l'« espace de travail » où se définissent les gabarits.
"""
import pathlib

import numpy as np
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'heros'
# nom : (fichier, taille d'une case dans le fichier, agrandissement de la case en pixels de travail)
SPECS = {
    'tom': ('tom-guitare-base.png', 2.0, 1.0),
    'jbm': ('jbm-instrument-base.png', 10.0, 2.5),
    'jbt': ('jbt-instrument-base.png', 10.0, 2.5),
    'mat': ('mat-instrument-base.png', 11.0, 2.75),
    'jbg': ('jbg-instrument-base.png', 5.0, 1.25),
}


def origine(contours, case):
    """Position (modulo la case) où commencent les cases : là où tombent les contours."""
    pos = np.nonzero(contours)[0] + 1
    return int(np.bincount((np.round(pos % case)).astype(int) % max(1, int(round(case)))).argmax())


def espace_de_travail(nom):
    fichier, case, echelle = SPECS[nom]
    a = np.array(Image.open(SRC / fichier).convert('RGBA'))
    rgb = a[..., :3].astype(int)
    ox = origine((np.abs(np.diff(rgb, axis=1)).sum(-1) > 40).any(0), case)
    oy = origine((np.abs(np.diff(rgb, axis=0)).sum(-1) > 40).any(1), case)
    n = int(a.shape[0] // case)
    ys = np.clip((oy + (np.arange(n) + 0.5) * case).astype(int), 0, a.shape[0] - 1)
    xs = np.clip((ox + (np.arange(n) + 0.5) * case).astype(int), 0, a.shape[1] - 1)
    nat = a[np.ix_(ys, xs)]
    m = int(round(n * echelle))
    idx = np.minimum((np.arange(m) / echelle).astype(int), n - 1)
    return nat[np.ix_(idx, idx)]


if __name__ == '__main__':
    import sys
    from PIL import ImageDraw
    sortie = pathlib.Path(sys.argv[1])
    for nom in SPECS:
        w = espace_de_travail(nom)
        ys, xs = np.nonzero(w[..., 3] > 0)
        print(nom, w.shape[:2], 'bbox x', xs.min(), xs.max(), 'y', ys.min(), ys.max())
        z = 4
        bg = Image.new('RGBA', (w.shape[1], w.shape[0]), (200, 200, 200, 255))
        bg.alpha_composite(Image.fromarray(w))
        im = bg.resize((bg.width * z, bg.height * z), Image.NEAREST)
        d = ImageDraw.Draw(im)
        for v in range(0, bg.width, 20):
            d.line([(v * z, 0), (v * z, im.height)], fill=(255, 120, 120, 255))
            d.text((v * z + 2, 2), str(v), fill=(0, 0, 0, 255))
            d.line([(0, v * z), (im.width, v * z)], fill=(255, 120, 120, 255))
            d.text((2, v * z + 2), str(v), fill=(0, 0, 0, 255))
        im.save(sortie / f'ws-{nom}.png')


def detecte_case(a):
    """Taille d'une case du sprite dans le fichier : la plus grande période où tous les contours s'alignent."""
    rgb = a[..., :3].astype(int)
    d = (np.abs(np.diff(rgb, axis=1)).sum(-1) > 40).sum(0)
    pos = np.arange(len(d))
    meilleure = 2.0
    for t in np.arange(1.5, 12.0, 0.01):
        ang = 2 * np.pi * (pos % t) / t
        if abs((d * np.exp(1j * ang)).sum()) / max(1, d.sum()) > 0.97:
            meilleure = t
    return float(meilleure)


def natif_et_case(chemin):
    """Le sprite remis sur sa grille réelle (un pixel par case), et la taille de case détectée."""
    a = np.array(Image.open(chemin).convert('RGBA'))
    case = detecte_case(a)
    rgb = a[..., :3].astype(int)
    ox = origine((np.abs(np.diff(rgb, axis=1)).sum(-1) > 40).any(0), case)
    oy = origine((np.abs(np.diff(rgb, axis=0)).sum(-1) > 40).any(1), case)
    ny, nx = int((a.shape[0] - oy) // case), int((a.shape[1] - ox) // case)
    ys = np.clip((oy + (np.arange(ny) + 0.5) * case).astype(int), 0, a.shape[0] - 1)
    xs = np.clip((ox + (np.arange(nx) + 0.5) * case).astype(int), 0, a.shape[1] - 1)
    return a[np.ix_(ys, xs)], case
