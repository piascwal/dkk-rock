#!/usr/bin/env python3
"""Fabrique les planches de sprites des héros à partir de leur sprite de référence.

Usage : python3 outils/anime-heros.py [jbt|jbm|tom ...]     (Pillow et numpy requis)
Entrées : assets-sources/heros/<nom>-base.png     Sorties : public/sprites/<nom>.png + aperçus.

Aucun pixel n'est redessiné : le sprite est découpé en membres (voir gabarits.py, squelette.py), qui
tournent autour de leurs articulations ; puis tout est réduit à la taille du jeu en gardant la palette.
Les lignes de la planche suivent ANIM (jeu/vue.ts) : 0 repos, 1 course, 2 saut, 3 échelle,
4 tyrolienne, 5 mur, 6 mort, 10 tir.
"""
import json
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import numpy as np
from PIL import Image

from gabarits import GABARITS
from squelette import Personnage

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'heros'
SORTIE = RACINE / 'public' / 'sprites'
HAUTEUR_JEU = 28  # hauteur d'un héros debout, en pixels du jeu (tuile = 16)
TAILLE = 128

# angle de repos des jambes dans le sprite de référence (degrés, + = pied vers l'arrière)
def cos(d):
    return math.cos(math.radians(d))


def sin(d):
    return math.sin(math.radians(d))


def lignes_de_poses(g):
    """Les poses de chaque ligne de la planche : liste d'angles par membre (relatifs à la référence)."""
    base_ar, base_av = g.repos['cuisse_arriere'], g.repos['cuisse_avant']  # angles absolus de la référence
    poses = {}

    def jambes(abs_ar, abs_av, genou_ar=0.0, genou_av=0.0):
        return {'cuisse_arriere': abs_ar - base_ar, 'cuisse_avant': abs_av - base_av,
                'tibia_arriere': genou_ar, 'tibia_avant': genou_av}

    # repos : debout, jambes à la verticale ; les bras balancent à peine
    poses[0] = [dict(jambes(0, 0), bras_arriere=-b, bras_avant=b) for b in (0, 3, 6, 3)]
    # course : 6 images ; une jambe en appui, l'autre balancée vers l'avant avec le genou plié
    course = []
    for phi in range(0, 360, 60):
        psi_av = phi + 180
        pose = jambes(g.foulee * cos(phi), g.foulee * cos(psi_av),
                      g.genou * max(0.0, sin(phi)), g.genou * max(0.0, sin(psi_av)))
        pose['bras_arriere'] = -g.bras * cos(phi)
        pose['bras_avant'] = g.bras * cos(phi)
        course.append(pose)
    poses[1] = course
    # saut : jambe arrière pliée, jambe avant levée, bras balancés
    poses[2] = [dict(jambes(12, -38, 55, 50), bras_avant=-40, bras_arriere=30)]
    # échelle : on grimpe, genou levé à tour de rôle, bras en l'air
    poses[3] = [
        dict(jambes(-25, 0, 50, 0), bras_avant=-75, bras_arriere=-45),
        dict(jambes(0, -25, 0, 50), bras_avant=-45, bras_arriere=-75),
    ]
    # tyrolienne : suspendu, les bras vers le câble
    poses[4] = [dict(jambes(4, -4, 8, 8), bras_avant=-100, bras_arriere=-80)]
    # mur : collé au mur
    poses[5] = [dict(jambes(10, -30, 45, 30), bras_avant=-60, bras_arriere=15)]
    # mort : à la renverse (rotation du corps entier, faite à l'assemblage)
    poses[6] = [dict(jambes(15, -25, 30, 20), bras_avant=-30, bras_arriere=-40)]
    # tir : bras avant tendu ; deux images (recul)
    poses[10] = [dict(jambes(0, 0), bras_avant=-48), dict(jambes(0, 0), bras_avant=-40, bras_arriere=6)]
    return poses


def au_sol(im, base):
    """Cale l'image pour que le point le plus bas touche `base` (le pied d'appui reste au sol)."""
    a = np.array(im)
    ys = np.where(a[..., 3].any(1))[0]
    res = Image.new('RGBA', im.size, (0, 0, 0, 0))
    res.alpha_composite(im, (0, base - int(ys.max())))
    return res


def ferme_trous(im):
    """Bouche les trous d'un pixel aux articulations avec la couleur du voisin le plus proche."""
    a = np.array(im)
    al = a[..., 3] > 0
    pad = np.pad(al, 1)
    droite, gauche = pad[1:-1, 2:], pad[1:-1, :-2]
    haut, bas = pad[:-2, 1:-1], pad[2:, 1:-1]
    trou = (~al) & ((droite & gauche) | (haut & bas))
    for y, x in zip(*np.nonzero(trou)):
        for dy, dx in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            if 0 <= y + dy < a.shape[0] and 0 <= x + dx < a.shape[1] and a[y + dy, x + dx, 3]:
                a[y, x] = a[y + dy, x + dx]
                break
    return Image.fromarray(a)


