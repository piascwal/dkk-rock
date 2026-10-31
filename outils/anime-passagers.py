#!/usr/bin/env python3
"""Les animations des deux passagers de Beauvais, faites à la main (sans Depix) à partir de leur sprite.

Usage : python3 outils/anime-passagers.py      (Pillow et numpy requis)

Entrées : assets-sources/ennemis/presse-1-base.png (le passager pressé, en pleine course, sa valise à roulettes derrière lui,
          les yeux sur sa montre) et perdu-1-base.png (le passager perdu, sa valise à la main, il se gratte la tête) ; préparés
          depuis leur image sur fond magenta par outils/prepare-magenta.py
Sorties : assets-sources/ennemis/<type>-1-anim.png et <type>-1-anim.json (voir anime_commun.py)

Chacun est découpé en calques (Calques, dans anime_commun.py) : le corps, les deux jambes (décalées ligne à ligne depuis la ceinture), la valise et la main qui la
tient (elle tourne autour de la poignée), le bras qui bouge (la montre du pressé tourne autour du coude ; la main du perdu se
déplace sur ses cheveux, ses pixels restent aussi sur le corps : rien ne se découvre).
"""
import math
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from anime_commun import Calques, ecrit_planche, pas

class Presse(Calques):
    def __init__(self):
        super().__init__('presse', hanche=112, genou=140, cheville=170, poignee=(55, 100), coude=(163, 82))

    def zones(self, xx, yy, op):
        bras = (xx >= 133) & (yy >= 66) & (yy <= 98)  # l'avant-bras, le poing et la montre
        valise = (yy >= 94) & ((xx < 57) | ((xx < 68) & (yy < 134)))  # la main, la poignée, la valise (pas la chaussure)
        separation = np.interp(yy, [112, 130, 145, 186], [100, 105, 112, 125])
        return bras, valise, separation


class Perdu(Calques):
    def __init__(self):
        super().__init__('perdu', hanche=118, genou=150, cheville=176, poignee=(45, 124), coude=(130, 50), garde_bras=True)

    def zones(self, xx, yy, op):
        bras = (xx >= 108) & (yy <= 46)  # la main dans les cheveux
        valise = (yy >= 116) & (xx < 53)
        separation = np.interp(yy, [118, 186], [84, 86])
        return bras, valise, separation


def anime_presse(p):
    # repos : il piétine, regarde sa montre, la secoue
    repos = [p.image(bob=b, bras=a) for b, a in [(0, 0), (1, 5), (0, -3), (1, 5)]]
    # course : six images, le corps rebondit, la valise tressaute sur ses roulettes, le bras de la montre bat la mesure
    course = []
    for i in range(6):
        u = i / 6
        (av, lv), (ar, lr) = pas(u, 6.0, 7.0), pas(u + 0.5, 6.0, 7.0)
        s = math.sin(2 * math.pi * u)
        course.append(p.image(bob=round(3 * abs(math.cos(2 * math.pi * u))), bras=6 * s, valise=4 * s, ja=(ar, lr), jv=(av, lv)))
    # attaque (il fonce) : il se penche en avant, la valise lancée derrière lui
    attaque = [
        p.image(bob=2, penche=3, valise=-4),
        p.image(bob=1, penche=-5, valise=6, bras=-6, jv=(4, 0)),
        p.image(penche=-9, valise=10, bras=-10, jv=(6, 0), ja=(-3, 0)),
        p.image(penche=-4, valise=4, bras=-3, jv=(2, 0)),
    ]
    touche = [
        p.image(bob=2, penche=11, valise=-10, bras=12, ja=(-3, 0), jv=(3, 0)),
        p.image(bob=1, penche=6, valise=-5, bras=6),
        p.image(penche=2, valise=-1),
    ]
    return [('repos', repos, 8), ('marche', course, 10), ('attaque', attaque, 10), ('touche', touche, 8)]


def anime_perdu(p):
    # repos : il se gratte la tête, le regard en l'air
    repos = [p.image(main=m, bob=b) for m, b in [((0, 0), 0), ((-1, 1), 0), ((1, 0), 1), ((0, 1), 0)]]
    # marche : un pas hésitant, la valise suit
    marche = []
    for i in range(6):
        u = i / 6
        (av, lv), (ar, lr) = pas(u, 5.0, 5.0), pas(u + 0.5, 5.0, 5.0)
        s = math.sin(2 * math.pi * u)
        marche.append(p.image(bob=round(2 * abs(math.cos(2 * math.pi * u))), main=(round(s), 0), valise=3 * s, ja=(ar, lr), jv=(av, lv)))
    # attaque : il demande son chemin, avec insistance (il se penche, se gratte de plus belle)
    attaque = [
        p.image(bob=1, penche=2, main=(-1, 1)),
        p.image(penche=-4, main=(1, -1), jv=(3, 0), valise=3),
        p.image(penche=-6, main=(-1, 0), jv=(4, 0), valise=5),
        p.image(penche=-2, main=(1, 1), jv=(1, 0), valise=2),
    ]
    touche = [
        p.image(bob=2, penche=11, main=(-2, 3), valise=-8, ja=(-3, 0), jv=(3, 0)),
        p.image(bob=1, penche=6, main=(-1, 2), valise=-4),
        p.image(penche=2, main=(0, 1)),
    ]
    return [('repos', repos, 6), ('marche', marche, 8), ('attaque', attaque, 10), ('touche', touche, 8)]


def main():
    ecrit_planche('presse', anime_presse(Presse()))
    ecrit_planche('perdu', anime_perdu(Perdu()))


if __name__ == '__main__':
    main()
