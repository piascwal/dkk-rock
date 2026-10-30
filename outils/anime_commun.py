"""Ce que partagent les animations faites à la main (outils/anime-*.py) : un sprite remis sur sa grille, découpé en
calques que l'on décale, fait tourner ou incline, puis la planche au format de l'export « Pour le jeu » de Depix.

Aucun pixel n'est redessiné : un membre tourne au plus proche voisin, une jambe se décale ligne à ligne (sans trou),
le haut du corps s'incline ligne à ligne ; les petits vides sont comblés par la couleur voisine.
"""
import json
import math
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

SRC = pathlib.Path(__file__).resolve().parent.parent / 'assets-sources' / 'ennemis'
MARGE = 24  # autour du sprite, pour les bras levés et le recul


def sprite(type_):
    """assets-sources/ennemis/<type>-1-base.png remis sur sa grille réelle, recadré sur sa silhouette."""
    nat, _ = natif_et_case(SRC / f'{type_}-1-base.png')
    ys, xs = np.nonzero(nat[..., 3])
    return nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def voisins(m):
    """Les pixels qui touchent le masque (4 voisins)."""
    v = np.zeros_like(m)
    v[1:] |= m[:-1]
    v[:-1] |= m[1:]
    v[:, 1:] |= m[:, :-1]
    v[:, :-1] |= m[:, 1:]
    return v


def pose_sur(toile, calque, dx=0, dy=0):
    """Pose un calque (RGBA) décalé sur la toile : les pixels opaques écrasent."""
    h, w = calque.shape[:2]
    ys, xs = np.nonzero(calque[..., 3])
    ys2, xs2 = ys + dy + MARGE, xs + dx + MARGE
    bon = (ys2 >= 0) & (ys2 < toile.shape[0]) & (xs2 >= 0) & (xs2 < toile.shape[1])
    toile[ys2[bon], xs2[bon]] = calque[ys[bon], xs[bon]]


def tourne(calque, pivot, angle, dy=0, marge=MARGE):
    """Fait tourner un membre autour de son pivot (angle en degrés, positif : vers l'avant, à droite) ; au plus proche voisin.

    Le résultat est agrandi de `marge` de chaque côté (0 : une image déjà à la taille de la toile garde sa taille).
    """
    a = math.radians(angle)
    h, w = calque.shape[:2]
    sortie = np.zeros((h + 2 * marge, w + 2 * marge, 4), np.uint8)
    ys, xs = np.mgrid[0 : sortie.shape[0], 0 : sortie.shape[1]]
    vx, vy = xs - marge - pivot[0], ys - marge - dy - pivot[1]
    # rotation inverse : d'où vient chaque pixel d'arrivée
    sx = np.rint(pivot[0] + vx * math.cos(a) - vy * math.sin(a)).astype(int)
    sy = np.rint(pivot[1] + vx * math.sin(a) + vy * math.cos(a)).astype(int)
    bon = (sx >= 0) & (sx < w) & (sy >= 0) & (sy < h)
    sortie[bon] = calque[sy[bon], sx[bon]]
    return sortie


def jambe(calque, avance, leve, hanche, genou, cheville):
    """La jambe décalée ligne à ligne depuis la hanche : le pied avance de `avance` pixels (vers la droite) et monte de `leve`."""
    h, w = calque.shape[:2]
    sortie = np.zeros_like(calque)
    for y in range(hanche, h):
        t = min(1.0, (y - hanche) / (cheville - hanche)) ** 1.3
        dx = round(avance * t)
        dy = -round(leve * min(1.0, max(0.0, (y - genou) / (cheville - genou)) ** 1.2))
        ligne = calque[y]
        for x in np.nonzero(ligne[:, 3])[0]:
            if 0 <= x + dx < w and 0 <= y + dy < h:
                sortie[y + dy, x + dx] = ligne[x]
    return sortie


def pas(u, amplitude=10.0, hauteur=9.0):
    """Une jambe à la phase u du cycle (0 : le talon se pose, devant) : appui jusqu'à 0,5 (le pied recule), puis le pas (le pied revient en se levant)."""
    u %= 1.0
    if u < 0.5:
        return amplitude * (1 - 4 * u), 0.0
    v = (u - 0.5) * 2
    return -amplitude * math.cos(math.pi * v), hauteur * math.sin(math.pi * v)


def nettoie(toile):
    """Retire les pixels isolés (aucun voisin opaque) et les petits îlots de moins de 6 pixels."""
    op = toile[..., 3] > 0
    vu = np.zeros_like(op)
    h, w = op.shape
    for y0, x0 in zip(*np.nonzero(op)):
        if vu[y0, x0]:
            continue
        groupe, pile = [], [(y0, x0)]
        vu[y0, x0] = True
        while pile:
            y, x = pile.pop()
            groupe.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and op[ny, nx] and not vu[ny, nx]:
                    vu[ny, nx] = True
                    pile.append((ny, nx))
        if len(groupe) < 6:
            for y, x in groupe:
                toile[y, x] = 0
    return toile


def comble_entrejambe(toile, hanche):
    """Les petits vides d'une ou deux cases entre les jambes, sous le ventre, reprennent la couleur de leur voisin de gauche."""
    for y in range(hanche + MARGE, hanche + MARGE + 22):
        ligne = toile[y]
        pleins = np.nonzero(ligne[:, 3])[0]
        if len(pleins) < 2:
            continue
        for x in range(pleins.min(), pleins.max()):
            if ligne[x, 3] == 0:
                fin = next((k for k in range(x, min(x + 4, ligne.shape[0])) if ligne[k, 3]), None)
                if fin is not None and ligne[x - 1, 3]:
                    ligne[x : fin] = ligne[x - 1]


def incline(toile, penche):
    """Le haut du corps recule en bloc (ligne à ligne, aucun trou), les pieds restent au sol."""
    sortie = np.zeros_like(toile)
    bas = toile.shape[0] - MARGE
    for y in range(toile.shape[0]):
        dx = -round(penche * (max(0.0, bas - y) / bas) ** 1.4)
        ligne = toile[y]
        xs = np.nonzero(ligne[:, 3])[0]
        ok = (xs + dx >= 0) & (xs + dx < toile.shape[1])
        sortie[y, xs[ok] + dx] = ligne[xs[ok]]
    return sortie


def ecrit_planche(type_, anims, regard='droite'):
    """<type>-1-anim.png (une ligne par animation) et <type>-1-anim.json ; anims : [(nom, images, images par seconde)]."""
    fh, fw = anims[0][1][0].shape[:2]
    planche = np.zeros((fh * len(anims), fw * max(len(ims) for _, ims, _ in anims), 4), np.uint8)
    meta = []
    for r, (nom, ims, fps) in enumerate(anims):
        for c, im in enumerate(ims):
            planche[r * fh : (r + 1) * fh, c * fw : (c + 1) * fw] = im
        meta.append({'name': nom, 'row': r, 'frames': len(ims), 'fps': fps})
    Image.fromarray(planche).save(SRC / f'{type_}-1-anim.png')
    (SRC / f'{type_}-1-anim.json').write_text(
        json.dumps({'frameWidth': fw, 'frameHeight': fh, 'animations': meta, 'regard': regard}, ensure_ascii=False) + '\n'
    )
    print(f'{type_}-1-anim.png : {fw} x {fh} par image, {[(n, len(i)) for n, i, _ in anims]}')
