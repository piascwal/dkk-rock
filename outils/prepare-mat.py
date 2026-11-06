#!/usr/bin/env python3
"""Mat : ses images fournies → les planches du jeu.

Usage : python3 outils/prepare-mat.py && python3 outils/anime-instrument.py mat
        (Pillow, numpy et scipy requis)

Entrées : assets-sources/heros/mat-source/ : repos.jpg (debout, la basse en main), saut.jpg, mur.jpg (de profil contre la
          paroi), echelle.jpg (de dos) ; sur fond magenta, à la même échelle (une case de pixel art fait 9,75 pixels).
Sorties : assets-sources/heros/mat-instrument-base.png : Mat debout, remis sur sa grille, dans un carré : la référence
          d'où anime-instrument.py tire la planche du héros (la marche, la visée : la basse et les bras pivotent ensemble,
          voir gabarits_instrument.py) ;
          public/sprites/mat-saut.png, mat-mur.png, mat-echelle.png (de dos, puis son miroir : les deux temps de la montée,
          les jambes alternent), public/portraits/mat.png, intro-heros.png (les silhouettes de l'intro, celle de Mat remplacée).
          Les tailles et les pieds s'affichent : à reporter dans src/rendu/feuilles-objets.ts (les planches du décor).

Chaque image est remise sur sa grille : la grille est retrouvée sur les contours, chaque case prend la couleur médiane de son
centre ; le liseré violet que laisse le fond magenta devient le contour sombre. Un pixel de la grille est un pixel de planche
(Mat debout en fait 118, l'ancien 120).
"""
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'heros' / 'mat-source'
SPRITES = RACINE / 'public' / 'sprites'
CASE = 9.75  # la taille d'une case de pixel art dans les images fournies
CONTOUR = (28, 22, 30)
HAUTEUR_INTRO = 121  # la hauteur de Mat dans l'intro (128 × 128 par héros), comme les autres silhouettes
CARRE = 120  # le carré de la référence (anime-instrument.py la veut carrée)
DENSITE = 6  # pixels de planche par pixel du jeu
BORD_MUR = 4.2  # contre la paroi : le pied à cette distance (pixels du jeu) du bord de l'image côté paroi (voir fixe-objets.py)


def masque(a):
    """Ce qui n'est pas le fond magenta (les miettes de moins de 2000 pixels, du bruit JPEG, sont retirées)."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    fond = (r > 140) & (b > 130) & (g < 120) & ((r + b) / 2 - g > 110)
    etiquettes, n = ndimage.label(~fond)
    tailles = ndimage.sum(np.ones_like(etiquettes), etiquettes, range(1, n + 1))
    return np.isin(etiquettes, 1 + np.nonzero(tailles > 2000)[0])


def phase(a, op, axe):
    """Où commencent les cases le long d'un axe : là où tombent le plus de contours (modulo la case)."""
    bords = (np.abs(np.diff(a, axis=axe)).sum(-1) > 60) & (op[:, 1:] if axe == 1 else op[1:, :])
    compte = bords.sum(0 if axe == 1 else 1)
    histo = np.zeros(40)
    for p, c in enumerate(compte):
        histo[int((p + 1) % CASE * 4) % 40] += c
    return histo.argmax() / 4


