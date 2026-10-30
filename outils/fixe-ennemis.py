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
import json
import math
import pathlib
import re
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from marche import marche_jambes
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
    # le Champion du FISE (boss) : le pro du BMX en deux fois plus grand, en attendant son propre sprite (roule, puis figure)
    'champion': ('CHAMPION', 40),
    # la danseuse de breaking du FISE (ennemi) : la b-girl ; le b-boy est sa seconde apparence
    'breaker': ('BREAKER', 21),
    # le mouton de Limerick : deux images de la marche (les pattes avant, puis arrière), une animation lente
    'mouton': ('MOUTON', 13, 12),
    # le Viet Cong glaireux (pont des Tuves) : une apparence, les pieds dans la boue sous les figuiers
    'glaireux': ('GLAIREUX', 20),
    # l'habitué du pub de Limerick (voir ANIMES) : 3e valeur, durée d'une image de la marche
    'habitue': ('HABITUE', 20, 8),
    # le pilier du Munster (Limerick) : deux apparences, le maillot rouge et le maillot vert ; chaque ennemi tire la sienne
    # selon son identifiant (une répartition égale)
    'pilier': ('PILIER', 22),
}

# les lignes de la planche par état d'animation (ANIM dans jeu/vue.ts) : le vol au repos (0), le piqué en attaque (10).
# Une planche à lignes : chaque apparence va dans sa ligne, les autres lignes restent vides.
ETATS = {'goeland': (0, 10), 'bmxpro': (0, 10), 'champion': (0, 10)}

# les types dont la marche est tirée de la pose au repos (1er fichier : au repos, ligne 0 ; 2e : l'alerte, la recherche et l'attaque,
# lignes 7, 8 et 10) : les jambes
# se décalent (voir marche.py), quatre images dans la ligne de la course (1)
ANIMES = {'habitue'}

# les types animés dans Depix (piascwal/pix-pixelart, mode Animation, export « Pour le jeu ») : pour chaque apparence n,
# <type>-<n>-anim.png (une ligne par animation) et <type>-<n>-anim.json (taille des images, nom et nombre d'images de chaque ligne).
# Le projet Depix (<type>-<n>-projet.json, à rouvrir dans Depix) garde le découpage et les poses pour les retoucher.
# Chaque animation va dans la ligne de son état (ANIM dans jeu/vue.ts) ; les apparences sont côte à côte, un bloc de colonnes chacune.
DEPIX = {'pilier', 'fetard'}
LIGNES_DEPIX = {'repos': 0, 'marche': 1, 'touche': 9, 'attaque': 10}
# les apparences dessinées vers la gauche : le jeu suppose un sprite tourné vers la droite (il le retourne quand l'ennemi va à
# gauche), elles sont donc retournées ici
MIROIRS = {('fetard', 1), ('fetard', 4)}
# une image dure 6 ticks (10 par seconde) : une animation plus lente (le repos, 4 par seconde) répète ses images
IMAGES_PAR_SECONDE = 10


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


def planche_animee(fichiers, hauteur):
    """[repos, attaque, 4 images de marche] à la même découpe (leur union) : les pieds ne sautent pas d'une image à l'autre."""
    repos, attaque = (natif_et_case(f)[0] for f in fichiers[:2])
    toutes = [repos, attaque, *marche_jambes(repos)]
    ys, xs = np.nonzero(np.any([n[..., 3] > 0 for n in toutes], axis=0))
    boite = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    return [agrandi(n[boite], hauteur) for n in toutes]


def pose_animee(images, largeur, h):
    """La planche à lignes : le repos (0), la marche (1, quatre images), la pinte levée dès l'alerte (7), la recherche (8) et à l'attaque (10)."""
    lignes = {0: images[:1], 1: images[2:], 7: images[1:2], 8: images[1:2], 10: images[1:2]}
    planche = Image.new('RGBA', (largeur * 4, h * 11), (0, 0, 0, 0))
    for ligne, ims in lignes.items():
        for i, im in enumerate(ims):
            planche.alpha_composite(im, (i * largeur, ligne * h))
    return planche, [len(lignes.get(k, [])) for k in range(11)]


