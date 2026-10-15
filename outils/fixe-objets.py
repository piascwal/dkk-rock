#!/usr/bin/env python3
"""Planches des objets fournis en sprite (van, cage, boss, décor), une image par état, sans animation.

Usage : python3 outils/fixe-objets.py      (Pillow et numpy requis)

Entrées : assets-sources/<objet>-base.png     Sorties : public/sprites/<objet>.png + src/rendu/feuilles-objets.ts (généré)
Le sprite est remis sur sa grille de pixels (prepare_instrument.py), recadré sur sa silhouette et agrandi sans lissage à la
largeur voulue en jeu (6 pixels de planche par pixel du jeu).
"""
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

RACINE = pathlib.Path(__file__).resolve().parent.parent
DENSITE = 6
# objet : (fichiers sources, un par état (une ligne de la planche chacun), genre dans jeu/vue.ts, largeur en jeu en pixels)
OBJETS = {
    'van': (['van-base.png'], 'VAN', 56),
    'cage': (['cage-1-base.png', 'cage-2-base.png'], 'CAGE', 22),  # fermée, puis ouverte
    # le Yéti Alpha : repos, bras levés (deux), touché (trois) ; les poses gardent leur place (cadre commun)
    'yeti-alpha': ([f'boss/yeti-alpha-{k}-base.png' for k in range(1, 7)], 'YETI_ALPHA', 46, True),
    # les enceintes du DJ, de face : membrane au repos, puis de plus en plus gonflée
    'enceinte': ([f'boss/enceinte-{k}-base.png' for k in range(1, 5)], 'ENCEINTE', 22, True),
    # décor sans genre (FEUILLES_DECOR) : enceintes de 3/4, grise puis en bois, posées au fond
    # les vaches du décor (apparences tirées au sort ; même échelle pour toutes : les assises sont plus grandes) et le lampadaire
    'vache': ([f'decor/vache-{k}-base.png' for k in range(1, 7)], None, 19),
    # la végétation du décor : trois buissons (rond, à baies, à mûres), trois sapins (vert, givré, enneigé), même échelle
    'buisson': ([f'decor/buisson-{k}-base.png' for k in range(1, 4)], None, 22),
    'sapin': ([f'decor/sapin-{k}-base.png' for k in range(1, 4)], None, 34),
    'lampadaire': (['decor/lampadaire-base.png'], None, 15),
    # lot 7 : panneaux de bois (jamais retournés : on doit pouvoir lire l'inscription), voitures, bûches, plantes en pot
    # (cactus, pousse, retombante, grosse jardinière), feu de camp et poubelles (verte, kaki)
    'panneau': ([f'decor/panneau-{k}-base.png' for k in (1, 2, 3, 4)], None, 20),
    'voiture': ([f'decor/voiture-{k}-base.png' for k in (1, 2, 3)], None, 30),
    'tronc': ([f'decor/tronc-{k}-base.png' for k in (1, 2)], None, 19),
    'plante': ([f'decor/plante-{k}-base.png' for k in (1, 2, 3, 4)], None, 9),
    'feu': (['decor/feu-1-base.png'], None, 14),
    'poubelle': ([f'decor/poubelle-{k}-base.png' for k in (1, 2)], None, 11),
    # le tonneau de décor, sans pancarte (les tonneaux WOG sont des tuiles : outils/fixe-tuiles.py)
    'tonneau': (['decor/tonneau-base.png'], None, 13),
    # clôtures (neuve, simple, envahie de lierre), boîtes aux lettres (ronde, carrée), palmiers (penché, droit, courbé) et
    # arbres (rond vert clair, chêne sombre) : même échelle pour toutes les apparences d'un objet
    'cloture': ([f'decor/cloture-{k}-base.png' for k in (1, 2, 3)], None, 26),
    'boite': ([f'decor/boite-{k}-base.png' for k in (1, 2)], None, 11),
    'palmier': ([f'decor/palmier-{k}-base.png' for k in (1, 2, 3)], None, 34),
    'arbre': ([f'decor/arbre-{k}-base.png' for k in (1, 2)], None, 34),
    'enceinte-34': ([f'decor/enceinte-34-{k}-base.png' for k in (1, 2)], None, 26, True),
}


