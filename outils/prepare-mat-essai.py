#!/usr/bin/env python3
"""Le nouveau Mat (mode essai) : ses images fournies → les planches du jeu, à côté de celles de l'ancien Mat.

Usage : python3 outils/prepare-mat-essai.py      (Pillow et numpy requis)

Entrées : assets-sources/heros/mat-essai/guitare/ (Mat avec sa guitare)
          repos.jpg, saut.jpg, mur.jpg (de profil contre la paroi), echelle-1.jpg et echelle-2.jpg (de dos, les deux temps de la
          montée) : sur fond magenta, à la même échelle ; marche.jpg : six images de marche côte à côte, sur fond magenta ;
          (marche-seule.jpg : une pose de marche de plus, inutilisée) ; les fonds magenta ne sont pas tous du même ton : tout ce qui
          en approche est retiré
          assets-sources/heros/mat-essai/corsa-dos.jpg, corsa-biais-droite.jpg : l'Opel Corsa du concours de drift (pré du Clos), Mat
          à bord, sur fond magenta
Sorties : public/sprites/mat-essai.png (la planche du héros, mêmes lignes que les autres : voir feuilles-heros.ts),
          mat-essai-saut.png, mat-essai-echelle.png (de dos, et son miroir : les deux temps de la montée), mat-essai-mur.png,
          drift-matt-essai-dos.png, drift-matt-essai-biais-droite.png, public/portraits/mat-essai.png,
          intro-heros-essai.png (les silhouettes de l'intro, celle de Mat remplacée) ; la méta s'affiche.

Chaque image est remise sur sa grille : chaque pixel de planche prend la couleur médiane de sa case dans l'image (un JPEG n'a
pas de grille nette), le liseré violet que laisse le fond magenta devient le contour sombre. Le personnage debout fait 120 pixels
de planche (20 pixels du jeu, à 6 pixels de planche par pixel du jeu), comme l'ancien Mat ; toutes les images sur fond magenta
sont à la même échelle que lui, la marche est ramenée à la même taille.
"""
import pathlib

import numpy as np
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'heros' / 'mat-essai'
GUITARE = SRC / 'guitare'
SPRITES = RACINE / 'public' / 'sprites'
CONTOUR = (28, 22, 30)
HAUTEUR = 120  # le personnage debout, en pixels de planche
CASE = 124  # la case de la planche du héros (carrée)


