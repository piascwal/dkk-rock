#!/usr/bin/env python3
"""Les animations du livreur en scooter (Marseille), faites à la main (sans Depix) à partir de son sprite.

Usage : python3 outils/anime-scooter.py      (Pillow et numpy requis)

Entrée  : assets-sources/ennemis/scooter-1-base.png (tourné vers la droite)
Sorties : assets-sources/ennemis/scooter-1-anim.png et scooter-1-anim.json (voir anime_commun.py)

Trois calques : la jante de la roue avant, le livreur (buste, tête, sacoche) et le reste (le scooter, le caisson, les jambes).
- la jante de la roue avant tourne (le pneu, uni, reste en place) ; ce que cache la fourche est repris du côté opposé
  (symétrie par rapport au moyeu), pour qu'elle reste pleine en tournant ; ses cinq rayons reviennent en place tous les 72° ;
- le scooter descend d'un pixel sur ses amortisseurs aux bosses, le livreur un temps après ;
- à la charge (l'attaque d'un kamikaze), il cabre : tout le scooter tourne autour du point où la roue arrière touche
  le sol ; touché, il part en arrière.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from anime_commun import MARGE, ecrit_planche, incline, nettoie, pose_sur, sprite, tourne

CORPS, ROUE, PILOTE = range(3)
MOYEU, RAYON = (163.5, 170.0), 15.5  # la jante (le pneu, uni, n'a pas besoin de tourner)
GARDE_BOUE = 152  # au-dessus, dans le disque de la roue : le garde-boue (il reste au scooter)
FOURCHE = (156, 168, 166)  # x de début, x de fin, y du bas : le bras de fourche qui descend au moyeu reste au scooter
SOL_ARRIERE = (45.0, 192.0)  # où la roue arrière touche le sol : le pivot du cabrage


def decoupe(nat):
    h, w = nat.shape[:2]
    op = nat[..., 3] > 0
    yy, xx = np.mgrid[0:h, 0:w]
    lab = np.zeros((h, w), int)
    disque = (xx + 0.5 - MOYEU[0]) ** 2 + (yy + 0.5 - MOYEU[1]) ** 2 <= RAYON**2
    fourche = (xx >= FOURCHE[0]) & (xx <= FOURCHE[1]) & (yy < FOURCHE[2])
    lab[op & disque & (yy >= GARDE_BOUE) & ~fourche] = ROUE
    # le livreur : le buste et la tête au-dessus de la selle, entre le caisson et le guidon
    lab[op & (xx >= 64) & (xx <= 136) & (yy <= 100)] = PILOTE
    return lab


def roue_pleine(nat, lab):
    """La jante seule, complétée par symétrie autour du moyeu là où la fourche la cache."""
    h, w = nat.shape[:2]
    roue = np.zeros_like(nat)
    roue[lab == ROUE] = nat[lab == ROUE]
    yy, xx = np.mgrid[0:h, 0:w]
    disque = (xx + 0.5 - MOYEU[0]) ** 2 + (yy + 0.5 - MOYEU[1]) ** 2 <= RAYON**2
    for y, x in zip(*np.nonzero(disque & (lab != ROUE))):
        sy, sx = int(round(2 * MOYEU[1] - 1 - y)), int(round(2 * MOYEU[0] - 1 - x))
        if 0 <= sy < h and 0 <= sx < w and lab[sy, sx] == ROUE:
            roue[y, x] = nat[sy, sx]
    return roue


class Scooter:
    def __init__(self):
        self.nat = sprite('scooter')
        self.lab = decoupe(self.nat)
        self.roue = roue_pleine(self.nat, self.lab)
        self.c = {}
        for i in (CORPS, PILOTE):
            c = self.nat.copy()
            c[self.lab != i] = 0
            self.c[i] = c

    def image(self, roue=0.0, amorti=0, pilote=0, cabre=0.0, penche=0.0):
        """roue = rotation de la roue (degrés), amorti = descente du scooter, pilote = descente en plus du livreur (px),
        cabre = angle de cabrage (degrés, l'avant se lève), penche = recul du buste (px, négatif : vers l'avant)."""
        r = tourne(self.roue, MOYEU, -roue)
        toile = r.copy()
        pose_sur(toile, self.c[CORPS], 0, amorti)
        pose_sur(toile, self.c[PILOTE], 0, amorti + pilote)
        if penche:
            toile = incline(toile, penche)
        if cabre:
            pivot = (SOL_ARRIERE[0] + MARGE, SOL_ARRIERE[1] + MARGE)
            toile = tourne(toile, pivot, cabre, marge=0)
        return nettoie(toile)


def animations(s):
    # repos : le moteur tourne, le scooter tremble d'un pixel et le livreur suit
    repos = [s.image(amorti=a, pilote=p) for a, p in [(0, 0), (1, 0), (0, 1), (1, 1)]]
    # roule : la roue fait un cinquième de tour (un rayon) en six images, les bosses secouent le scooter puis le livreur
    bosses = [(0, 0), (1, 0), (0, 1), (0, 0), (1, 0), (0, 1)]
    marche = [s.image(roue=12 * i, amorti=a, pilote=p) for i, (a, p) in enumerate(bosses)]
    # charge : il se couche sur le guidon, met les gaz et cabre, puis retombe
    attaque = [
        s.image(roue=0, penche=-4),
        s.image(roue=24, penche=-6, cabre=5),
        s.image(roue=48, penche=-6, cabre=9),
        s.image(roue=0, amorti=1, pilote=1, penche=-3, cabre=3),
    ]
    # touché : le livreur part en arrière, le scooter pique du nez, puis tout se remet
    touche = [
        s.image(penche=9, cabre=-3, amorti=1),
        s.image(penche=5, cabre=-1),
        s.image(penche=2),
    ]
    return [('repos', repos, 10), ('marche', marche, 10), ('attaque', attaque, 10), ('touche', touche, 8)]


def main():
    ecrit_planche('scooter', animations(Scooter()))


if __name__ == '__main__':
    main()
