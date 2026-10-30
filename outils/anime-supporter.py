#!/usr/bin/env python3
"""Les animations du supporter de l'OM (Marseille), faites à la main (sans Depix) à partir de son sprite.

Usage : python3 outils/anime-supporter.py      (Pillow et numpy requis)

Entrée  : assets-sources/ennemis/supporter-1-base.png (tourné vers la droite, les mains en « L » devant le visage)
Sorties : assets-sources/ennemis/supporter-1-anim.png et supporter-1-anim.json (voir anime_commun.py)

Le geste des mains est ce qui le rend reconnaissable : les deux avant-bras et les mains forment un seul bloc, qui monte
et descend en rythme (il chante), sans tourner. Le corps (tête, maillot, épaules) suit le pas en descendant d'un ou deux
pixels ; les deux jambes, la jambe arrière tendue et la jambe avant fléchie, se décalent ligne à ligne depuis le short.
Sous les mains qui montent, le maillot (ou le cou) reprend la couleur du pixel du corps juste en dessous.
"""
import math
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from anime_commun import MARGE, comble_entrejambe, ecrit_planche, incline, jambe, nettoie, pas, pose_sur, sprite, voisins

CORPS, MAINS, JAMBE_AR, JAMBE_AV = range(4)
HANCHE, GENOU, CHEVILLE = 100, 135, 170


def decoupe(nat):
    """L'étiquette de chaque pixel : corps, mains (avant-bras compris), jambe arrière (à gauche), jambe avant (à droite)."""
    h, w = nat.shape[:2]
    op = nat[..., 3] > 0
    r, g, b = (nat[..., i].astype(int) for i in range(3))
    lum = (r * 3 + g * 6 + b) // 10
    yy, xx = np.mgrid[0:h, 0:w]
    peau = (r > g + 8) & (r > b + 25) & (r > 120)
    lab = np.zeros((h, w), int)
    # les mains et les avant-bras : la peau devant le visage (hors joue et menton) et devant le maillot
    zone = ((xx >= 71) & (yy >= 24)) | ((xx >= 63) & (yy >= 35)) | ((xx >= 33) & (yy >= 50))
    lab[op & peau & zone & (yy <= 78)] = MAINS
    for _ in range(2):
        lab[voisins(lab == MAINS) & op & (lum < 60) & (lab == CORPS) & zone & (yy <= 80)] = MAINS
    # les jambes, short compris : la séparation suit le bord de la jambe avant du short, en biais
    separation = np.interp(yy, [HANCHE, 130, h], [40, 50, 48])
    jambes = op & (yy >= HANCHE) & (lab == CORPS)
    lab[jambes & (xx < separation)] = JAMBE_AR
    lab[jambes & (xx >= separation)] = JAMBE_AV
    return lab


def remplit_corps(nat, lab):
    """Le corps sans les mains : chaque pixel qu'elles cachaient prend la couleur du premier pixel du corps juste en dessous."""
    corps = nat.copy()
    corps[lab != CORPS] = 0
    h = nat.shape[0]
    for y, x in zip(*np.nonzero(lab == MAINS)):
        dessous = next((k for k in range(y + 1, min(h, y + 8)) if lab[k, x] == CORPS and nat[k, x, 3]), None)
        if dessous is not None:
            corps[y, x] = nat[dessous, x]
    return corps


class Supporter:
    def __init__(self):
        self.nat = sprite('supporter')
        self.lab = decoupe(self.nat)
        self.corps = remplit_corps(self.nat, self.lab)
        self.c = {}
        for i in (MAINS, JAMBE_AR, JAMBE_AV):
            c = self.nat.copy()
            c[self.lab != i] = 0
            self.c[i] = c
        self.h, self.w = self.nat.shape[:2]

    def image(self, bob=0, mains=0, ja=(0, 0), jv=(0, 0), penche=0.0):
        """bob = descente du corps (px), mains = montée des mains (px), ja / jv = (avance, lève) de chaque pied, penche = recul du buste (px)."""
        toile = np.zeros((self.h + 2 * MARGE, self.w + 2 * MARGE, 4), np.uint8)
        pose_sur(toile, jambe(self.c[JAMBE_AR], *ja, HANCHE, GENOU, CHEVILLE))
        pose_sur(toile, jambe(self.c[JAMBE_AV], *jv, HANCHE, GENOU, CHEVILLE))
        pose_sur(toile, self.corps, 0, bob)
        pose_sur(toile, self.c[MAINS], 0, bob - mains)
        comble_entrejambe(toile, HANCHE)
        if penche:
            toile = incline(toile, penche)
        return nettoie(toile)


def animations(s):
    # repos : il chante, le corps rebondit et les mains montent au temps fort
    repos = [s.image(bob=d, mains=m) for d, m in [(0, 0), (1, 2), (2, 4), (1, 2)]]
    # marche : six images, les pieds en opposition ; les mains montent à chaque pas
    marche = []
    for i in range(6):
        u = i / 6
        (av, lv), (ar, lr) = pas(u, 7.0, 7.0), pas(u + 0.5, 7.0, 7.0)
        bob = round(2 * abs(math.cos(2 * math.pi * u)))
        marche.append(s.image(bob=bob, mains=round(3 * abs(math.sin(2 * math.pi * u))), ja=(ar, lr), jv=(av, lv)))
    # attaque : il se ramasse, puis se jette en avant les mains en l'air (il lance), et revient
    attaque = [
        s.image(bob=3, mains=-2, penche=3),
        s.image(bob=1, mains=6, penche=-6, jv=(4, 0)),
        s.image(mains=9, penche=-9, jv=(6, 0), ja=(-3, 0)),
        s.image(mains=4, penche=-3, jv=(2, 0)),
    ]
    # touché : le buste part en arrière, les mains retombent, puis il se redresse
    touche = [
        s.image(bob=2, mains=-3, penche=12, ja=(-3, 0), jv=(3, 0)),
        s.image(bob=1, mains=-1, penche=7),
        s.image(penche=2),
    ]
    return [('repos', repos, 6), ('marche', marche, 8), ('attaque', attaque, 10), ('touche', touche, 8)]


def main():
    ecrit_planche('supporter', animations(Supporter()))


if __name__ == '__main__':
    main()
