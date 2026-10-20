#!/usr/bin/env python3
"""Les éléments du FISE qui portent ses logos officiels (assets-sources/decor/fise/logo-fise-*.png), composés ici :

- `barriere-base.png` : une barrière Vauban, sa bâche blanche, le logo noir au milieu ;
- `arche-base.png` : l'arche d'entrée, deux pylônes de treillis noir et la bannière noire, le logo en couleur au milieu ;
- `public/sprites/logo-fise.png` : le logo en couleur, en grand, pour la carte d'intro du niveau.

Usage : python3 outils/fise-logos.py, puis python3 outils/fixe-objets.py (qui en fait les planches du jeu).
"""
import pathlib

from PIL import Image, ImageDraw

RACINE = pathlib.Path(__file__).resolve().parent.parent
FISE = RACINE / 'assets-sources' / 'decor' / 'fise'


def logo(nom, hauteur):
    im = Image.open(FISE / f'logo-fise-{nom}.png').convert('RGBA')
    im = im.crop(im.getbbox())
    return im.resize((round(im.width * hauteur / im.height), hauteur), Image.LANCZOS)


def barriere():
    w, h = 264, 132
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    tube = (150, 158, 166, 255)
    d.rectangle([6, 4, w - 7, 11], fill=tube)  # la lisse du haut
    d.rectangle([6, h - 28, w - 7, h - 22], fill=tube)  # celle du bas
    for x in (6, w - 14):
        d.rectangle([x, 4, x + 7, h - 1], fill=tube)  # les montants, jusqu'aux pieds
    d.rectangle([0, h - 6, 30, h - 1], fill=tube)
    d.rectangle([w - 31, h - 6, w - 1, h - 1], fill=tube)
    d.rectangle([16, 14, w - 17, h - 32], fill=(246, 246, 242, 255), outline=(200, 200, 196, 255), width=2)  # la bâche
    l = logo('noir', 80)
    im.alpha_composite(l, ((w - l.width) // 2, 16))
    return im


def arche():
    w, h = 600, 360
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    noir, blanc = (28, 28, 32, 255), (210, 210, 214, 255)
    for x0 in (0, w - 56):  # les deux pylônes de treillis
        d.rectangle([x0, 90, x0 + 55, h - 1], fill=noir)
        for y in range(96, h - 10, 44):
            d.line([x0 + 6, y, x0 + 49, y + 40], fill=blanc, width=3)
            d.line([x0 + 49, y, x0 + 6, y + 40], fill=blanc, width=3)
    d.rectangle([0, 0, w - 1, 120], fill=noir)  # la bannière
    d.rectangle([0, 0, w - 1, 9], fill=(232, 96, 122, 255))
    d.rectangle([0, 111, w - 1, 120], fill=(232, 96, 122, 255))
    l = logo('couleur', 104)
    im.alpha_composite(l, ((w - l.width) // 2, 8))
    return im


def portique_break():
    """Le portique de la scène de breaking : l'arche du festival, la même charpente, avec une bannière « BREAK » à la place du logo."""
    from PIL import ImageFont

    im = arche()
    d = ImageDraw.Draw(im)
    d.rectangle([0, 8, 599, 111], fill=(28, 28, 32, 255))  # on efface le logo de la bannière
    police = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 74)
    texte = 'BREAK'
    x0, y0, x1, y1 = d.textbbox((0, 0), texte, font=police)
    d.text(((600 - (x1 - x0)) // 2 - x0, (120 - (y1 - y0)) // 2 - y0), texte, font=police, fill=(255, 210, 63, 255))
    return im


def main():
    barriere().save(FISE / 'barriere-base.png')
    arche().save(FISE / 'arche-base.png')
    portique_break().save(FISE / 'portique-break-base.png')
    l = logo('couleur', 256)
    l.save(RACINE / 'public' / 'sprites' / 'logo-fise.png')
    print('barriere-base.png, arche-base.png, public/sprites/logo-fise.png')


if __name__ == '__main__':
    main()