def planche_depix(type_, hauteur):
    """La planche à lignes et à apparences d'un type animé dans Depix : (planche, largeur, hauteur, comptes, pied, nb d'apparences).

    L'échelle vient de la pose de repos (sa silhouette fait `hauteur` pixels) ; toutes les images de toutes les apparences se
    calent sur les pieds de cette pose (en bas de la case, au même `pied`) : le personnage ne flotte ni ne glisse.
    """
    blocs = []
    for n in range(1, 10):
        png, js = SRC / f'{type_}-{n}-anim.png', SRC / f'{type_}-{n}-anim.json'
        if not png.exists():
            break
        meta = json.loads(js.read_text())
        a = np.array(Image.open(png).convert('RGBA'))
        fw, fh = meta['frameWidth'], meta['frameHeight']
        miroir = (type_, n) in MIROIRS
        case = lambda ligne, col, m=miroir: (lambda c: c[:, ::-1] if m else c)(
            a[ligne * fh : (ligne + 1) * fh, col * fw : (col + 1) * fw]
        )
        lignes = {}
        for anim in meta['animations']:
            if anim['name'] not in LIGNES_DEPIX:
                continue
            rep = max(1, round(IMAGES_PAR_SECONDE / anim.get('fps', IMAGES_PAR_SECONDE)))
            ims = [case(anim['row'], k) for k in range(anim['frames']) for _ in range(rep)]
            lignes[LIGNES_DEPIX[anim['name']]] = ims
        repos = lignes[0][0]
        ys, xs = np.nonzero(repos[..., 3])
        k = hauteur / (ys.max() - ys.min() + 1)
        bas, milieu = ys.max() + 1, (xs.min() + xs.max() + 1) / 2
        blocs.append((lignes, k, bas, milieu, fw, fh))
    # la case commune : assez large des deux côtés du pied, assez haute au-dessus des pieds
    gauche = max(math.ceil(m * k) for _, k, _, m, _, _ in blocs)
    droite = max(math.ceil((fw - m) * k) for _, k, _, m, fw, _ in blocs)
    haut = max(math.ceil(b * k) for _, k, b, _, _, _ in blocs)
    w, h = gauche + droite, haut
    colonnes = max(len(ims) for lignes, *_ in blocs for ims in lignes.values())
    planche = Image.new('RGBA', (w * colonnes * len(blocs), h * (max(LIGNES_DEPIX.values()) + 1)), (0, 0, 0, 0))
    for b, (lignes, k, bas, milieu, fw, fh) in enumerate(blocs):
        for ligne, ims in lignes.items():
            for c, im in enumerate(ims):
                # sous les pieds de la pose de repos : coupé (le sol)
                petit = agrandi(im[:bas], round(bas * k))
                x = (b * colonnes + c) * w + gauche - round(milieu * k)
                planche.alpha_composite(petit, (max(0, x), ligne * h + h - petit.height))
    comptes = [len(blocs[0][0].get(k, [])) for k in range(max(LIGNES_DEPIX.values()) + 1)]
    return planche, w, h, comptes, gauche, len(blocs)


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
        if type_ in DEPIX:
            planche, largeur, h, compte, pied, nb = planche_depix(type_, hauteur * DENSITE)
            nom = f'{type_}s.png'
            planche.save(SORTIE / nom)
            print(f'{nom} : {nb} apparence(s) animée(s) dans Depix, {largeur} x {h} px, lignes {compte}')
            lignes.append(
                f"  [G.{genre}]: {{ fichier: '{nom}', w: {largeur}, h: {h}, images: [{', '.join(map(str, compte))}], apparences: {nb}, pied: {pied}, densite: {DENSITE} }},"
            )
            continue
        fichiers = apparences(type_)
        if not fichiers:
            continue
        animee = type_ in ANIMES
        images = (
            planche_animee(fichiers, hauteur * DENSITE)
            if animee
            else [agrandi(natif(f), hauteur * DENSITE) for f in fichiers]
        )
        largeur = max(im.width for im in images)
        h = max(im.height for im in images)
        nom = f'{type_}s.png'
        if animee:
            planche, compte = pose_animee(images, largeur, h)
        elif type_ in ETATS:
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
