#!/usr/bin/env python3
"""Les animations du bouliste de Marseille, faites à la main (sans Depix) à partir de son sprite.

Usage : python3 outils/anime-bouliste.py      (Pillow et numpy requis)

Entrée  : assets-sources/ennemis/bouliste-1-base.png (tourné vers la droite)
Sorties : assets-sources/ennemis/bouliste-1-anim.png (une ligne par animation) et bouliste-1-anim.json
          (même format que l'export « Pour le jeu » de Depix : voir DEPIX dans fixe-ennemis.py)

Le sprite est remis sur sa grille réelle, puis découpé par zones de pixels : le corps (tête, torse, ventre, sacoche), le
bras proche (celui qui tient les boules), le bras loin, la jambe proche et la jambe loin. Aucun pixel n'est inventé,
sauf sous un membre qui bouge, où la zone du corps qu'il cachait reprend la couleur de sa voisine :
- les bras tournent autour de l'épaule (rotation au plus proche voisin, sans trou) ;
- les jambes se décalent ligne à ligne depuis la hanche (une rotation de jambe sur un sprite de ce style laisserait
  des trous) : le pied avance ou recule, et se lève pendant le pas ;
- le corps descend d'un ou deux pixels à chaque appui, et penche en bloc quand il est touché.
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

CORPS, BRAS_P, BRAS_L, JAMBE_P, JAMBE_L = range(5)
EPAULE_P, EPAULE_L = (24.0, 57.0), (95.0, 66.0)
HANCHE, CHEVILLE, GENOU = 108, 172, 138
CONTOUR = (36, 22, 22, 255)  # le trait sombre qui borde la chemise là où le bras la cachait
# bord droit du bras proche, ligne par ligne : au-delà, c'est la chemise
BORD_BRAS = [(44, 40), (60, 38), (70, 35), (80, 31), (90, 30), (100, 33), (108, 36)]


def sprite():
    nat, _ = natif_et_case(SRC / 'bouliste-1-base.png')
    ys, xs = np.nonzero(nat[..., 3])
    return nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def decoupe(nat):
    """L'étiquette de chaque pixel : corps, bras proche, bras loin, jambe proche, jambe loin."""
    h, w = nat.shape[:2]
    op = nat[..., 3] > 0
    r, g, b = (nat[..., i].astype(int) for i in range(3))
    lum = (r * 3 + g * 6 + b) // 10
    sat = nat[..., :3].max(axis=2).astype(int) - nat[..., :3].min(axis=2).astype(int)
    yy, xx = np.mgrid[0:h, 0:w]
    peau = (r > g + 8) & (r > b + 25) & (r > 150)
    creme = (sat < 45) & (lum > 150)
    sombre = lum < 60
    bord = np.interp(yy, *zip(*BORD_BRAS))
    lab = np.zeros((h, w), int)
    bras_p = op & peau & (xx <= bord) & (yy >= 44) & (yy <= 140)
    bras_p |= op & (xx <= 15) & (yy >= 100) & (yy <= 140)
    # la main et ses deux boules : l'ellipse de la boule collée au pantalon, et tout ce qui est à gauche du pantalon
    bras_p |= op & (xx <= 35) & (yy >= 108) & (yy <= 140) & (((r > g) & (lum > 70)) | (((xx - 28.5) / 7.5) ** 2 + ((yy - 126.5) / 9.5) ** 2 < 1) | (xx <= 22))
    lab[bras_p] = BRAS_P
    # le bras loin : la peau de l'épaule, puis l'avant-bras et la main, hors de la sacoche (x < 93) qui reste au corps
    lab[op & (xx >= 84) & (xx <= 102) & (yy >= 56) & (yy < 78) & peau] = BRAS_L
    lab[op & (xx >= 93) & (yy >= 78) & (yy <= 135) & ~creme] = BRAS_L
    lab[op & (xx >= 90) & (yy >= 116) & (yy <= 135) & ~creme] = BRAS_L
    jambes = op & (yy >= HANCHE) & (lab == CORPS)
    lab[jambes & (xx < 56.5)] = JAMBE_P
    lab[jambes & (xx >= 56.5)] = JAMBE_L
    # les contours sombres collés à un bras le suivent
    for etiquette in (BRAS_P, BRAS_L):
        for _ in range(2):
            m = lab == etiquette
            voisin = np.zeros_like(m)
            voisin[1:] |= m[:-1]; voisin[:-1] |= m[1:]; voisin[:, 1:] |= m[:, :-1]; voisin[:, :-1] |= m[:, 1:]
            lab[voisin & op & sombre & (lab == CORPS)] = etiquette
    return lab


