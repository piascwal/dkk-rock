#!/usr/bin/env python3
"""Planche de Tom avec sa guitare, à partir du sprite de référence qui la tient (assets-sources/heros/tom-guitare-base.png).

Usage : python3 outils/anime-guitare.py        Sortie : public/sprites/tom-guitare.png + aperçu + méta (affichée).

Le sprite du fichier 1024 a des cases de 2 px : on travaille sur la grille 512. La guitare et les bras forment
une seule pièce qui pivote à l'épaule pour viser ; les jambes bougent comme pour les autres héros. Lignes de la
planche : celles de ANIM (0 repos, 1 course, 2 saut, 3 échelle, 4 tyrolienne, 5 mur, 6 mort, 10 tir), puis les
lignes 11 à 14 : course en visant en diagonale haut, haut, diagonale bas, bas (code de visée 1 à 4).
"""
import json
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import numpy as np
from PIL import Image

import squelette

squelette.K = 4
from squelette import Personnage, vote
from gabarit_guitare import CORPS, MEMBRES, source_remplissage

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'heros'
SORTIE = RACINE / 'public' / 'sprites'
DENSITE = 6  # pixels de planche par pixel du jeu : Tom fait ~39 px de haut en jeu
VISEES = {1: -28, 2: -48, 3: 26, 4: 46}  # angle de la guitare (degrés, + = vers le bas) par code de visée


def cos(d):
    return math.cos(math.radians(d))


def sin(d):
    return math.sin(math.radians(d))


def jambes(av=0, ar=0, tav=0, tar=0):
    return {'cuisse_avant': av, 'cuisse_arriere': ar, 'tibia_avant': tav, 'tibia_arriere': tar}


def course(arme=0):
    poses = []
    for phi in range(0, 360, 60):
        psi = phi + 180
        p = jambes(20 * cos(phi), 20 * cos(psi), 38 * max(0, sin(phi)), 38 * max(0, sin(psi)))
        p['arme'] = arme
        poses.append(p)
    return poses


def poses():
    return {
        0: [dict(jambes(), arme=a) for a in (0, -1.5, -2.5, -1.5)],
        1: course(),
        2: [dict(jambes(-30, 18, 50, 45), arme=-3)],
        3: [dict(jambes(-25, 0, 50, 0)), dict(jambes(0, -25, 0, 50))],
        4: [dict(jambes(3, -3, 8, 8), arme=-6)],
        5: [dict(jambes(-25, 12, 45, 35), arme=-4)],
        6: [dict(jambes(-20, 15, 30, 25), arme=-10)],
        10: [dict(jambes(), arme=-2), dict(jambes(), arme=-5)],
        **{10 + k: course(a) for k, a in VISEES.items()},
    }


def au_sol(im, base):
    a = np.array(im)
    ys = np.where(a[..., 3].any(1))[0]
    res = Image.new('RGBA', im.size, (0, 0, 0, 0))
    res.alpha_composite(im, (0, base - int(ys.max())))
    return res


def nettoie(im, mini=14):
    """Retire les îlots de moins de `mini` pixels (miettes des découpes) et bouche les trous d'un pixel."""
    a = np.array(im)
    al = a[..., 3] > 0
    vu = np.zeros_like(al)
    for y0, x0 in zip(*np.nonzero(al)):
        if vu[y0, x0]:
            continue
        pile, comp = [(y0, x0)], []
        vu[y0, x0] = True
        while pile:
            y, x = pile.pop()
            comp.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < al.shape[0] and 0 <= xx < al.shape[1] and al[yy, xx] and not vu[yy, xx]:
                        vu[yy, xx] = True
                        pile.append((yy, xx))
        if len(comp) < mini:
            for y, x in comp:
                a[y, x] = 0
    return Image.fromarray(a)


def renverse(im, angle, centre):
    k = 4
    grand = im.resize((im.width * k, im.height * k), Image.NEAREST)
    return Image.fromarray(vote(np.array(grand.rotate(-angle, resample=Image.NEAREST, center=(centre[0] * k, centre[1] * k)))))


def main():
    brut = np.array(Image.open(SRC / 'tom-guitare-base.png').convert('RGBA'))[1::2, 1::2]
    nat = Image.fromarray(brut)
    perso = Personnage(nat, MEMBRES, CORPS, source_remplissage)
    base = int(np.where(brut[..., 3].any(1))[0].max())
    ancre = 262
    lignes = {}
    for ligne, ps in poses().items():
        fr = []
        for p in ps:
            f = perso.pose(p)
            if ligne == 6:
                f = renverse(f, -80, (ancre, base))
            fr.append(nettoie(au_sol(f, base)))
        lignes[ligne] = fr
    boite = None
    for fr in lignes.values():
        for f in fr:
            b = f.getbbox()
            boite = b if boite is None else (min(boite[0], b[0]), min(boite[1], b[1]), max(boite[2], b[2]), max(boite[3], b[3]))
    cadre = (boite[0], boite[1], boite[2], base + 1)
    lignes = {k: [f.crop(cadre) for f in v] for k, v in lignes.items()}
    w, h = lignes[0][0].size
    images = [len(lignes.get(i, [])) for i in range(max(lignes) + 1)]
    planche = Image.new('RGBA', (w * max(images), h * len(images)), (0, 0, 0, 0))
    for i, fr in lignes.items():
        for j, f in enumerate(fr):
            planche.alpha_composite(f, (j * w, i * h))
    planche.save(SORTIE / 'tom-guitare.png')
    ap = Image.new('RGBA', planche.size, (255, 0, 255, 255))
    ap.alpha_composite(planche)
    ap.resize((ap.width // 2, ap.height // 2), Image.NEAREST).save(SRC / 'apercu-tom-guitare.png')
    # milieu du personnage dans l'image : les pieds sont posés au milieu du bas, on le centre sur son cadre
    print(json.dumps({'fichier': 'tom-guitare.png', 'w': w, 'h': h, 'images': images, 'densite': DENSITE,
                      'visees': 11, 'cadre_x': ancre - boite[0]}))


if __name__ == '__main__':
    main()
