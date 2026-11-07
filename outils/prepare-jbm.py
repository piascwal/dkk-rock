#!/usr/bin/env python3
"""JBM : ses bandes d'animation fournies (4 poses chacune, fond magenta) → les planches du jeu.

Usage : python3 outils/prepare-jbm.py        (Pillow, numpy et scipy requis)

Entrées : assets-sources/heros/jbm-source/ : repos.jpg, course.jpg, saut.jpg, echelle.jpg (de dos), mur.jpg (de profil, la paroi
          à droite), tyrolienne.jpg ; chacune une bande de 4 cases de même taille.
Sorties : public/sprites/jbm-instrument.png (la planche du héros : repos 4, course 4, saut 1, mort 1), jbm-saut.png,
          jbm-mur.png, jbm-echelle.png (2 temps), jbm-tyrolienne.png (2 temps), public/portraits/jbm.png,
          public/sprites/intro-heros.png (la silhouette de JBM remplacée). Les tailles s'affichent : à reporter dans
          src/rendu/feuilles-jbm.ts.

Les images d'une IA n'ont pas de vraie grille de pixels (elle varie de 2,6 à 3,3 pixels d'une image à l'autre) : chaque case est
réduite d'un tiers (moyenne de chaque bloc de 3 × 3, le grain de l'image), le fond retiré, le liseré violet passé au contour
sombre, puis la palette réduite (une centaine de couleurs : le poids baisse, le détail reste).

Poses écartées (incohérentes) : tyrolienne 1 et 4 (trois bras : deux poings au câble et une main au micro ; la 4 est debout),
échelle 1 (pas de micro) et 4 (deux micros). Saut : seule la pose du sommet sert (le jeu n'a qu'une image en l'air).
Course : les poses 1, 3 et 4 sont presque la même foulée (un pas qui glisse) : la course alterne foulée et passage (1, 2, 3, 2).
"""
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'heros' / 'jbm-source'
SPRITES = RACINE / 'public' / 'sprites'
CONTOUR = (28, 22, 30)
REDUCTION = 3
HAUTEUR_ANCIEN = 120  # JBM debout dans sa planche actuelle (densité 6)
BORD_MUR = 4.2  # contre la paroi : le pied à cette distance (pixels du jeu) du bord côté paroi (comme les autres héros)
COULEURS = 112