def masque_magenta(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ~((r > 140) & (b > 130) & (g < 120) & ((r + b) / 2 - g > 110))


def regrille(a, op, f):
    """L'image `a` (couleurs) et son masque `op`, réduite d'un facteur `f` : un pixel par case, sa couleur médiane."""
    ys, xs = np.nonzero(op)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    h, w = int(round((y1 - y0) / f)), int(round((x1 - x0) / f))
    nat = np.zeros((h, w, 4), np.uint8)
    for j in range(h):
        for i in range(w):
            ya, yb = int(y0 + j * f), max(int(y0 + j * f) + 1, int(y0 + (j + 1) * f))
            xa, xb = int(x0 + i * f), max(int(x0 + i * f) + 1, int(x0 + (i + 1) * f))
            m = op[ya:yb, xa:xb]
            if m.size and m.mean() >= 0.5:
                nat[j, i, :3] = np.median(a[ya:yb, xa:xb][m], axis=0)
                nat[j, i, 3] = 255
    rr, gg, bb = (nat[..., k].astype(int) for k in range(3))
    lisere = (nat[..., 3] > 0) & (rr - gg > 15) & (bb - gg > 15) & (abs(rr - bb) < 70)
    nat[lisere, :3] = CONTOUR
    return nat


def magenta(nom, f):
    a = np.array(Image.open(GUITARE / nom).convert('RGB')).astype(float)
    return regrille(a, masque_magenta(a), f)


# l'échelle commune des images sur fond magenta : celle où Mat debout fait HAUTEUR pixels
def facteur_magenta():
    a = np.array(Image.open(GUITARE / 'repos.jpg').convert('RGB')).astype(float)
    ys = np.nonzero(masque_magenta(a).any(1))[0]
    return (ys.max() + 1 - ys.min()) / HAUTEUR


def marche():
    """Les six images de marche (fond magenta), à la taille de Mat debout (la plus haute fait 98 % de sa hauteur : il fléchit un peu)."""
    a = np.array(Image.open(GUITARE / 'marche.jpg').convert('RGB')).astype(float)
    op = masque_magenta(a)
    # la guitare d'une image frôle l'image d'à côté : un seul blob par image (les morceaux voisins sont réunis par une dilatation
    # d'un pas), les six plus gros ; chaque image est rognée sur ses seules colonnes
    from scipy import ndimage

    lien = ndimage.binary_dilation(op, structure=np.ones((3, 3)), iterations=6)
    etiquettes, n = ndimage.label(lien)
    tailles = ndimage.sum(op, etiquettes, range(1, n + 1))
    gros = sorted(np.argsort(tailles)[-6:] + 1, key=lambda e: np.nonzero(etiquettes == e)[1].min())
    bandes = []
    for e in gros:
        xs = np.nonzero((etiquettes == e).any(0))[0]
        bandes.append((xs.min(), xs.max() + 1))
    op_images = [op & (etiquettes == e) for e in gros]
    haut = max(np.ptp(np.nonzero(m.any(1))[0]) + 1 for m in op_images)
    f = haut / (HAUTEUR * 0.98)
    print(f'marche : {len(bandes)} images')
    return [regrille(a[:, x0:x1], m[:, x0:x1], f) for (x0, x1), m in zip(bandes, op_images)]


def hanches(nat):
    """L'abscisse du milieu du corps à hauteur des hanches (55 % de la hauteur) : le point qu'on aligne d'une image à l'autre."""
    al = nat[..., 3] > 0
    ys = np.nonzero(al.any(1))[0]
    y = int(ys.min() + 0.55 * (ys.max() - ys.min()))
    xs = np.nonzero(al[y - 2 : y + 3].any(0))[0]
    return (xs.min() + xs.max()) / 2


def pieds(nat):
    """L'abscisse du milieu des pieds (les quatre rangées du bas)."""
    al = nat[..., 3] > 0
    ys = np.nonzero(al.any(1))[0]
    xs = np.nonzero(al[ys.max() - 3 : ys.max() + 1].any(0))[0]
    return (xs.min() + xs.max()) / 2


def dans_la_case(nat, x_ref, pied):
    """Pose l'image dans une case CASE × CASE : son bas au bas de la case, son point `x_ref` en `pied`."""
    case = Image.new('RGBA', (CASE, CASE), (0, 0, 0, 0))
    im = Image.fromarray(nat)
    ys = np.nonzero((nat[..., 3] > 0).any(1))[0]
    case.alpha_composite(im, (int(round(pied - x_ref)), CASE - 1 - int(ys.max())))
    return case


def respire(nat, dy):
    """Le haut du corps (au-dessus des hanches) descendu de `dy` pixels : une respiration."""
    al = nat[..., 3] > 0
    ys = np.nonzero(al.any(1))[0]
    coupe = int(ys.min() + 0.55 * (ys.max() - ys.min()))
    res = nat.copy()
    haut = nat[:coupe].copy()
    res[: coupe + dy] = 0
    res[dy : coupe + dy][haut[..., 3] > 0] = haut[haut[..., 3] > 0]
    res[coupe + dy :] = np.where(nat[coupe + dy :, :, 3:4] > 0, nat[coupe + dy :], res[coupe + dy :])
    return res


def couche(nat):
    """Mat à terre, couché sur le dos (l'image tournée d'un quart de tour, la tête vers l'arrière)."""
    return np.array(Image.fromarray(nat).rotate(90, expand=True, resample=Image.NEAREST))


def planche_heros(repos, pas, saut, echelle_a, echelle_b, mur):
    pied = 62
    r = dans_la_case(repos, hanches(repos), pied)
    respirant = dans_la_case(respire(repos, 1), hanches(repos), pied)
    course = [dans_la_case(p, hanches(p), pied) for p in pas]
    lignes = {
        0: [r, respirant, respirant, r],
        1: course,
        2: [dans_la_case(saut, hanches(saut), pied)],
        3: [dans_la_case(echelle_a, hanches(echelle_a), pied), dans_la_case(echelle_b, hanches(echelle_b), pied)],
        4: [dans_la_case(saut, hanches(saut), pied)],
        5: [dans_la_case(mur, pieds(mur), pied)],
        6: [dans_la_case(couche(repos), couche(repos).shape[1] / 2, pied)],
        10: [r, dans_la_case(repos, hanches(repos) + 1, pied)],
        **{k: course for k in (11, 12, 13, 14)},
    }
    planche = Image.new('RGBA', (CASE * 6, CASE * 15), (0, 0, 0, 0))
    for i, fr in lignes.items():
        for j, f in enumerate(fr):
            planche.alpha_composite(f, (j * CASE, i * CASE))
    planche.save(SPRITES / 'mat-essai.png', optimize=True)
    print(f"mat-essai.png : heros('mat-essai.png', {CASE}, {CASE}, {pied})")


def image_seule(nat, nom, pied_x=None):
    """Une image du décor (saut, mur) : recadrée, le pied au milieu des pieds (ou au milieu de l'image)."""
    im = Image.fromarray(nat)
    im = im.crop(im.getbbox())
    im.save(SPRITES / f'{nom}.png', optimize=True)
    p = int(round(pied_x if pied_x is not None else im.width / 2))
    print(f"{nom}.png : w {im.width}, h {im.height}, pied {p}")


def echelle_deux_temps(a, b):
    """Les deux temps de la montée : deux images de dos, l'une sous l'autre, recadrées à la même taille (le héros tient sur l'échelle)."""
    ims = [Image.fromarray(n) for n in (a, b)]
    boites = [i.getbbox() for i in ims]
    # le même cadre pour les deux : le milieu du corps (hanches) sur la même colonne, la hauteur du plus grand
    xs = [hanches(n) - bb[0] for n, bb in zip((a, b), boites)]
    g, d = max(xs), max(bb[2] - bb[0] - x for x, bb in zip(xs, boites))
    w = int(round(g + d))
    h = max(bb[3] - bb[1] for bb in boites)
    planche = Image.new('RGBA', (w, h * 2), (0, 0, 0, 0))
    for k, (i, bb, x) in enumerate(zip(ims, boites, xs)):
        planche.alpha_composite(i.crop(bb), (int(round(g - x)), k * h + h - (bb[3] - bb[1])))
    planche.save(SPRITES / 'mat-essai-echelle.png', optimize=True)
    print(f"mat-essai-echelle.png : w {w}, h {h}, pied {int(round(g))}")


def voiture(nom, largeur_jeu):
    """Une vue de l'Opel Corsa : sur sa grille, puis agrandie sans lissage à sa largeur en jeu (6 pixels de planche par pixel)."""
    a = np.array(Image.open(SRC / f'corsa-{nom}.jpg').convert('RGB')).astype(float)
    op = masque_magenta(a)
    xs = np.nonzero(op.any(0))[0]
    # deux pixels d'art par pixel du jeu, comme les voitures d'origine : la grille se retrouve à cette finesse
    nat = regrille(a, op, (xs.max() + 1 - xs.min()) / (2 * largeur_jeu))
    im = Image.fromarray(nat)
    im = im.crop(im.getbbox())
    w = largeur_jeu * 6
    im = im.resize((w, round(im.height * w / im.width)), Image.NEAREST)
    im.save(SPRITES / f'drift-matt-essai-{nom}.png', optimize=True)
    print(f'drift-matt-essai-{nom}.png : {im.width // 6} x {im.height // 6} en jeu')


def portrait(repos):
    """Le portrait des dialogues (44 × 44, comme les autres) : la tête et les épaules de Mat debout."""
    al = repos[..., 3] > 0
    ys = np.nonzero(al.any(1))[0]
    haut = ys.min()
    xs = np.nonzero(al[haut : haut + 30].any(0))[0]
    cx = (xs.min() + xs.max()) // 2
    tete = Image.fromarray(repos).crop((cx - 22, haut - 2, cx + 22, haut + 42))
    tete.save(RACINE / 'public' / 'portraits' / 'mat-essai.png', optimize=True)
    print('portraits/mat-essai.png : 44 x 44')


def intro(repos):
    """Les silhouettes de l'intro (128 × 128 par héros) : celle de Mat (la quatrième) remplacée par le nouveau Mat debout."""
    planche = Image.open(SPRITES / 'intro-heros.png').convert('RGBA')
    planche.paste((0, 0, 0, 0), (3 * 128, 0, 4 * 128, 128))
    im = Image.fromarray(repos)
    im = im.crop(im.getbbox())
    k = 110 / im.height
    im = im.resize((round(im.width * k), 110), Image.NEAREST)
    planche.alpha_composite(im, (3 * 128 + 64 - im.width // 2, 128 - im.height))
    planche.save(SPRITES / 'intro-heros-essai.png', optimize=True)
    print('intro-heros-essai.png')


def main():
    f = facteur_magenta()
    repos = magenta('repos.jpg', f)
    saut = magenta('saut.jpg', f)
    echelle_a = magenta('echelle-1.jpg', f)
    echelle_b = magenta('echelle-2.jpg', f)
    mur = magenta('mur.jpg', f)
    pas = marche()
    planche_heros(repos, pas, saut, echelle_a, echelle_b, mur)
    image_seule(saut, 'mat-essai-saut')
    image_seule(mur, 'mat-essai-mur', pieds(mur) - np.nonzero((mur[..., 3] > 0).any(0))[0].min())
    echelle_deux_temps(echelle_a, echelle_b)
    voiture('dos', 58)
    voiture('biais-droite', 66)
    portrait(repos)
    intro(repos)


if __name__ == '__main__':
    main()
