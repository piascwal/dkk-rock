#!/usr/bin/env python3
"""Planche d'un héros avec son instrument, à partir du sprite de référence qui le tient (assets-sources/heros/).

Usage : python3 outils/anime-instrument.py [tom|jbm|mat|jbt|jbg ...]     (Pillow et numpy requis)
Sortie : public/sprites/<nom>-instrument.png + aperçu ; la méta (taille, lignes, pied) est affichée.

Le sprite est remis sur sa grille (prepare_instrument.py). L'instrument et les bras qui le tiennent forment une
seule pièce qui pivote pour viser ; les jambes bougent comme pour les autres héros (gabarits_instrument.py). Lignes de la
planche : celles de ANIM (0 repos, 1 course, 2 saut, 3 échelle, 4 tyrolienne, 5 mur, 6 mort, 10 tir), puis les
lignes 11 à 14 : course en visant en diagonale haut, haut, diagonale bas, bas (code de visée 1 à 4).
"""
import json
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import numpy as np
from PIL import Image

import squelette

squelette.K = 4
from squelette import Personnage, vote
from gabarits_instrument import HEROS
from prepare_instrument import espace_de_travail

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'heros'
SORTIE = RACINE / 'public' / 'sprites'
DENSITE = 6  # pixels de planche par pixel du jeu : un héros fait ~39 px de haut en jeu


def cos(d):
    return math.cos(math.radians(d))


def sin(d):
    return math.sin(math.radians(d))


def jambes(av=0, ar=0, tav=0, tar=0):
    return {'cuisse_avant': av, 'cuisse_arriere': ar, 'tibia_avant': tav, 'tibia_arriere': tar}


def course(arme=0):
    poses = []
    for phi in range(0, 360, 60):
        psi = phi + 180
        p = jambes(20 * cos(phi), 20 * cos(psi), 38 * max(0, sin(phi)), 38 * max(0, sin(psi)))
        p['arme'] = arme
        poses.append(p)
    return poses


def poses(visees):
    return {
        0: [dict(jambes(), arme=a) for a in (0, -1.5, -2.5, -1.5)],
        1: course(),
        2: [dict(jambes(-30, 18, 50, 45), arme=-3)],
        3: [dict(jambes(-25, 0, 50, 0)), dict(jambes(0, -25, 0, 50))],
        4: [dict(jambes(3, -3, 8, 8), arme=-6)],
        5: [dict(jambes(-25, 12, 45, 35), arme=-4)],
        6: [dict(jambes(-20, 15, 30, 25), arme=-10)],
        10: [dict(jambes(), arme=-2), dict(jambes(), arme=-5)],
        **{10 + k: course(a) for k, a in visees.items()},
    }


def au_sol(im, base):
    a = np.array(im)
    ys = np.where(a[..., 3].any(1))[0]
    res = Image.new('RGBA', im.size, (0, 0, 0, 0))
    res.alpha_composite(im, (0, base - int(ys.max())))
    return res


def nettoie(im, mini=40):
    """Retire les îlots de moins de `mini` pixels (miettes des découpes) et bouche les trous d'un pixel."""
    a = np.array(im)
    al = a[..., 3] > 0
    pr = np.pad(al, 1)
    voisins = sum(pr[1 + dy : 1 + dy + al.shape[0], 1 + dx : 1 + dx + al.shape[1]]
                  for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy, dx) != (0, 0))
    a[al & (voisins < 2)] = 0  # points isolés et bouts de fil
    al = a[..., 3] > 0
    vu = np.zeros_like(al)
    for y0, x0 in zip(*np.nonzero(al)):
        if vu[y0, x0]:
            continue
        pile, comp = [(y0, x0)], []
        vu[y0, x0] = True
        while pile:
            y, x = pile.pop()
            comp.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < al.shape[0] and 0 <= xx < al.shape[1] and al[yy, xx] and not vu[yy, xx]:
                        vu[yy, xx] = True
                        pile.append((yy, xx))
        if len(comp) < mini:
            for y, x in comp:
                a[y, x] = 0
    return Image.fromarray(a)


REDUCTION = 2  # un pixel de planche vaut 2×2 pixels de travail (vote majoritaire) : un héros fait 20 px de haut en jeu
MARGE = 130  # place autour du personnage pour qu'il puisse tomber sans sortir de l'image


def renverse(im, angle, centre):
    """Fait basculer l'image (déjà élargie de MARGE de chaque côté) autour de `centre`, sans lissage."""
    k = 4
    grand = im.resize((im.width * k, im.height * k), Image.NEAREST)
    r = grand.rotate(-angle, resample=Image.NEAREST, center=(centre[0] * k, centre[1] * k))
    return Image.fromarray(vote(np.array(r)))