def cases(nom):
    """Les 4 poses d'une bande, chacune réduite et détourée (RGBA, recadrée)."""
    a = np.array(Image.open(SRC / nom).convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    fond = (r > 140) & (b > 120) & (g < 130) & ((r + b) / 2 - g > 90)
    etiquettes, n = ndimage.label(~fond)
    tailles = ndimage.sum(np.ones_like(etiquettes), etiquettes, range(1, n + 1))
    plein = np.isin(etiquettes, 1 + np.nonzero(tailles > 400)[0])
    plein = ndimage.binary_fill_holes(plein) & plein | ndimage.binary_opening(plein, iterations=1)
    l = a.shape[1] // 4
    sortie = []
    for k in range(4):
        c, m = a[:, k * l : (k + 1) * l], plein[:, k * l : (k + 1) * l].astype(float)
        h, w = (c.shape[0] // REDUCTION) * REDUCTION, (c.shape[1] // REDUCTION) * REDUCTION
        c, m = c[:h, :w], m[:h, :w]
        bloc = lambda x: x.reshape(h // REDUCTION, REDUCTION, w // REDUCTION, REDUCTION, *x.shape[2:]).mean((1, 3))
        poids = bloc(m)
        couleur = bloc(c * m[..., None]) / np.maximum(poids, 1e-6)[..., None]
        im = np.zeros(poids.shape + (4,), np.uint8)
        im[..., :3] = np.clip(couleur, 0, 255)
        im[..., 3] = np.where(poids >= 0.5, 255, 0)
        # le liseré violet laissé par le fond magenta, au bord de la silhouette : le contour sombre
        op = im[..., 3] > 0
        bord = op & ~ndimage.binary_erosion(op)
        rr, gg, bb = (im[..., i].astype(int) for i in range(3))
        violet = (rr - gg > 30) & (bb - gg > 30)
        im[(bord | violet) & op & violet, :3] = CONTOUR
        # les miettes isolées
        et, n2 = ndimage.label(op)
        if n2 > 1:
            t = ndimage.sum(np.ones_like(et), et, range(1, n2 + 1))
            im[~np.isin(et, 1 + np.nonzero(t >= 12)[0])] = 0
        pil = Image.fromarray(im)
        sortie.append(pil.crop(pil.getbbox()))
    return sortie


def milieu_torse(im):
    """L'abscisse du milieu du corps : la silhouette entre 35 et 60 % de sa hauteur (le torse, sans le bras tendu)."""
    al = np.array(im)[..., 3] > 0
    h = al.shape[0]
    xs = np.nonzero(al[int(h * 0.35) : int(h * 0.6)].any(0))[0]
    return (xs.min() + xs.max()) / 2


def planche(lignes, w, h, ancre):
    """Une planche : une ligne par liste de poses, chaque pose pieds en bas, son ancre (fonction de l'image) en `ancre`."""
    n = max(len(l) for l in lignes)
    p = Image.new('RGBA', (w * n, h * len(lignes)), (0, 0, 0, 0))
    for j, poses in enumerate(lignes):
        for i, im in enumerate(poses):
            x = round(ancre - ancre_de(im))
            p.alpha_composite(im, (i * w + max(0, min(w - im.width, x)), j * h + h - im.height))
    return p


ancre_de = milieu_torse


def enregistre(p, nom, dossier=SPRITES, couleurs=COULEURS):
    q = p.quantize(couleurs, method=Image.FASTOCTREE, dither=Image.NONE)
    q.save(dossier / f'{nom}.png', optimize=True)
    print(f'{nom}.png : {p.width} x {p.height}, {(dossier / f"{nom}.png").stat().st_size // 1024} Ko')


def main():
    global ancre_de
    repos, course, saut = cases('repos.jpg'), cases('course.jpg'), cases('saut.jpg')
    course = [course[0], course[1], course[2], course[1]]  # foulée, passage, foulée, passage
    echelle, mur, tyro = cases('echelle.jpg'), cases('mur.jpg'), cases('tyrolienne.jpg')
    debout = repos[0].height
    densite = 6 * debout / HAUTEUR_ANCIEN
    print(f'JBM debout : {debout} pixels, densité {densite:.2f}')
    # à terre : couché sur le dos, la tête en arrière (à gauche)
    mort = repos[0].rotate(90, expand=True)
    # la planche du héros : repos, course, saut (le sommet), puis (lignes vides) jusqu'à la mort
    corps = [*repos, *course, saut[2]]
    w = max(max(im.width for im in corps) + 24, mort.width + 4)
    h = max(im.height for im in corps + [mort])
    pied = w // 2
    # planche compacte : les lignes vides (échelle, tyrolienne, mur : images à part) ne sont pas dans le fichier
    lignes = [repos, course, [saut[2]], [mort]]
    p = planche(lignes, w, h, pied)
    enregistre(p, 'jbm-instrument')
    print(f'  héros : w {w}, h {h}, pied {pied}, images [4, 4, 1, 0, 0, 0, 1], compacte')
    # les images à part (une pose par ligne)
    for nom, poses in (('saut', [saut[2]]), ('echelle', [echelle[1], echelle[2]]), ('tyrolienne', [tyro[1], tyro[2]])):
        w2, h2 = max(im.width for im in poses) + 4, max(im.height for im in poses)
        ancre_de = (lambda im: im.width / 2) if nom != 'saut' else milieu_torse
        enregistre(planche([[im] for im in poses], w2, h2, w2 / 2), f'jbm-{nom}')
        print(f'  {nom} : w {w2}, h {h2}, pied {w2 // 2}, images {[1] * len(poses)}')
    # contre la paroi (à droite) : le bord droit de la silhouette touche le bord de l'image
    m = mur[0]
    ancre_de = lambda im: im.width
    enregistre(planche([[m]], m.width, m.height, m.width), 'jbm-mur')
    print(f'  mur : w {m.width}, h {m.height}, pied {round(m.width - BORD_MUR * densite)}')
    portrait(repos[0])
    intro(repos[0])


def portrait(im):
    """Le portrait des dialogues (44 × 44, comme les autres) : la tête et les épaules, ramenées à l'échelle des autres."""
    al = np.array(im)[..., 3] > 0
    haut = np.nonzero(al.any(1))[0].min()
    xs = np.nonzero(al[haut : haut + 18].any(0))[0]
    cx = (xs.min() + xs.max()) // 2
    cote = round(44 * im.height / HAUTEUR_ANCIEN)
    crop = im.crop((cx - cote // 2, haut - 1, cx + cote // 2, haut - 1 + cote)).resize((44, 44), Image.LANCZOS)
    enregistre(crop, 'jbm', RACINE / 'public' / 'portraits')


def intro(im):
    """Les silhouettes de l'intro (128 × 128 par héros) : celle de JBM (la deuxième) remplacée, à la hauteur des autres."""
    planche_ = Image.open(SPRITES / 'intro-heros.png').convert('RGBA')
    planche_.paste((0, 0, 0, 0), (128, 0, 256, 128))
    k = 121 / im.height
    j = im.resize((round(im.width * k), 121), Image.LANCZOS)
    planche_.alpha_composite(j, (128 + 64 - j.width // 2, 128 - j.height))
    enregistre(planche_, 'intro-heros', couleurs=256)  # les cinq silhouettes : la palette entière


if __name__ == '__main__':
    main()