def agrandit(chemin, largeur):
    """Le sprite remis sur sa grille, recadré, agrandi sans lissage à `largeur` px de planche."""
    nat, case = natif_et_case(chemin)
    ys, xs = np.nonzero(nat[..., 3])
    return nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1], case


def cadre_commun(chemins):
    """Toutes les images recadrées sur la même boîte (l'union de leurs silhouettes) : d'une pose à l'autre, le
    personnage ne glisse pas."""
    nats = [natif_et_case(c)[0] for c in chemins]
    h = min(n.shape[0] for n in nats)
    w = min(n.shape[1] for n in nats)
    nats = [n[:h, :w] for n in nats]
    plein = np.zeros((h, w), bool)
    for n in nats:
        plein |= n[..., 3] > 0
    ys, xs = np.nonzero(plein)
    return [(n[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1], 0) for n in nats]


def main():
    lignes, decors = [], []
    for nom, (sources, genre, largeur, *commun) in OBJETS.items():
        if commun:
            etats = cadre_commun([RACINE / 'assets-sources' / s for s in sources])
        else:
            etats = [agrandit(RACINE / 'assets-sources' / s, largeur) for s in sources]
        # tous les états ont la même échelle (celle du premier) pour que l'objet ne change pas de taille en s'ouvrant
        premier = etats[0][0]
        w0 = np.ptp(np.nonzero(premier[..., 3].any(0))[0]) + 1  # la largeur du personnage, pas celle du cadre commun
        echelle = largeur * DENSITE / w0
        images = []
        for nat, _ in etats:
            h, w = nat.shape[:2]
            nw, nh = round(w * echelle), round(h * echelle)
            yy = np.minimum((np.arange(nh) / echelle).astype(int), h - 1)
            xx = np.minimum((np.arange(nw) / echelle).astype(int), w - 1)
            images.append(Image.fromarray(nat[np.ix_(yy, xx)]))
        cw, ch = max(i.width for i in images), max(i.height for i in images)
        planche = Image.new('RGBA', (cw, ch * len(images)), (0, 0, 0, 0))
        for k, im in enumerate(images):  # centré, posé en bas de sa case
            planche.alpha_composite(im, ((cw - im.width) // 2, k * ch + ch - im.height))
        planche.save(RACINE / 'public' / 'sprites' / f'{nom}.png')
        print(f'{nom}.png : {len(images)} état(s), {cw}x{ch} px de planche, {cw / DENSITE:.0f}x{ch / DENSITE:.0f} en jeu')
        ligne = ', '.join(['1'] * len(images))
        cle = f'[G.{genre}]' if genre else f"'{nom}'"
        (lignes if genre else decors).append(
            f"  {cle}: {{ fichier: '{nom}.png', w: {cw}, h: {ch}, images: [{ligne}], rythme: 1, densite: {DENSITE}, pied: {cw // 2} }},"
        )
    (RACINE / 'src' / 'rendu' / 'feuilles-objets.ts').write_text(
        "// Fichier généré par outils/fixe-objets.py : ne pas modifier à la main.\n"
        "import { G, type Genre } from '../jeu/vue';\n"
        "import type { Feuille } from './feuilles';\n\n"
        "export const FEUILLES_OBJETS: Partial<Record<Genre, Feuille>> = {\n" + '\n'.join(lignes) + '\n};\n\n'
        "/** Les planches du décor, sans genre : une ligne par apparence. */\n"
        "export const FEUILLES_DECOR: Record<string, Feuille> = {\n" + '\n'.join(decors) + '\n};\n'
    )


if __name__ == '__main__':
    main()
