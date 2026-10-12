#!/usr/bin/env python3
"""Planches fixes (sans animation) des ennemis, une planche par type d'ennemi avec toutes ses apparences.

Usage : python3 outils/fixe-ennemis.py      (Pillow et numpy requis)

Entrées : assets-sources/ennemis/<type>-<n>-base.png, n = 1, 2, 3... (une apparence par fichier)
Sorties : public/sprites/<type>s.png (une image par apparence, côte à côte)
          src/rendu/feuilles-ennemis.ts (généré : déclare les planches au jeu)

Pour ajouter une apparence : déposer `<type>-<n suivant>-base.png` dans assets-sources/ennemis/ et relancer
ce script. Le jeu en choisit une selon l'identifiant de l'ennemi (voir `variantes` dans feuilles.ts).

Chaque sprite est remis sur sa grille de pixels, recadré sur sa silhouette, réduit à la hauteur voulue en
gardant la palette (vote majoritaire par case, comme pour les héros), puis centré dans une image de largeur
commune, les pieds en bas. Aucun pixel n'est redessiné.
"""
import pathlib
import re

import numpy as np
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'ennemis'
SORTIE = RACINE / 'public' / 'sprites'
TS = RACINE / 'src' / 'rendu' / 'feuilles-ennemis.ts'

# type d'ennemi : (genre dans jeu/vue.ts, hauteur en jeu en pixels ; un héros fait 40 px)
TYPES = {
    'fetard': ('FETARD', 40),
    'videur': ('VIDEUR', 46),
    'influenceur': ('INFLUENCEUR', 40),
    'yeti': ('YETI', 50),
    'danseur': ('DANSEUR', 40),
    'lanceur': ('LANCEUR', 40),
}


def natif(chemin):
    brut = np.array(Image.open(chemin).convert('RGBA'))
    nat = brut[4::8, 4::8]
    ys, xs = np.nonzero(nat[..., 3])
    return nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def reduit(a, echelle):
    """Réduit par cases : une case est opaque si la moitié de ses pixels l'est, couleur la plus fréquente."""
    h, w = a.shape[:2]
    nh, nw = round(h * echelle), round(w * echelle)
    ys, xs = np.linspace(0, h, nh + 1), np.linspace(0, w, nw + 1)
    res = np.zeros((nh, nw, 4), np.uint8)
    for j in range(nh):
        for i in range(nw):
            y0, x0 = int(ys[j]), int(xs[i])
            blk = a[y0 : max(y0 + 1, int(ys[j + 1])), x0 : max(x0 + 1, int(xs[i + 1]))].reshape(-1, 4)
            pleins = blk[blk[:, 3] > 0]
            if len(pleins) * 2 < len(blk):
                continue
            couleurs, nb = np.unique(pleins, axis=0, return_counts=True)
            res[j, i] = couleurs[nb.argmax()]
    return Image.fromarray(res)


def apparences(type_):
    """Les fichiers <type>-<n>-base.png, dans l'ordre de n."""
    trouves = []
    for f in SRC.glob(f'{type_}-*-base.png'):
        m = re.fullmatch(rf'{type_}-(\d+)-base\.png', f.name)
        if m:
            trouves.append((int(m.group(1)), f))
    return [f for _, f in sorted(trouves)]


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    lignes = []
    for type_, (genre, hauteur) in TYPES.items():
        fichiers = apparences(type_)
        if not fichiers:
            continue
        images = []
        for f in fichiers:
            nat = natif(f)
            images.append(reduit(nat, hauteur / nat.shape[0]))
        largeur = max(im.width for im in images)
        h = max(im.height for im in images)
        planche = Image.new('RGBA', (largeur * len(images), h), (0, 0, 0, 0))
        for i, im in enumerate(images):
            # centré dans sa case, les pieds en bas
            planche.alpha_composite(im, (i * largeur + (largeur - im.width) // 2, h - im.height))
        nom = f'{type_}s.png'
        planche.save(SORTIE / nom)
        print(f'{nom} : {len(images)} apparence(s), {largeur} x {h} px chacune (silhouettes : {[im.width for im in images]})')
        lignes.append(
            f"  [G.{genre}]: {{ fichier: '{nom}', w: {largeur}, h: {h}, images: [{len(images)}], variantes: true }},"
        )
    TS.write_text(
        "// Fichier généré par outils/fixe-ennemis.py : ne pas modifier à la main.\n"
        "import { G, type Genre } from '../jeu/vue';\n"
        "import type { Feuille } from './feuilles';\n\n"
        "export const FEUILLES_ENNEMIS: Partial<Record<Genre, Feuille>> = {\n" + '\n'.join(lignes) + '\n};\n'
    )


if __name__ == '__main__':
    main()
