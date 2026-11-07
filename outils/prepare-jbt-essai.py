#!/usr/bin/env python3
"""JBT, à l'essai : ses images fournies (fond magenta) → les planches du jeu, comme pour JBM (outils/prepare-jbm.py).

Usage : python3 outils/prepare-jbt-essai.py        (Pillow, numpy et scipy requis)

Entrées : assets-sources/heros/jbt-essai/ : repos.jpg et course.jpg (bandes de 4 poses), saut.jpg, mur.jpg (de profil, la paroi
          à droite), echelle.jpg (de dos), tyrolienne.jpg (pendu d'une main) : des images seules, deux fois plus grandes.
Sorties : public/sprites/jbt-essai.png (repos 4, course 4, saut, à terre), jbt-essai-saut.png, jbt-essai-mur.png,
          jbt-essai-echelle.png (l'image de dos et son miroir : les deux temps de la montée), jbt-essai-tyrolienne.png,
          public/portraits/jbt-essai.png, public/sprites/intro-heros-essai.png (la silhouette de JBT remplacée). Les tailles
          s'affichent : à reporter dans src/rendu/essai-jbt.ts.
"""
import importlib.util
import pathlib

import numpy as np
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('prepare_jbm', RACINE / 'outils' / 'prepare-jbm.py')
pj = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pj)
pj.SRC = RACINE / 'assets-sources' / 'heros' / 'jbt-essai'
SPRITES = RACINE / 'public' / 'sprites'
HAUTEUR_ANCIEN = 118  # JBT debout dans sa planche actuelle (densité 6)
SEULE = 6  # les images seules sont deux fois plus grandes que les bandes : un bloc de 6 × 6 au lieu de 3 × 3


def seule(nom):
    return pj.cases(f'{nom}.jpg', 1, SEULE)[0]


def main():
    repos, course = pj.cases('repos.jpg'), pj.cases('course.jpg')
    saut, mur, echelle, tyro = seule('saut'), seule('mur'), seule('echelle'), seule('tyrolienne')
    densite = 6 * repos[0].height / HAUTEUR_ANCIEN
    print(f'JBT debout : {repos[0].height} pixels, densité {densite:.2f}')
    mort = repos[0].rotate(90, expand=True)
    corps = [*repos, *course, saut]
    w = max(max(im.width for im in corps) + 24, mort.width + 4)
    h = max(im.height for im in corps + [mort])
    pj.ancre_de = pj.milieu_torse
    pj.enregistre(pj.planche([repos, course, [saut], [mort]], w, h, w // 2), 'jbt-essai')
    print(f'  héros : w {w}, h {h}, pied {w // 2}, images [4, 4, 1, 0, 0, 0, 1], compacte')
    pj.enregistre(pj.planche([[saut]], saut.width + 4, saut.height, (saut.width + 4) / 2), 'jbt-essai-saut')
    print(f'  saut : w {saut.width + 4}, h {saut.height}, pied {(saut.width + 4) // 2}')
    # l'échelle : l'image de dos, puis son miroir (les bras et les jambes alternent)
    miroir = echelle.transpose(Image.FLIP_LEFT_RIGHT)
    pj.ancre_de = lambda im: im.width / 2
    pj.enregistre(pj.planche([[echelle], [miroir]], echelle.width, echelle.height, echelle.width / 2), 'jbt-essai-echelle')
    print(f'  echelle : w {echelle.width}, h {echelle.height}, pied {echelle.width // 2}, images [1, 1]')
    # la paroi à droite : le bord droit de la silhouette touche le bord de l'image
    pj.ancre_de = lambda im: im.width
    pj.enregistre(pj.planche([[mur]], mur.width, mur.height, mur.width), 'jbt-essai-mur')
    print(f'  mur : w {mur.width}, h {mur.height}, pied {round(mur.width - pj.BORD_MUR * densite)}')
    # pendu d'une main : le poing (le haut de l'image) au-dessus du milieu de l'entité
    al = np.array(tyro)[..., 3] > 0
    poing = float(np.nonzero(al[:12].any(0))[0].mean())
    pj.enregistre(tyro, 'jbt-essai-tyrolienne')
    print(f'  tyrolienne : w {tyro.width}, h {tyro.height}, pied {round(poing)}')
    portrait(repos[0])
    intro(repos[0])


def portrait(im):
    al = np.array(im)[..., 3] > 0
    haut = np.nonzero(al.any(1))[0].min()
    xs = np.nonzero(al[haut : haut + 18].any(0))[0]
    cx = (xs.min() + xs.max()) // 2
    cote = round(44 * im.height / HAUTEUR_ANCIEN)
    crop = im.crop((cx - cote // 2, haut - 1, cx + cote // 2, haut - 1 + cote)).resize((44, 44), Image.LANCZOS)
    pj.enregistre(crop, 'jbt-essai', RACINE / 'public' / 'portraits')


def intro(im):
    """Les silhouettes de l'intro, celle de JBT (la première) remplacée : un fichier à part, pour l'essai."""
    planche = Image.open(SPRITES / 'intro-heros.png').convert('RGBA')
    planche.paste((0, 0, 0, 0), (0, 0, 128, 128))
    k = 121 / im.height
    j = im.resize((round(im.width * k), 121), Image.LANCZOS)
    planche.alpha_composite(j, (64 - j.width // 2, 128 - j.height))
    pj.enregistre(planche, 'intro-heros-essai', couleurs=256)


if __name__ == '__main__':
    main()
