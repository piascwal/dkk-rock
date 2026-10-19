"""Les modules du vide et de l'escalade : des massifs séparés par des gouffres sans fond, qu'on relie et qu'on gravit.

- `pont_de_singe` : un gouffre sans fond, trop large pour être sauté, franchi par un pont de planches qui ploie (le jeu dessine
  les cordes sur les planches) ; un piton tous les quatre, que les tirs n'emportent pas.
- `descente` : une tyrolienne qui file vers un massif plus bas, au-delà du vide (passer d'une montagne à l'autre).
- `grotte` : une paroi qu'on gravit par l'intérieur : une entrée au pied, des étages de corniches et d'échelles dans la roche,
  une sortie sur le plateau, plus haut. `base` monte d'autant.
- `corniches` : une paroi qu'on gravit par l'extérieur, de corniche en corniche. `base` monte d'autant.

Dans un niveau « en hauteur » (`altitude` dans plans.py), tout commence vide (`vide_partout`) : chaque pièce pose son propre
massif, de son sol jusqu'en bas de la carte, et le vide entre deux massifs ne pardonne pas.
"""
import math


def vide_partout(n):
    """Efface tout le terrain : le niveau n'est que du vide, jusqu'à ce que les pièces y posent leurs massifs."""
    for x in range(n.w):
        for y in range(n.h):
            n.set(x, y, ' ')
        n.haut[x] = n.h


def abime(n, x0, x1):
    """Du vide sans fond sur les colonnes [x0, x1) : plus de terre, ni de galerie, jusqu'en bas de la carte."""
    for x in range(x0, x1):
        for y in range(n.h):
            n.set(x, y, ' ')
        n.haut[x] = n.h


def pont(n, x0, x1, y, creux=2):
    """Un pont de singe de x0 à x1 (exclu), accroché à la rangée `y` à ses deux bouts, qui ploie de `creux` rangées au milieu :
    des planches, et un piton (incassable) tous les quatre."""
    g = x1 - x0
    for i in range(g):
        yy = y + round(creux * math.sin(math.pi * (i + 0.5) / g))
        n.set(x0 + i, yy, '=' if i % 4 == 0 else '-')


def pont_de_singe(n, x0, largeur, lettres='a', butin=None):
    """Un gouffre sans fond de `largeur - 4` tuiles, au niveau du sol, et son pont de singe ; un garde au milieu du pont,
    un autre de l'autre côté."""
    base = n.base
    g0, g1 = x0 + 2, x0 + largeur - 2
    abime(n, g0, g1)
    pont(n, g0, g1, base, creux=min(3, (g1 - g0) // 5))
    n.ennemis(g0 + 3, g1 - 3, lettres, 1, ymin=base - 3)
    n.ennemis(g1, x0 + largeur, lettres, 1)
    if butin:
        n.repere((g0 + g1) // 2, butin, ymin=base - 3)


def descente(n, x0, largeur, chute=6, lettres='a'):
    """Une tyrolienne depuis le bord du massif, par-dessus le vide, jusqu'à un massif plus bas de `chute` rangées : on passe d'une
    montagne à l'autre. `base` descend d'autant."""
    base = n.base
    bas = base + chute
    g0, g1 = x0 + 4, x0 + largeur - 6
    abime(n, g0, g1)
    for x in range(g1, x0 + largeur):  # le massif d'en face, plus bas
        n.base_col(x, bas)
    n.tyro(x0 + 2, base - 2, g1 + 3, bas - 2)
    n.ennemis(g1 + 1, x0 + largeur, lettres, 1, ymin=bas - 3)
    n.base = bas


def grotte(n, x0, largeur, monte=8, lettres='a', butin='*'):
    """Une paroi de `monte` tuiles qu'on gravit par l'intérieur : une porte au pied, des étages de pitons reliés par des échelles
    qui alternent d'un côté à l'autre, des gardes, le butin sur le dernier étage, et une échelle qui perce le plafond jusqu'au
    plateau. `base` monte de `monte`."""
    base = n.base
    top = base - monte
    xf = x0 + 5  # la paroi
    for x in range(xf, x0 + largeur):
        n.base_col(x, top)
    ix0, ix1 = xf + 1, x0 + largeur - 2  # l'intérieur, sous deux rangées de plafond
    n.rect(ix0, top + 2, ix1, base, '.')
    n.rect(xf, base - 2, xf + 1, base, '.')  # la porte, au pied de la paroi
    cols = (ix0 + 1, ix1 - 2)  # les échelles alternent : à gauche, à droite, à gauche...
    sol = base
    k = 0
    while sol - 4 >= top + 4:
        y = sol - 4
        for x in range(ix0, ix1):  # un étage de pitons, toute la largeur
            n.set(x, y, '=')
        gx = cols[k % 2]
        for yy in range(y, sol):
            n.set(gx, yy, 'H')
        n.ennemis(ix0, ix1, lettres, 1, ymin=y - 1)
        sol = y
        k += 1
    # la sortie : une échelle, du dernier étage jusqu'au plateau, en perçant le plafond
    for yy in range(top, sol):
        n.set(cols[k % 2], yy, 'H')
    n.ennemis(ix0, ix1, lettres, 1, ymin=base - 2)
    n.repere((ix0 + ix1) // 2, butin, ymin=sol - 1)
    n.ennemis(xf + 2, x0 + largeur, lettres, 1, ymin=top - 3)
    n.base = top


def corniches(n, x0, largeur, monte=6, lettres='a', butin='+'):
    """Une paroi de `monte` tuiles qu'on gravit par l'extérieur : des corniches de pitons tous les quatre rangs, reliées par des
    échelles en zigzag, et une dernière échelle jusqu'au plateau. `base` monte de `monte`."""
    base = n.base
    top = base - monte
    xc = x0 + 6  # la paroi
    for x in range(xc, x0 + largeur):
        n.base_col(x, top)
    sol = base
    k = 0
    while sol - 4 > top:
        k += 1
        y = sol - 4
        for x in range(xc - 4, xc):
            n.set(x, y, '=')
        gx = xc - 4 if k % 2 else xc - 1
        for yy in range(y, sol):
            n.set(gx, yy, 'H')
        sol = y
    for yy in range(top, sol):  # la dernière échelle, contre la paroi, jusqu'au plateau
        n.set(xc - 1, yy, 'H')
    n.ennemis(xc, x0 + largeur, lettres, 2, ymin=top - 3)
    n.repere(xc + 2, butin, ymin=top - 3)
    n.base = top