def fabrique(nom):
    membres, corps, source, ancre, visees = HEROS[nom]
    brut = espace_de_travail(nom)
    perso = Personnage(Image.fromarray(brut), membres, corps, source)
    base = int(np.where(brut[..., 3].any(1))[0].max())
    lignes = {}
    for ligne, ps in poses(visees).items():
        fr = []
        for p in ps:
            f = perso.pose(p)
            large = Image.new('RGBA', (f.width + 2 * MARGE, f.height), (0, 0, 0, 0))
            large.alpha_composite(f, (MARGE, 0))
            f = large
            if ligne == 6:
                f = renverse(f, -80, (ancre + MARGE, base - 100))
            fr.append(nettoie(au_sol(f, base)))
        lignes[ligne] = fr
    boite = None
    for fr in lignes.values():
        for f in fr:
            b = f.getbbox()
            boite = b if boite is None else (min(boite[0], b[0]), min(boite[1], b[1]), max(boite[2], b[2]), max(boite[3], b[3]))
    x0, y0 = boite[0] - (boite[0] % 2), boite[1] - (boite[1] % 2)
    x1, y1 = boite[2] + (boite[2] % 2), base + 1 + ((base + 1) % 2)
    cadre = (x0, y0, x1, y1)
    lignes = {k: [Image.fromarray(vote(np.array(f.crop(cadre)), REDUCTION)) for f in v] for k, v in lignes.items()}
    w, h = lignes[0][0].size
    images = [len(lignes.get(i, [])) for i in range(max(lignes) + 1)]
    planche = Image.new('RGBA', (w * max(images), h * len(images)), (0, 0, 0, 0))
    for i, fr in lignes.items():
        for j, f in enumerate(fr):
            planche.alpha_composite(f, (j * w, i * h))
    planche.save(SORTIE / f'{nom}-instrument.png')
    ap = Image.new('RGBA', planche.size, (255, 0, 255, 255))
    ap.alpha_composite(planche)
    ap.resize((ap.width // 2, ap.height // 2), Image.NEAREST).save(SRC / f'apercu-{nom}-instrument.png')
    meta = {'fichier': f'{nom}-instrument.png', 'w': w, 'h': h, 'pied': (ancre + MARGE - x0) // REDUCTION}
    (SRC / f'meta-{nom}.json').write_text(json.dumps(meta, indent=2) + '\n')
    print(nom, json.dumps(meta))


GENRES = {'jbt': 'JBT', 'jbm': 'JBM', 'jbg': 'JBG', 'mat': 'MAT', 'tom': 'TOM'}


def ecrit_ts():
    """Déclare les planches au jeu : src/rendu/feuilles-heros.ts, d'après les méta de chaque héros."""
    lignes = []
    for nom, genre in GENRES.items():
        f = SRC / f'meta-{nom}.json'
        if f.exists():
            m = json.loads(f.read_text())
            lignes.append(f"  [G.{genre}]: heros('{m['fichier']}', {m['w']}, {m['h']}, {m['pied']}),")
    (RACINE / 'src' / 'rendu' / 'feuilles-heros.ts').write_text(
        "// Fichier généré par outils/anime-instrument.py : ne pas modifier à la main.\n"
        "import { G, type Genre } from '../jeu/vue';\n"
        "import type { Feuille } from './feuilles';\n\n"
        "// repos 4, course 6, saut, échelle 2, tyrolienne, mur, mort, tir 2, puis la course en visant (codes 1 à 4)\n"
        "const ANIMATIONS_HEROS = [4, 6, 1, 2, 1, 1, 1, 0, 0, 0, 2, 6, 6, 6, 6];\n\n"
        "/** Un héros avec son instrument dans le sprite ; `pied` : milieu des pieds dans l'image. */\n"
        "const heros = (fichier: string, w: number, h: number, pied: number): Feuille => ({\n"
        "  fichier,\n  w,\n  h,\n  pied,\n  densite: 6,\n  visees: 11,\n  images: ANIMATIONS_HEROS,\n  rythme: 5,\n  cycle: 12,\n});\n\n"
        "export const FEUILLES_HEROS: Partial<Record<Genre, Feuille>> = {\n" + '\n'.join(lignes) + '\n};\n'
    )


if __name__ == '__main__':
    for n in sys.argv[1:] or list(HEROS):
        fabrique(n)
    ecrit_ts()
