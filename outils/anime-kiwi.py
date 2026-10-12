#!/usr/bin/env python3
"""Fabrique la planche de sprites de Fadatchi (le kiwi) à partir de trois poses de référence.

Usage : python3 outils/anime-kiwi.py        (Pillow et numpy requis)
Entrées : assets-sources/fadatchi/*.png     Sortie : public/sprites/fadatchi.png (+ aperçus dans assets-sources/fadatchi/)

Aucun pixel n'est redessiné : tout vient des poses. On les remet sur la grille native, on les recale
sur un repère commun, on découpe la tête au cou pour le coup de bec (rotation façon RotSprite :
agrandir ×8, tourner sans lissage, rééchantillonner), puis on retourne vers la droite et on réduit.
"""
import json
import pathlib
import sys

import numpy as np
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'fadatchi'
SORTIE = RACINE / 'public' / 'sprites'

# repère commun (coordonnées de la pose A) : x de -2 à 66, y de -8 à 54
X0, Y0, LARGEUR, HAUTEUR = -2, -8, 68, 64
DECALAGE = {'A': (0, 0), 'B': (0, -6), 'C': (-1, -7)}  # recalage des torses, mesuré par corrélation
LARGEUR_JEU = 27  # largeur du kiwi en jeu, en pixels : il arrive aux genoux d'un héros de 40 px
PIVOT_COU = (24, 13)
TETE = [(-2, -8), (27, -8), (27, 13), (22, 18), (16, 18.5), (15, 19), (15, 34), (-2, 34)]
# la base du cou reste en place sous la tête qui pivote
COU = (21, 9, 27, 19)
PIEDS_X = 45  # milieu des pieds dans la pose A : le sprite est centré dessus


def natif_grande(chemin):
    a = np.array(Image.open(chemin).convert('RGBA'))
    return a[4::8, 4::8]


def natif_petite(chemin, fond_blanc, palette):
    a = np.array(Image.open(chemin).convert('RGBA')).astype(int)
    b = a.reshape(64, 2, 64, 2, 4).transpose(0, 2, 1, 3, 4).reshape(64, 64, 4, 4)
    med = np.median(b, axis=2).astype(int)
    opaque = med[..., 3] > 128
    if fond_blanc:
        opaque &= np.abs(med[..., :3] - 255).sum(2) > 120
    dist = ((med[..., None, :3] - palette[None, None].astype(int)) ** 2).sum(3)
    sortie = np.zeros((64, 64, 4), np.uint8)
    sortie[..., :3] = palette[dist.argmin(2)]
    sortie[..., 3] = np.where(opaque, 255, 0)
    pad = np.pad(opaque, 1)
    voisins = sum(
        np.roll(np.roll(pad, dy, 0), dx, 1)[1:-1, 1:-1].astype(int)
        for dy in (-1, 0, 1)
        for dx in (-1, 0, 1)
        if (dy, dx) != (0, 0)
    )
    sortie[opaque & (voisins < 2)] = 0
    return sortie


def contour_sombre(im, palette):
    """Le flou des petites images laisse un liseré clair autour du corps : on le repasse au contour sombre.
    Seul le corps est concerné (ni le bec, ni les pattes)."""
    sombre = palette[np.argmin(palette.sum(1))]
    a = im.copy()
    al = a[..., 3] > 0
    pad = np.pad(al, 1)
    bord = al & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    for y, x in zip(*np.where(bord)):
        px, py = x + 0.5 - 0, y + 0.5
        # repère de la pose native 64×64 : le bec est à gauche (x < 18), les griffes en bas (y >= 38)
        if px >= 18 and py < 38 and a[y, x, :3].sum() > 3 * 60:
            a[y, x, :3] = sombre
    return a


def poser(im, cle):
    toile = Image.new('RGBA', (LARGEUR, HAUTEUR), (0, 0, 0, 0))
    toile.alpha_composite(Image.fromarray(im), (DECALAGE[cle][0] - X0, DECALAGE[cle][1] - Y0))
    return toile