def remplit_corps(nat, lab):
    """Le corps à nu : sous chaque bras, la chemise reprend la couleur de sa voisine de la même ligne (pour que le bras puisse bouger)."""
    h, w = nat.shape[:2]
    corps = nat.copy()
    corps[lab != CORPS] = 0
    for y in range(44, HANCHE):
        # sous le bras proche : à partir de la chemise, vers la droite
        trous = [x for x in range(29, w) if lab[y, x] == BRAS_P]
        if trous:
            source = next((x for x in range(max(trous) + 1, w) if lab[y, x] == CORPS and nat[y, x, 3]), None)
            if source is not None:
                for x in trous:
                    corps[y, x] = nat[y, source]
                corps[y, min(trous)] = CONTOUR
        # sous le bras loin : jusqu'au ventre, vers la gauche
        trous = [x for x in range(0, 86) if lab[y, x] == BRAS_L]
        if trous:
            source = next((x for x in range(min(trous) - 1, -1, -1) if lab[y, x] == CORPS and nat[y, x, 3]), None)
            if source is not None:
                for x in trous:
                    corps[y, x] = nat[y, source]
    # le haut de l'épaule reste au corps, sous le bras : quand le bras tourne, l'épaule ne se déchire pas
    cap = (lab == BRAS_P) & (np.mgrid[0 : h, 0 : w][0] <= 62)
    corps[cap] = nat[cap]
    return corps


def pose_sur(toile, calque, dx=0, dy=0):
    """Pose un calque (RGBA) décalé sur la toile : les pixels opaques écrasent."""
    h, w = calque.shape[:2]
    ys, xs = np.nonzero(calque[..., 3])
    ys2, xs2 = ys + dy + MARGE, xs + dx + MARGE
    bon = (ys2 >= 0) & (ys2 < toile.shape[0]) & (xs2 >= 0) & (xs2 < toile.shape[1])
    toile[ys2[bon], xs2[bon]] = calque[ys[bon], xs[bon]]


def tourne(calque, pivot, angle, dy=0):
    """Fait tourner un membre autour de son pivot (angle en degrés, positif : vers l'avant, à droite) ; au plus proche voisin."""
    a = math.radians(angle)
    h, w = calque.shape[:2]
    sortie = np.zeros((h + 2 * MARGE, w + 2 * MARGE, 4), np.uint8)
    ys, xs = np.mgrid[0 : sortie.shape[0], 0 : sortie.shape[1]]
    vx, vy = xs - MARGE - pivot[0], ys - MARGE - dy - pivot[1]
    # rotation inverse : d'où vient chaque pixel d'arrivée
    sx = np.rint(pivot[0] + vx * math.cos(a) - vy * math.sin(a) - 0.0).astype(int)
    sy = np.rint(pivot[1] + vx * math.sin(a) + vy * math.cos(a)).astype(int)
    bon = (sx >= 0) & (sx < w) & (sy >= 0) & (sy < h)
    sortie[bon] = calque[sy[bon], sx[bon]]
    return sortie


def jambe(calque, avance, leve):
    """La jambe décalée ligne à ligne depuis la hanche : le pied avance de `avance` pixels (vers la droite) et monte de `leve`."""
    h, w = calque.shape[:2]
    sortie = np.zeros_like(calque)
    for y in range(HANCHE, h):
        t = min(1.0, (y - HANCHE) / (CHEVILLE - HANCHE)) ** 1.3
        dx = round(avance * t)
        dy = -round(leve * min(1.0, max(0.0, (y - GENOU) / (CHEVILLE - GENOU)) ** 1.2))
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


