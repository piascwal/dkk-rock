#!/usr/bin/env python3
"""Les éléments du FISE qui portent ses logos officiels (assets-sources/decor/fise/logo-fise-*.png), composés ici :

- `barriere-base.png` : une barrière Vauban, sa bâche blanche, le logo noir au milieu ;
- `arche-base.png` : l'arche d'entrée, deux pylônes de treillis noir et la bannière noire, le logo en couleur au milieu ;
- `portique-{break,flat,dance}-base.png` : la même charpente, la bannière portant le nom de la zone (BREAK, FLAT, DANCE) ;
- `jury-base.png` : la table du jury du breakdance, trois juges et leur panneau de notes ;
- `public/sprites/logo-fise.png` : le logo en couleur, en grand, pour la carte d'intro du niveau.

Usage : python3 outils/fise-logos.py, puis python3 outils/fixe-objets.py (qui en fait les planches du jeu).
"""
import pathlib

from PIL import Image, ImageDraw, ImageFont

RACINE = pathlib.Path(__file__).resolve().parent.parent
FISE = RACINE / 'assets-sources' / 'decor' / 'fise'
POLICE = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


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


def portique(texte):
    """Un portique de scène : l'arche du festival, la même charpente, avec une bannière `texte` à la place du logo."""
    im = arche()
    d = ImageDraw.Draw(im)
    d.rectangle([0, 8, 599, 111], fill=(28, 28, 32, 255))  # on efface le logo de la bannière
    police = ImageFont.truetype(POLICE, 74)
    x0, y0, x1, y1 = d.textbbox((0, 0), texte, font=police)
    d.text(((600 - (x1 - x0)) // 2 - x0, (120 - (y1 - y0)) // 2 - y0), texte, font=police, fill=(255, 210, 63, 255))
    return im


def jury():
    """Le jury du breakdance : une table bleue, trois juges assis derrière, et leur panneau de notes."""
    w, h = 256, 150
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    bois, bleu, peau = (120, 74, 40, 255), (47, 111, 208, 255), (222, 176, 134, 255)
    for x in (28, 108, 188):
        d.ellipse([x, 52, x + 40, 92], fill=(60, 60, 70, 255))  # le buste
        d.ellipse([x + 8, 16, x + 32, 48], fill=peau)  # la tête
        d.chord([x + 6, 10, x + 34, 34], 180, 360, fill=(30, 22, 18, 255))  # les cheveux
    d.rectangle([14, 92, 242, 112], fill=bleu)  # le plateau de la table
    d.rectangle([14, 112, 242, 116], fill=(30, 40, 70, 255))
    for x in (20, 226):
        d.rectangle([x, 116, x + 8, h - 1], fill=bois)  # les pieds
    d.rectangle([84, 4, 172, 14], fill=(20, 20, 26, 255))  # le panneau de notes
    police = ImageFont.truetype(POLICE, 9)
    for i, note in enumerate(('9.5', '9.8', '9.2')):
        d.rectangle([88 + i * 28, 16, 110 + i * 28, 30], fill=(255, 255, 255, 255))
        d.text((90 + i * 28, 18), note, font=police, fill=(20, 20, 26, 255))
    return im


def main():
    barriere().save(FISE / 'barriere-base.png')
    arche().save(FISE / 'arche-base.png')
    portique('BREAK').save(FISE / 'portique-break-base.png')
    portique('FLAT').save(FISE / 'portique-flat-base.png')
    portique('DANCE').save(FISE / 'portique-dance-base.png')
    jury().save(FISE / 'jury-base.png')
    logo('couleur', 256).save(RACINE / 'public' / 'sprites' / 'logo-fise.png')
    print('barriere, arche, portiques (break, flat, dance), jury, logo-fise.png')


if __name__ == '__main__':
    main()
