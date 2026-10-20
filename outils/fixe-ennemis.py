#!/usr/bin/env python3
"""Planches fixes (sans animation) des ennemis, une planche par type d'ennemi avec toutes ses apparences.

Usage : python3 outils/fixe-ennemis.py      (Pillow et numpy requis)

Entrées : assets-sources/ennemis/<type>-<n>-base.png, n = 1, 2, 3... (une apparence par fichier)
Sorties : public/sprites/<type>s.png (une image par apparence, côte à côte)
          src/rendu/feuilles-ennemis.ts (généré : déclare les planches au jeu)

Pour une animation (drone), les fichiers sont les images successives.

Pour ajouter une apparence : déposer `<type>-<n suivant>-base.png` dans assets-sources/ennemis/ et relancer
ce script. Le jeu en choisit une selon l'identifiant de l'ennemi (voir `variantes` dans feuilles.ts).

Chaque sprite est remis sur sa grille de pixels, recadré sur sa silhouette, agrandi à la hauteur voulue sans
lissage (6 pixels de canvas par pixel du jeu : `densite`), puis centré dans une image de largeur commune, les pieds
en bas. Aucun pixel n'est redessiné.
"""
import pathlib
import re
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'ennemis'
SORTIE = RACINE / 'public' / 'sprites'
TS = RACINE / 'src' / 'rendu' / 'feuilles-ennemis.ts'

# pixels de planche par pixel du jeu (le canvas est dessiné à cette densité : voir DENSITE_RENDU)
DENSITE = 6

# type d'ennemi : (genre dans jeu/vue.ts, hauteur en jeu en pixels ; un héros fait 20 px)
TYPES = {
    'fetard': ('FETARD', 20),
    'videur': ('VIDEUR', 23),
    'influenceur': ('INFLUENCEUR', 20),
    'yeti': ('YETI', 25),
    'danseur': ('DANSEUR', 20),
    'lanceur': ('LANCEUR', 20),
    # une animation : les fichiers sont les images successives (le drone-boule à facettes clignote), 3e valeur : durée d'une image
    'drone': ('DRONE', 22, 8),
    # la bigoudène (arc breton) : cornemuse, harpe, harpe 2 ; une apparence par ennemi, tirée au sort selon son identifiant
    'bigouden': ('BIGOUDEN', 24),
    # le marin (arc breton) : accordéon, clarinette ; une apparence par ennemi, tirée au sort selon son identifiant
    'marin': ('MARIN', 22),
    # le goéland (arc breton) : deux apparences, le vol et le piqué ; chacune va dans la ligne de son état (voir ETATS)
    'goeland': ('GOELAND', 18, 8),
    # les riders du FISE : le skateur, le roller, la trottinette, le gamin en BMX ; et le pro du BMX, qui roule (1) puis part
    # en figure (2) dès qu'il quitte le sol (la ligne de l'attaque, voir ETATS)
    'skateur': ('SKATEUR', 22),
    'roller': ('ROLLER', 22),
    'trottinette': ('TROTTINETTE', 22),
    'bmx': ('BMX', 21),
    'bmxpro': ('BMX_PRO', 21),
}

# les lignes de la planche par état d'animation (ANIM dans jeu/vue.ts) : le vol au repos (0), le piqué en attaque (10).
# Une planche à lignes : chaque apparence va dans sa ligne, les autres lignes restent vides.
ETATS = {'goeland': (0, 10), 'bmxpro': (0, 10)}


def natif(chemin):
    """Le sprite remis sur sa grille réelle (cases de 2, 5, 8... px selon le fichier), recadré sur sa silhouette."""
    nat, _ = natif_et_case(chemin)
    ys, xs = np.nonzero(nat[..., 3])
    return nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def agrandi(a, hauteur):
    """Agrandit au plus proche voisin pour que le sprite fasse `hauteur` pixels de canvas : aucun détail perdu."""
    h, w = a.shape[:2]
    nh, nw = hauteur, round(w * hauteur / h)
    ys = np.minimum((np.arange(nh) * h / nh).astype(int), h - 1)
    xs = np.minimum((np.arange(nw) * h / nh).astype(int), w - 1)
    return Image.fromarray(a[np.ix_(ys, xs)])


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
    for type_, (genre, hauteur, *anim) in TYPES.items():
        fichiers = apparences(type_)
        if not fichiers:
            continue
        images = []
        for f in fichiers:
            nat = natif(f)
            images.append(agrandi(nat, hauteur * DENSITE))
        largeur = max(im.width for im in images)
        h = max(im.height for im in images)
        nom = f'{type_}s.png'
        if type_ in ETATS:
            # une ligne par état : images[k] va dans la ligne ETATS[type_][k], la planche a autant de lignes que l'état le plus haut
            rangees = [1 if k in ETATS[type_] else 0 for k in range(max(ETATS[type_]) + 1)]
            planche = Image.new('RGBA', (largeur, h * len(rangees)), (0, 0, 0, 0))
            for im, ligne in zip(images, ETATS[type_]):
                planche.alpha_composite(im, ((largeur - im.width) // 2, ligne * h + h - im.height))
            compte = rangees
        else:
            planche = Image.new('RGBA', (largeur * len(images), h), (0, 0, 0, 0))
            for i, im in enumerate(images):
                # centré dans sa case, les pieds en bas
                planche.alpha_composite(im, (i * largeur + (largeur - im.width) // 2, h - im.height))
            compte = [len(images)]
        planche.save(SORTIE / nom)
        print(f'{nom} : {len(images)} apparence(s), {largeur} x {h} px chacune (silhouettes : {[im.width for im in images]})')
        mode = f'rythme: {anim[0]}' if anim else 'variantes: true'
        lignes.append(
            f"  [G.{genre}]: {{ fichier: '{nom}', w: {largeur}, h: {h}, images: [{', '.join(map(str, compte))}], {mode}, densite: {DENSITE} }},"
        )
    TS.write_text(
        "// Fichier généré par outils/fixe-ennemis.py : ne pas modifier à la main.\n"
        "import { G, type Genre } from '../jeu/vue';\n"
        "import type { Feuille } from './feuilles';\n\n"
        "export const FEUILLES_ENNEMIS: Partial<Record<Genre, Feuille>> = {\n" + '\n'.join(lignes) + '\n};\n'
    )


if __name__ == '__main__':
    main()