class Bouliste:
    def __init__(self):
        self.nat = sprite()
        self.lab = decoupe(self.nat)
        self.corps = remplit_corps(self.nat, self.lab)
        h, w = self.nat.shape[:2]

        def calque(*ids):
            c = self.nat.copy()
            c[~np.isin(self.lab, ids)] = 0
            return c

        self.c = {i: calque(i) for i in (BRAS_P, BRAS_L, JAMBE_P, JAMBE_L)}
        # sous la main, le pantalon de la jambe proche (que les boules cachent) reprend la couleur de sa voisine de droite
        for y in range(HANCHE, 141):
            for x in range(29, 56):
                if self.lab[y, x] == BRAS_P:
                    source = next((k for k in range(x + 1, 60) if self.lab[y, k] == JAMBE_P), None)
                    if source is not None:
                        self.c[JAMBE_P][y, x] = self.nat[y, source]
        self.h, self.w = h, w

    def image(self, bob=0, jp=(0, 0), jl=(0, 0), bras_p=0.0, bras_l=0.0, penche=0.0, leve_bras_p=0):
        """Une image : bob = descente du corps (px), jp / jl = (avance, lève) de chaque pied, bras en degrés, penche = recul du haut du corps (px)."""
        toile = np.zeros((self.h + 2 * MARGE, self.w + 2 * MARGE, 4), np.uint8)
        pose_sur(toile, jambe(self.c[JAMBE_L], *jl))
        pose_sur(toile, jambe(self.c[JAMBE_P], *jp))
        bl = tourne(self.c[BRAS_L], EPAULE_L, bras_l, bob)
        bp = tourne(self.c[BRAS_P], EPAULE_P, bras_p, bob + leve_bras_p)
        toile[bl[..., 3] > 0] = bl[bl[..., 3] > 0]
        pose_sur(toile, self.corps, 0, bob)
        toile[bp[..., 3] > 0] = bp[bp[..., 3] > 0]
        comble_entrejambe(toile)
        if penche:
            toile = incline(toile, penche)
        return nettoie(toile)


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


def comble_entrejambe(toile):
    """Les petits vides d'une ou deux cases entre les jambes, sous le ventre, reprennent la couleur de leur voisin de gauche."""
    for y in range(HANCHE + MARGE, HANCHE + MARGE + 22):
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


def animations(b):
    # repos : il respire, les bras suivent un temps après
    repos = [b.image(bob=d, bras_p=a, bras_l=-a / 2) for d, a in [(0, 0), (1, 0.5), (2, 1.0), (1, 0.5)]]
    # marche : six images, les jambes en opposition, les bras à l'opposé des jambes du même côté
    marche = []
    for i in range(6):
        u = i / 6
        (ap, lp), (al, ll) = pas(u), pas(u + 0.5)
        bob = round(2 * abs(math.cos(2 * math.pi * u)))
        marche.append(b.image(bob=bob, jp=(ap, lp), jl=(al, ll), bras_p=-6 * ap / 10, bras_l=5 * ap / 10))
    # attaque : il arme le bras (en arrière), lance (en avant, haut), laisse filer, revient
    attaque = [
        b.image(bras_p=-20, bras_l=4, penche=-4, jp=(-3, 0), jl=(5, 0)),
        b.image(bob=1, bras_p=-45, bras_l=8, penche=-8, jp=(-5, 0), jl=(7, 0)),
        b.image(bob=1, bras_p=55, bras_l=-6, penche=5, jp=(7, 0), jl=(-6, 0)),
        b.image(bras_p=80, bras_l=-10, penche=8, jp=(9, 0), jl=(-8, 0)),
        b.image(bras_p=25, bras_l=-3, penche=2, jp=(3, 0), jl=(-2, 0)),
    ]
    # touché : le haut du corps recule d'un coup, les bras s'écartent, puis il se redresse
    touche = [
        b.image(bob=1, bras_p=-35, bras_l=14, penche=14, jp=(-4, 0), jl=(4, 0)),
        b.image(bras_p=-20, bras_l=8, penche=8),
        b.image(bras_p=-5, bras_l=3, penche=2),
    ]
    return [('repos', repos, 4), ('marche', marche, 8), ('attaque', attaque, 10), ('touche', touche, 8)]


def main():
    b = Bouliste()
    anims = animations(b)
    fh, fw = anims[0][1][0].shape[:2]
    planche = np.zeros((fh * len(anims), fw * max(len(ims) for _, ims, _ in anims), 4), np.uint8)
    meta = []
    for r, (nom, ims, fps) in enumerate(anims):
        for c, im in enumerate(ims):
            planche[r * fh : (r + 1) * fh, c * fw : (c + 1) * fw] = im
        meta.append({'name': nom, 'row': r, 'frames': len(ims), 'fps': fps})
    Image.fromarray(planche).save(SRC / 'bouliste-1-anim.png')
    (SRC / 'bouliste-1-anim.json').write_text(
        json.dumps({'frameWidth': fw, 'frameHeight': fh, 'animations': meta, 'regard': 'droite'}, ensure_ascii=False)
    )
    print(f'bouliste-1-anim.png : {fw} x {fh} par image, {[(n, len(i)) for n, i, _ in anims]}')


if __name__ == '__main__':
    main()
