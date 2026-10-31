#!/usr/bin/env python3
"""Les animations du trader de Wall Street (New York), faites à la main (sans Depix) à partir de son sprite.

Usage : python3 outils/anime-trader.py      (Pillow et numpy requis)

Entrée  : assets-sources/ennemis/trader-1-base.png (tourné vers la droite, en pleine foulée : la mallette d'où dépassent des
          papiers dans la main arrière, une liasse de billets brandie dans la main avant)
Sorties : assets-sources/ennemis/trader-1-anim.png et trader-1-anim.json (voir anime_commun.py)

Il est pressé : l'avant-bras et la liasse tournent autour du coude (il agite les billets), la mallette se balance au bout du
bras autour de la poignée, les deux jambes se décalent ligne à ligne depuis la ceinture, le corps descend d'un pixel à chaque pas.
"""
import math
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from anime_commun import MARGE, comble_entrejambe, ecrit_planche, incline, jambe, nettoie, pas, pose_sur, sprite, tourne

CORPS, BILLETS, MALLETTE, JAMBE_AR, JAMBE_AV = range(5)
HANCHE, GENOU, CHEVILLE = 118, 150, 172
COUDE = (118, 97)  # l'avant-bras et la liasse tournent autour
POIGNEE = (40, 110)  # la mallette se balance autour


def decoupe(nat):
    """L'étiquette de chaque pixel : corps, avant-bras et billets, mallette et main arrière, jambe arrière, jambe avant."""
    h, w = nat.shape[:2]
    op = nat[..., 3] > 0
    r, g, b = (nat[..., i].astype(int) for i in range(3))
    lum = (r * 3 + g * 6 + b) // 10
    yy, xx = np.mgrid[0:h, 0:w]
    lab = np.zeros((h, w), int)
    # l'avant-bras levé et la liasse : à droite du torse, au-dessus du coude
    lab[op & (yy <= 101) & (((xx >= 119) & (yy >= 58)) | (xx >= 127))] = BILLETS
    # la mallette, ses papiers et la main qui la tient : à gauche, sous la manchette ; le pantalon (rayé, bleuté) n'en est pas
    costume = (b > r + 6) & (lum < 140)
    lab[op & (xx < 64) & (yy >= 104) & (yy <= 167) & ~costume] = MALLETTE
    # les jambes, sous la ceinture : la séparation suit l'entrejambe, en biais
    separation = np.interp(yy, [HANCHE, 135, h], [78, 82, 86])
    jambes = op & (yy >= HANCHE) & (lab == CORPS)
    lab[jambes & (xx < separation)] = JAMBE_AR
    lab[jambes & (xx >= separation)] = JAMBE_AV
    return lab


class Trader:
    def __init__(self):
        self.nat = sprite('trader')
        self.lab = decoupe(self.nat)
        self.c = {}
        for i in (CORPS, BILLETS, MALLETTE, JAMBE_AR, JAMBE_AV):
            c = self.nat.copy()
            c[self.lab != i] = 0
            self.c[i] = c
        self.h, self.w = self.nat.shape[:2]

    def image(self, bob=0, bras=0.0, mallette=0.0, ja=(0, 0), jv=(0, 0), penche=0.0, leve=0):
        """bob = descente du corps (px), bras = rotation de l'avant-bras (degrés, positif : il lève la liasse), mallette = balancement
        (degrés, positif : vers l'avant), ja / jv = (avance, lève) de chaque pied, penche = recul du buste (px), leve = montée du bras (px)."""
        toile = np.zeros((self.h + 2 * MARGE, self.w + 2 * MARGE, 4), np.uint8)
        pose_sur(toile, jambe(self.c[JAMBE_AR], *ja, HANCHE, GENOU, CHEVILLE))
        pose_sur(toile, jambe(self.c[JAMBE_AV], *jv, HANCHE, GENOU, CHEVILLE))
        pose_sur(toile, self.c[CORPS], 0, bob)
        pose_sur(toile, tourne(self.c[BILLETS], COUDE, bras, marge=0), 0, bob - leve)
        pose_sur(toile, tourne(self.c[MALLETTE], POIGNEE, mallette, marge=0), 0, bob)
        comble_entrejambe(toile, HANCHE)
        if penche:
            toile = incline(toile, penche)
        return nettoie(toile)


def animations(t):
    # repos : il piétine d'impatience et agite sa liasse
    repos = [t.image(bob=b, bras=a) for b, a in [(0, 0), (1, 4), (0, 8), (1, 4)]]
    # marche : six images, les pieds en opposition ; la mallette se balance à contretemps, la liasse suit le pas
    marche = []
    for i in range(6):
        u = i / 6
        (av, lv), (ar, lr) = pas(u, 6.0, 6.0), pas(u + 0.5, 6.0, 6.0)
        bob = round(2 * abs(math.cos(2 * math.pi * u)))
        s = math.sin(2 * math.pi * u)
        marche.append(t.image(bob=bob, bras=5 * s + 2, mallette=6 * s, ja=(ar, lr), jv=(av, lv)))
    # attaque : il ramène la liasse, puis la brandit bien haut (« BUY ! »), et redescend
    attaque = [
        t.image(bob=2, bras=-10, penche=3, mallette=-3),
        t.image(bob=0, bras=4, leve=5, penche=-4, jv=(3, 0), mallette=4),
        t.image(bras=6, leve=8, penche=-6, jv=(4, 0), mallette=6),
        t.image(bras=3, leve=3, penche=-2, jv=(2, 0), mallette=2),
    ]
    # touché : le buste part en arrière, la liasse retombe, la mallette part vers l'avant, puis il se redresse
    touche = [
        t.image(bob=2, bras=-18, penche=11, mallette=10, ja=(-3, 0), jv=(3, 0)),
        t.image(bob=1, bras=-9, penche=6, mallette=5),
        t.image(bras=-2, penche=2),
    ]
    return [('repos', repos, 6), ('marche', marche, 8), ('attaque', attaque, 10), ('touche', touche, 8)]


def main():
    ecrit_planche('trader', animations(Trader()))


if __name__ == '__main__':
    main()
