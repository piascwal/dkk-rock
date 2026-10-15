#!/usr/bin/env python3
"""Le chauffage soufflant (compagnon qui remplace Fadatchi quand on ramasse l'arme) : son sprite de base est remis sur sa
grille de pixels, puis déformé (écrasé à l'atterrissage, étiré en l'air, secoué quand il souffle) pour faire la planche.

Usage : python3 outils/fixe-chauffage.py      (Pillow et numpy requis)

Entrée : assets-sources/chauffage/chauffage-base.png     Sortie : public/sprites/chauffage.png (déclarée dans
src/rendu/feuilles-objets.ts). Le script affiche aussi les valeurs à reporter dans src/entites/chauffage.ts (BOUCHE).

Lignes de la planche (numéro = ANIM) : 0 debout (1 image), 1 court (4), 2 saut (1), 10 attaque (2) ; les autres sont vides.
Un pixel du sprite d'origine = K pixels de la planche (la planche est dessinée à 6 par pixel du jeu, puis réduite de moitié :
le chauffage fait ~22 pixels de haut dans le jeu).
"""
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

RACINE = pathlib.Path(__file__).resolve().parent.parent
K = 3
MARGE = 1.18
# le centre du cercle, au milieu de la grille noire (rangées 38 à 78 du sprite recadré ; face avant à droite), en pixels d'origine
CERCLE = (38, 59)

# (largeur, hauteur) relatives, décalage horizontal en pixels d'origine
POSES = {
    0: [(1.0, 1.0, 0)],
    1: [(1.05, 0.93, 0), (1.0, 1.0, 0), (1.02, 0.97, 0), (1.0, 1.0, 0)],
    2: [(0.95, 1.07, 0)],
    10: [(1.0, 1.0, -1), (1.0, 0.97, 1)],
}
LIGNES = 11


def deforme(nat, sx, sy):
    h, w = nat.shape[:2]
    nw, nh = max(1, round(w * sx)), max(1, round(h * sy))
    yy = np.minimum((np.arange(nh) / sy).astype(int), h - 1)
    xx = np.minimum((np.arange(nw) / sx).astype(int), w - 1)
    return nat[np.ix_(yy, xx)]


def main():
    nat, case = natif_et_case(RACINE / 'assets-sources' / 'chauffage' / 'chauffage-base.png')
    ys, xs = np.nonzero(nat[..., 3])
    x0, y0 = xs.min(), ys.min()
    nat = nat[y0 : ys.max() + 1, x0 : xs.max() + 1]
    h, w = nat.shape[:2]
    fw, fh = round(w * K * MARGE), round(h * K * MARGE)
    colonnes = max(len(p) for p in POSES.values())
    planche = Image.new('RGBA', (fw * colonnes, fh * LIGNES), (0, 0, 0, 0))
    for ligne, poses in POSES.items():
        for col, (sx, sy, dx) in enumerate(poses):
            img = Image.fromarray(deforme(nat, sx, sy))
            img = img.resize((img.width * K, img.height * K), Image.NEAREST)
            planche.alpha_composite(img, (col * fw + (fw - img.width) // 2 + dx * K, ligne * fh + fh - img.height))
    sortie = RACINE / 'public' / 'sprites' / 'chauffage.png'
    planche.save(sortie)
    # la bouche : le centre du cercle, relatif au milieu des pieds, en pixels du jeu (1 pixel d'origine = K / 6 * 0.5 pixel du jeu)
    cx, cy = CERCLE
    jeu = K / 6 * 0.5
    print(f'chauffage.png : cases {fw}x{fh}, {colonnes} colonnes x {LIGNES} lignes ; sprite {w}x{h} pixels d’origine (case {case:.2f})')
    print(f'feuille : w {fw}, h {fh}, images [1, 4, 1, 0, 0, 0, 0, 0, 0, 0, 2], densite 6, echelle 0.5')
    print(f'taille dans le jeu : {w * jeu:.1f} x {h * jeu:.1f} px ; BOUCHE : x {(cx - w / 2) * jeu:.1f} (vers l’avant), y {(h - cy) * jeu:.1f} (au-dessus des pieds)')


if __name__ == '__main__':
    main()
