#!/usr/bin/env python3
"""Les animations des gens de Lund, faites à la main (sans Depix) à partir de leur sprite.

Usage : python3 outils/anime-lund.py      (Pillow et numpy requis)

Entrées : assets-sources/ennemis/etudiant-1-base.png (l'étudiant en salopette, bonnet et sac à dos), cycliste-1-base.png (le
          cycliste du quotidien, vélo hollandais et sacoche) et cycliste-2-base.png (le coureur en maillot de la Suède, vélo de
          course) ; préparés depuis leur image sur fond magenta par outils/prepare-magenta.py
Sorties : assets-sources/ennemis/<type>-<n>-anim.png et <type>-<n>-anim.json (voir anime_commun.py)

- l'étudiant : les jambes se décalent ligne à ligne, le sac à dos ballotte autour de l'épaule, la main se balance ;
- les cyclistes : les rayons des deux roues tournent (le pneu et la jante, unis, restent en place ; seuls les rayons gris ou noirs tournent, le cadre, coloré,
  reste ; ce que le cadre cache de la roue est repris du côté opposé, par symétrie autour du moyeu), le cycliste rebondit sur sa
  selle ; à la charge (l'attaque d'un kamikaze), il se couche sur le guidon et lève la roue avant.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from anime_commun import MARGE, Calques, ecrit_planche, incline, nettoie, pas, pose_sur, sprite, tourne

import math

PNEU = 5  # l'épaisseur du pneu et de la jante, en pixels


class Etudiant(Calques):
    def __init__(self):
        super().__init__('etudiant', hanche=125, genou=150, cheville=175, poignee=(28, 58), coude=(30, 110), garde_bras=True)

    def zones(self, xx, yy, op):
        bras = (xx >= 18) & (xx <= 44) & (yy >= 114) & (yy <= 140)  # la main (et ce qu'elle tient)
        valise = (xx <= 27) & (yy >= 50) & (yy <= 118)  # le sac à dos
        return bras, valise, np.full(xx.shape, 50)


def anime_etudiant(e):
    repos = [e.image(bob=b, main=m) for b, m in [(0, (0, 0)), (1, (0, 1)), (0, (1, 0)), (1, (0, 1))]]
    marche = []
    for i in range(6):
        u = i / 6
        (av, lv), (ar, lr) = pas(u, 6.0, 6.0), pas(u + 0.5, 6.0, 6.0)
        s = math.sin(2 * math.pi * u)
        marche.append(e.image(bob=round(2 * abs(math.cos(2 * math.pi * u))), main=(round(2 * s), 0), valise=-3 * s, ja=(ar, lr), jv=(av, lv)))
    # attaque : il lève son verre (« Skål ! ») en se penchant, le sac part en arrière
    attaque = [
        e.image(bob=1, penche=2, main=(-1, 1)),
        e.image(penche=-4, main=(2, -6), valise=4, jv=(3, 0)),
        e.image(penche=-6, main=(3, -9), valise=6, jv=(4, 0)),
        e.image(penche=-2, main=(1, -3), valise=2),
    ]
    touche = [
        e.image(bob=2, penche=11, main=(-2, 2), valise=-8, ja=(-3, 0), jv=(3, 0)),
        e.image(bob=1, penche=6, main=(-1, 1), valise=-4),
        e.image(penche=2),
    ]
    return [('repos', repos, 6), ('marche', marche, 8), ('attaque', attaque, 10), ('touche', touche, 8)]


class Cycliste:
    """roues : [(centre x, centre y, rayon)] ; caches : rectangles (x0, y0, x1, y1) de gris qui ne tournent pas (chaussure,
    pédalier) ; buste : rangée au-dessus de laquelle le cycliste rebondit ; sol : le point où la roue arrière touche le sol."""

    def __init__(self, n, roues, caches, buste, guidon):
        self.nat = sprite('cycliste', n)
        h, w = self.nat.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        op = self.nat[..., 3] > 0
        rgb = self.nat[..., :3].astype(int)
        gris = (rgb.max(-1) - rgb.min(-1) < 45) & op
        fixe = np.zeros((h, w), bool)
        for x0, y0, x1, y1 in caches:
            fixe |= (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)
        self.roues = []
        reste = self.nat.copy()
        for cx, cy, r in roues:
            # seuls les rayons tournent : le pneu et la jante (les `PNEU` pixels du bord), unis, restent en place
            disque = (xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 <= (r - PNEU) ** 2
            roue = disque & gris & ~fixe
            calque = np.zeros_like(self.nat)
            calque[roue] = self.nat[roue]
            # ce que le cadre cache : le pixel symétrique autour du moyeu
            for y, x in zip(*np.nonzero(disque & ~roue)):
                sy, sx = int(round(2 * cy - 1 - y)), int(round(2 * cx - 1 - x))
                if 0 <= sy < h and 0 <= sx < w and roue[sy, sx]:
                    calque[y, x] = self.nat[sy, sx]
            reste[roue] = 0
            self.roues.append((calque, (cx, cy)))
        # le cycliste (buste, tête, bras) : au-dessus de la selle, hors du guidon
        haut = (yy < buste) & ~((xx >= guidon) & (yy > buste - 30))
        self.pilote = reste.copy()
        self.pilote[~haut] = 0
        self.velo = reste.copy()
        self.velo[haut] = 0
        self.sol = (roues[0][0], roues[0][1] + roues[0][2])

    def image(self, roue=0.0, bob=0, cabre=0.0, penche=0.0):
        toile = np.zeros((self.nat.shape[0] + 2 * MARGE, self.nat.shape[1] + 2 * MARGE, 4), np.uint8)
        for calque, (cx, cy) in self.roues:
            pose_sur(toile, tourne(calque, (cx - 0.5, cy - 0.5), -roue, marge=0))
        pose_sur(toile, self.velo)
        pose_sur(toile, self.pilote, 0, bob)
        if penche:
            toile = incline(toile, penche)
        if cabre:
            toile = tourne(toile, (self.sol[0] + MARGE, self.sol[1] + MARGE), cabre, marge=0)
        return nettoie(toile)


def anime_cycliste(c, vif=1.0):
    repos = [c.image(bob=b) for b in (0, 1, 1, 0)]
    # roule : les roues tournent, le cycliste rebondit sur sa selle à chaque coup de pédale
    marche = [c.image(roue=round(15 * vif) * i, bob=(0, 1, 1, 0, 1, 1)[i]) for i in range(6)]
    # charge : il se couche sur le guidon, appuie fort et lève la roue avant, puis retombe
    attaque = [
        c.image(roue=0, penche=-4),
        c.image(roue=30, penche=-6, cabre=4),
        c.image(roue=60, penche=-7, cabre=7),
        c.image(roue=90, bob=1, penche=-3, cabre=2),
    ]
    touche = [c.image(penche=9, cabre=-3, bob=1), c.image(penche=5, cabre=-1), c.image(penche=2)]
    return [('repos', repos, 6), ('marche', marche, 10), ('attaque', attaque, 10), ('touche', touche, 8)]


def main():
    ecrit_planche('etudiant', anime_etudiant(Etudiant()))
    # le cycliste du quotidien : le pédalier et la sacoche restent en place
    hollandais = Cycliste(1, [(33.5, 155, 31), (134, 155, 31)], [(55, 138, 86, 176), (8, 110, 46, 146)], buste=100, guidon=100)
    ecrit_planche('cycliste', anime_cycliste(hollandais), n=1)
    # le coureur : la chaussure noire et le pédalier restent en place ; ses roues tournent plus vite
    coureur = Cycliste(2, [(37.5, 147, 36.5), (141.5, 148.5, 37)], [(46, 126, 96, 174)], buste=92, guidon=118)
    ecrit_planche('cycliste', anime_cycliste(coureur, vif=1.5), n=2)


if __name__ == '__main__':
    main()