def en_polygone(x, y):
    """Le point (x, y) est-il dans la tête ? (lancer de rayon)"""
    dedans = False
    n = len(TETE)
    for i in range(n):
        (x1, y1), (x2, y2) = TETE[i], TETE[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            dedans = not dedans
    return dedans


def decoupe(pose):
    """(corps sans la tête, tête seule) ; la base du cou reste dans le corps."""
    a = np.array(pose)
    tete = np.zeros_like(a)
    corps = a.copy()
    for yy in range(HAUTEUR):
        for xx in range(LARGEUR):
            x, y = xx + X0 + 0.5, yy + Y0 + 0.5
            if a[yy, xx, 3] and en_polygone(x, y):
                tete[yy, xx] = a[yy, xx]
                if not (COU[0] <= x <= COU[2] and COU[1] <= y <= COU[3]):
                    corps[yy, xx] = 0
    return Image.fromarray(corps), Image.fromarray(tete)


def tourne(im, angle_deg, pivot, decalage):
    """Rotation sans lissage autour du pivot (coordonnées du repère), puis décalage entier."""
    k = 8
    grand = im.resize((im.width * k, im.height * k), Image.NEAREST)
    centre = ((pivot[0] - X0) * k, (pivot[1] - Y0) * k)
    # PIL tourne dans le sens inverse des aiguilles ; notre angle positif lève le bec
    tourne_ = grand.rotate(angle_deg, resample=Image.NEAREST, center=centre)
    sortie = Image.fromarray(vote_par_case(np.array(tourne_), k))
    dx, dy = decalage
    res = Image.new('RGBA', sortie.size, (0, 0, 0, 0))
    res.alpha_composite(sortie, (dx, dy))
    return res


def vote_par_case(a, k):
    """Réduit par cases k×k : opaque dès 1/4 de pixels pleins, couleur la plus fréquente.
    Le simple échantillon du centre casse les lignes d'un pixel (le bec) ; le vote les garde."""
    h, w = a.shape[0] // k, a.shape[1] // k
    cases = a.reshape(h, k, w, k, 4).transpose(0, 2, 1, 3, 4).reshape(h, w, k * k, 4)
    sortie = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        for x in range(w):
            px = cases[y, x]
            pleins = px[px[:, 3] > 0]
            if len(pleins) * 4 < k * k:
                continue
            couleurs, nb = np.unique(pleins, axis=0, return_counts=True)
            sortie[y, x] = couleurs[nb.argmax()]
    return sortie


def decale(im, dx, dy):
    res = Image.new('RGBA', im.size, (0, 0, 0, 0))
    res.alpha_composite(im, (dx, dy))
    return res


def assemble(corps, tete, angle, dec):
    f = corps.copy()
    f.alpha_composite(tourne(tete, angle, PIVOT_COU, dec))
    return f


def nettoie(im):
    """Retire les pixels isolés et bouche les trous d'un pixel."""
    a = np.array(im)
    al = a[..., 3] > 0
    pad = np.pad(al, 1)
    n = sum(
        np.roll(np.roll(pad, dy, 0), dx, 1)[1:-1, 1:-1].astype(int)
        for dy in (-1, 0, 1)
        for dx in (-1, 0, 1)
        if (dy, dx) != (0, 0)
    )
    a[al & (n < 2)] = 0
    trou = (~al) & (n >= 7)
    for y, x in zip(*np.where(trou)):
        voisins = [a[y + dy, x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy, dx) != (0, 0) and a[y + dy, x + dx, 3]]
        if voisins:
            a[y, x] = voisins[0]
    return Image.fromarray(a)


def reduit(im, palette, largeur_cible, cadre):
    """Retourne vers la droite, centre sur les pieds, réduit en gardant la palette."""
    x_pieds = LARGEUR - 1 - (PIEDS_X - X0)  # position des pieds après le retournement
    demi = max(x_pieds, LARGEUR - x_pieds)
    toile = Image.new('RGBA', (demi * 2, im.height), (0, 0, 0, 0))
    toile.alpha_composite(im.transpose(Image.FLIP_LEFT_RIGHT), (demi - x_pieds, 0))
    echelle = largeur_cible / (cadre[0])
    nl, nh = round(toile.width * echelle), round(toile.height * echelle)
    # chaque case prend la couleur la plus fréquente de sa zone (la moyenne crée des pixels parasites)
    a = np.array(toile)
    res = np.zeros((nh, nl, 4), np.uint8)
    xs, ys = np.linspace(0, toile.width, nl + 1), np.linspace(0, toile.height, nh + 1)
    for j in range(nh):
        for i in range(nl):
            y0, x0 = int(ys[j]), int(xs[i])
            blk = a[y0 : max(y0 + 1, int(ys[j + 1])), x0 : max(x0 + 1, int(xs[i + 1]))].reshape(-1, 4)
            pleins = blk[blk[:, 3] > 0]
            if len(pleins) * 2 < len(blk):
                continue
            couleurs, nb = np.unique(pleins, axis=0, return_counts=True)
            res[j, i] = couleurs[nb.argmax()]
    return Image.fromarray(res)


def main():
    A = natif_grande(SRC / 'pose-a-ecartee.png')
    palette = np.unique(A.reshape(-1, 4), axis=0)
    palette = palette[palette[:, 3] > 0][:, :3]
    B = natif_petite(SRC / 'pose-b-pieds-joints.png', True, palette)
    C = natif_petite(SRC / 'pose-c-patte-levee.png', False, palette)
    B, C = contour_sombre(B, palette), contour_sombre(C, palette)
    pa, pb, pc = poser(A, 'A'), poser(B, 'B'), poser(C, 'C')
    corps_a, tete_a = decoupe(pa)
    corps_b, tete_b = decoupe(pb)
    corps_c, tete_c = decoupe(pc)

    def a_(angle=0, dec=(0, 0)):
        return assemble(corps_a, tete_a, angle, dec)

    # lignes de la planche : la ligne n sert à l'animation n (voir docs/ASSETS.md)
    lignes = {
        0: [a_(), a_(), a_(), a_(), a_(-5, (-1, 1)), a_(-5, (-1, 1)), a_(), a_()],  # debout : il respire
        1: [  # court : pose écartée, pieds joints (le corps se soulève), patte levée, pieds joints
            a_(),
            decale(assemble(corps_b, tete_b, 0, (0, 0)), 0, -3),
            decale(assemble(corps_c, tete_c, -4, (-1, 0)), 0, -2),
            decale(assemble(corps_b, tete_b, 0, (0, 0)), 0, -3),
        ],
        2: [decale(assemble(corps_c, tete_c, 6, (1, -1)), 0, -3)],  # saut : patte levée, bec haut
        10: [a_(14, (2, -1)), a_(-28, (-3, 2)), a_(-36, (-4, 3)), a_(-8, (-1, 0))],  # coup de bec
    }
    lignes = {k: [nettoie(f) for f in v] for k, v in lignes.items()}

    # cadre commun : boîte englobante de toutes les frames
    toutes = [f for v in lignes.values() for f in v]
    boite = None
    for f in toutes:
        b = f.getbbox()
        boite = b if boite is None else (min(boite[0], b[0]), min(boite[1], b[1]), max(boite[2], b[2]), max(boite[3], b[3]))
    haut, bas = boite[1], boite[3]
    rogne = lambda f: f.crop((0, haut, LARGEUR, bas))
    largeur_source = max(LARGEUR - 1 - (PIEDS_X - X0), PIEDS_X - X0) * 2  # largeur après centrage sur les pieds
    finales = {k: [reduit(rogne(f), palette, LARGEUR_JEU * 1.0, (63,)) for f in v] for k, v in lignes.items()}
    w, h = finales[0][0].size
    print('frame', w, 'x', h, '(sources', largeur_source, ')')
    images = [len(finales.get(i, [])) for i in range(max(finales) + 1)]
    planche = Image.new('RGBA', (w * max(images), h * len(images)), (0, 0, 0, 0))
    for i, fr in finales.items():
        for j, f in enumerate(fr):
            planche.alpha_composite(f, (j * w, i * h))
    SORTIE.mkdir(parents=True, exist_ok=True)
    planche.save(SORTIE / 'fadatchi.png')
    # aperçus : version native (×1) et agrandie, fond magenta
    for nom, d in (('apercu-natif', lignes), ('apercu-jeu', finales)):
        n = max(len(v) for v in d.values())
        fw, fh = d[0][0].size
        ap = Image.new('RGBA', (fw * n, fh * len(d)), (255, 0, 255, 255))
        for r, (k, v) in enumerate(sorted(d.items())):
            for j, f in enumerate(v):
                ap.alpha_composite(f, (j * fw, r * fh))
        z = 4 if nom == 'apercu-natif' else 8
        ap.resize((ap.width * z, ap.height * z), Image.NEAREST).save(SRC / f'{nom}.png')
    meta = {'fichier': 'fadatchi.png', 'w': w, 'h': h, 'images': images, 'rythme': 5}
    print(json.dumps(meta))


if __name__ == '__main__':
    sys.exit(main())