def regrille(nom):
    """L'image `nom` sur sa grille : un pixel par case, la couleur médiane de son centre."""
    a = np.array(Image.open(SRC / nom).convert('RGB')).astype(float)
    op = masque(a)
    px, py = phase(a, op, 1), phase(a, op, 0)
    ys, xs = np.nonzero(op)
    j0, j1 = int((ys.min() - py) // CASE), int((ys.max() - py) // CASE) + 1
    i0, i1 = int((xs.min() - px) // CASE), int((xs.max() - px) // CASE) + 1
    nat = np.zeros((j1 - j0, i1 - i0, 4), np.uint8)
    for j in range(j0, j1):
        for i in range(i0, i1):
            ya, yb = max(0, int(py + j * CASE + 1)), int(py + (j + 1) * CASE - 1)
            xa, xb = max(0, int(px + i * CASE + 1)), int(px + (i + 1) * CASE - 1)
            m = op[ya:yb, xa:xb]
            if m.size and m.mean() >= 0.5:
                nat[j - j0, i - i0, :3] = np.median(a[ya:yb, xa:xb][m], axis=0)
                nat[j - j0, i - i0, 3] = 255
    rr, gg, bb = (nat[..., k].astype(int) for k in range(3))
    lisere = (nat[..., 3] > 0) & (rr - gg > 15) & (bb - gg > 15) & (abs(rr - bb) < 70)
    nat[lisere, :3] = CONTOUR
    im = Image.fromarray(nat)
    return np.array(im.crop(im.getbbox()))


def reference(repos):
    """Mat debout dans un carré, posé en bas, à 14 pixels du bord gauche : la référence de anime-instrument.py."""
    h, w = repos.shape[:2]
    carre = Image.new('RGBA', (CARRE, CARRE), (0, 0, 0, 0))
    carre.alpha_composite(Image.fromarray(repos), (14, CARRE - h))
    carre.save(RACINE / 'assets-sources' / 'heros' / 'mat-instrument-base.png')
    print(f'mat-instrument-base.png : {CARRE} x {CARRE}')


def image_seule(nat, nom, pied):
    Image.fromarray(nat).save(SPRITES / f'{nom}.png', optimize=True)
    print(f'{nom}.png : w {nat.shape[1]}, h {nat.shape[0]}, pied {pied}')


def echelle_deux_temps(nat):
    """Les deux temps de la montée : l'image de dos, puis son miroir (les jambes et les bras alternent), l'une sous l'autre."""
    im = Image.fromarray(nat)
    planche = Image.new('RGBA', (im.width, im.height * 2), (0, 0, 0, 0))
    planche.alpha_composite(im, (0, 0))
    planche.alpha_composite(im.transpose(Image.FLIP_LEFT_RIGHT), (0, im.height))
    planche.save(SPRITES / 'mat-echelle.png', optimize=True)
    print(f'mat-echelle.png : w {im.width}, h {im.height}, pied {im.width // 2}')


def portrait(repos):
    """Le portrait des dialogues (44 × 44, comme les autres) : la tête et les épaules de Mat debout, à sa taille d'origine (une
    fenêtre plus serrée coupait ses épaules, plus larges qu'elle : les autres portraits montrent leurs épaules)."""
    al = repos[..., 3] > 0
    haut = np.nonzero(al.any(1))[0].min()
    # le milieu de la tête : les cheveux, les 14 premières rangées (plus bas, la tête de la basse dépasse à droite)
    xs = np.nonzero(al[haut : haut + 14].any(0))[0]
    cx = (xs.min() + xs.max()) // 2
    Image.fromarray(repos).crop((cx - 22, haut - 1, cx + 22, haut + 43)).save(
        RACINE / 'public' / 'portraits' / 'mat.png', optimize=True
    )
    print('portraits/mat.png : 44 x 44')


def intro(repos):
    """Les silhouettes de l'intro (128 × 128 par héros) : celle de Mat (la quatrième) remplacée par le nouveau Mat debout."""
    planche = Image.open(SPRITES / 'intro-heros.png').convert('RGBA')
    planche.paste((0, 0, 0, 0), (3 * 128, 0, 4 * 128, 128))
    im = Image.fromarray(repos)
    # la même hauteur que les quatre autres silhouettes (118 à 123 pixels, la moyenne ici) : il ne doit pas paraître plus petit
    haut = HAUTEUR_INTRO
    k = haut / im.height
    im = im.resize((round(im.width * k), haut), Image.NEAREST)
    planche.alpha_composite(im, (3 * 128 + 64 - im.width // 2, 128 - im.height))
    planche.save(SPRITES / 'intro-heros.png', optimize=True)
    print('intro-heros.png')


def main():
    repos = regrille('repos.jpg')
    reference(repos)
    saut = regrille('saut.jpg')
    image_seule(saut, 'mat-saut', saut.shape[1] // 2)
    mur = regrille('mur.jpg')  # il regarde la paroi, à droite
    image_seule(mur, 'mat-mur', mur.shape[1] - round(BORD_MUR * DENSITE))
    echelle_deux_temps(regrille('echelle.jpg'))
    portrait(repos)
    intro(repos)


if __name__ == '__main__':
    main()