def recentre(im, ancre):
    """Décale horizontalement l'image pour que le milieu du personnage soit sur `ancre`."""
    b = im.getbbox()
    res = Image.new('RGBA', im.size, (0, 0, 0, 0))
    res.alpha_composite(im, (ancre - (b[0] + b[2]) // 2, 0))
    return res


def renverse(im, angle):
    """Fait tomber le personnage autour de ses pieds (rotation sans lissage)."""
    k = 8
    grand = im.resize((im.width * k, im.height * k), Image.NEAREST)
    from squelette import vote
    r = grand.rotate(-angle, resample=Image.NEAREST, center=(64 * k, 120 * k))
    return Image.fromarray(vote(np.array(r)))


def reduit(im, echelle):
    """Réduit en gardant la palette : chaque case prend la couleur la plus fréquente de sa zone source
    (le calcul de moyenne crée des pixels parasites sur les aplats ; le vote garde contours et aplats nets)."""
    nl, nh = round(im.width * echelle), round(im.height * echelle)
    a = np.array(im)
    res = np.zeros((nh, nl, 4), np.uint8)
    xs, ys = np.linspace(0, im.width, nl + 1), np.linspace(0, im.height, nh + 1)
    for j in range(nh):
        for i in range(nl):
            y0, x0 = int(ys[j]), int(xs[i])
            blk = a[y0:max(y0 + 1, int(ys[j + 1])), x0:max(x0 + 1, int(xs[i + 1]))].reshape(-1, 4)
            pleins = blk[blk[:, 3] > 0]
            if len(pleins) * 2 < len(blk):
                continue
            couleurs, nb = np.unique(pleins, axis=0, return_counts=True)
            res[j, i] = couleurs[nb.argmax()]
    return Image.fromarray(res)


def fabrique(nom):
    g = GABARITS[nom]
    brut = np.array(Image.open(SRC / f'{nom}-base.png').convert('RGBA'))
    nat = Image.fromarray(brut[4::8, 4::8])
    palette = np.unique(np.array(nat).reshape(-1, 4), axis=0)
    palette = palette[palette[:, 3] > 0][:, :3]
    perso = Personnage(nat, g.membres)
    base = int(np.where(np.array(nat)[..., 3].any(1))[0].max())

    lignes = {}
    for ligne, poses in lignes_de_poses(g).items():
        frames = []
        for p in poses:
            f = ferme_trous(perso.pose(p))
            if ligne == 6:
                f = recentre(renverse(f, -80), g.ancre_x)
            frames.append(au_sol(f, base))
        lignes[ligne] = frames

    # cadre commun : boîte englobante de toutes les images, centrée sur la ligne médiane du personnage
    boite = None
    for fr in lignes.values():
        for f in fr:
            b = f.getbbox()
            boite = b if boite is None else (min(boite[0], b[0]), min(boite[1], b[1]), max(boite[2], b[2]), max(boite[3], b[3]))
    ancre = g.ancre_x
    demi = max(ancre - boite[0], boite[2] - ancre)
    cadre = (ancre - demi, boite[1], ancre + demi, base + 1)
    ref = Image.fromarray(np.array(nat)).getbbox()
    echelle = HAUTEUR_JEU / (ref[3] - ref[1])
    finales = {k: [reduit(f.crop(cadre), echelle) for f in v] for k, v in lignes.items()}
    w, h = finales[0][0].size
    images = [len(finales.get(i, [])) for i in range(max(finales) + 1)]
    planche = Image.new('RGBA', (w * max(images), h * len(images)), (0, 0, 0, 0))
    for i, fr in finales.items():
        for j, f in enumerate(fr):
            planche.alpha_composite(f, (j * w, i * h))
    SORTIE.mkdir(parents=True, exist_ok=True)
    planche.save(SORTIE / f'{nom}.png')
    for suffixe, d, z in (('natif', {k: [f.crop(cadre) for f in v] for k, v in lignes.items()}, 3), ('jeu', finales, 8)):
        fw, fh = d[0][0].size
        n = max(len(v) for v in d.values())
        ap = Image.new('RGBA', (fw * n, fh * len(d)), (255, 0, 255, 255))
        for r, (k, v) in enumerate(sorted(d.items())):
            for j, f in enumerate(v):
                ap.alpha_composite(f, (j * fw, r * fh))
        ap.resize((ap.width * z, ap.height * z), Image.NEAREST).save(SRC / f'apercu-{nom}-{suffixe}.png')
    meta = {'fichier': f'{nom}.png', 'w': w, 'h': h, 'images': images, 'rythme': 5,
            'pieds_x': (ancre - cadre[0]) * echelle, 'hauteur_debout': HAUTEUR_JEU}
    print(nom, json.dumps(meta))


# cadre du portrait (tête et épaules) dans le sprite natif de 128 px
PORTRAITS = {'tom': (60, 0, 104, 44), 'jbt': (54, 0, 98, 44), 'jbm': (46, 0, 90, 44)}


def portrait(nom):
    """Le portrait des dialogues et du choix du héros : tête et épaules du sprite, en pleine définition."""
    brut = np.array(Image.open(SRC / f'{nom}-base.png').convert('RGBA'))
    Image.fromarray(brut[4::8, 4::8]).crop(PORTRAITS[nom]).save(RACINE / 'public' / 'portraits' / f'{nom}.png')


if __name__ == '__main__':
    (RACINE / 'public' / 'portraits').mkdir(parents=True, exist_ok=True)
    for n in sys.argv[1:] or list(GABARITS):
        fabrique(n)
        portrait(n)
