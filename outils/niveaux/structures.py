"""Les grandes structures des niveaux, façon Broforce : des bâtiments à étages qui s'enfoncent dans le sol, des gouffres
qu'on franchit sur des passerelles, des tyroliennes ou des îlots flottants. Chaque structure garde un chemin (le test
d'accessibilité de tests/niveaux.test.ts le vérifie) mais donne envie d'en explorer les recoins : pièces, cloisons à
portes, fenêtres, sous-sols, butin.
"""
import math

ETAGE = 6  # hauteur d'un étage, dalle comprise


def forteresse(n, x0, largeur=30, etages=3, lettres='a', mat=None, sous_sol=True, cage=False):
    """Un bâtiment de `etages` étages, des pièces séparées par des cloisons à porte, des échelles qui alternent d'un
    côté à l'autre (pour monter, il faut traverser les pièces), des fenêtres, un toit avec sa cabane, et un sous-sol
    creusé dans la terre (accès par une trappe au rez-de-chaussée). Le rez-de-chaussée a une porte à chaque bout : le
    chemin de surface le traverse. Renvoie la rangée du toit."""
    mat = mat or n.t['mur']
    base = n.base
    top = base - etages * ETAGE
    x1 = x0 + largeur
    n.rect(x0, top, x1, base, '.')
    for y in range(top, base):
        n.set(x0, y, mat)
        n.set(x1 - 1, y, mat)
    for k in range(1, etages + 1):  # la dalle k, au-dessus de l'étage k - 1
        ys = base - k * ETAGE
        for x in range(x0, x1):
            n.set(x, ys, mat)
        gx = x0 + 3 if k % 2 else x1 - 4
        for y in range(ys, base - (k - 1) * ETAGE):
            n.set(gx, y, 'H')
    for j in range(etages):  # l'étage j : cloison à porte, fenêtres, décor, ennemis
        bas = base - j * ETAGE - 1
        haut = base - (j + 1) * ETAGE + 1
        cx = x0 + largeur // 2 + (2 if j % 2 else -2)
        for y in range(haut, bas - 1):
            n.set(cx, y, mat)
        for x in (x0, x1 - 1):
            n.set(x, bas - 3, 'V')
        n.set(cx - 3 - j % 2 * 6, bas, 'C' if j % 2 else 'T')
        n.ennemis(x0 + 2, x1 - 2, lettres, 2 + (j > 0), ymin=haut)
    for x in (x0, x1 - 1):  # les portes du rez-de-chaussée
        n.rect(x, base - 2, x + 1, base, ' ')
    n.repere(x0 + largeur // 2 + 5, '+', ymin=base - 2 * ETAGE + 1)
    _toit(n, x0, x1, top, mat, lettres)
    if sous_sol:
        _sous_sol(n, x0, x1, mat, lettres, cage)
    return top


def _toit(n, x0, x1, top, mat, lettres):
    """Un parapet de pitons, une cabane avec du butin, des guetteurs."""
    for x in range(x0, x1):
        if (x - x0) % 5 == 0:
            n.set(x, top - 1, '=')
    hx = x1 - 11
    n.rect(hx, top - 4, hx + 7, top, '.')
    for y in range(top - 4, top):
        n.set(hx, y, mat)
        n.set(hx + 6, y, mat)
    for x in range(hx, hx + 7):
        n.set(x, top - 5, mat)
    n.rect(hx, top - 2, hx + 1, top, ' ')  # la porte de la cabane, côté échelle
    n.set(hx + 6, top - 3, 'V')
    n.repere(hx + 3, '*', ymin=top - 4)
    n.ennemis(x0 + 4, hx - 1, lettres, 2, ymin=top - 1)


def _sous_sol(n, x0, x1, mat, lettres, cage):
    """Deux salles creusées sous le bâtiment, séparées par une cloison à porte, avec une trappe-échelle depuis le
    rez-de-chaussée ; au fond, du butin ou une cage (+1 vie)."""
    base = n.base
    n.rect(x0 + 2, base + 1, x1 - 2, base + 7, '.')
    mid = x0 + (x1 - x0) // 2
    for y in range(base + 1, base + 5):
        n.set(mid, y, mat)
    trappe = mid + 5
    for y in range(base, base + 7):
        n.set(trappe, y, 'H')
    for x in (x0 + 1, x1 - 2):  # des fenêtres dans l'épaisseur du mur
        n.set(x, base + 3, 'V')
    n.ennemis(x0 + 3, x1 - 3, lettres, 3, ymin=base + 1)
    n.repere(x0 + 4, 'K' if cage else '*', ymin=base + 1)


def _ilot(n, x, y, largeur):
    """Un îlot flottant : un dessus de terre à la rangée `y`, un dessous arrondi (plus épais au milieu)."""
    for i in range(largeur):
        epaisseur = 1 + round(2.2 * math.sin(math.pi * (i + 0.5) / largeur))
        for k in range(epaisseur):
            n.set(x + i, y + k, n.t['sol'] if k == 0 else n.t['sous'])


def traversee(n, x0, lettres='a'):
    """Un gouffre sans fond de 17 tuiles, trop large pour être sauté, et trois façons de le franchir : une passerelle en
    arc (qui plonge au milieu), une tyrolienne depuis un échafaudage, ou trois îlots flottants en escalier (le butin y est).
    Tomber, c'est le vide. Renvoie (début, fin) du gouffre : la galerie y est coupée."""
    base = n.base
    gx0 = x0 + 12
    g = 17
    gx1 = gx0 + g
    for x in range(gx0, gx1):  # le gouffre : plus de terre, plus de galerie
        for y in range(base, n.h):
            n.set(x, y, ' ')
    for i in range(g):  # la passerelle : des planches qui plongent de trois rangées au milieu
        x = gx0 + i
        y = base + round(3 * math.sin(math.pi * (i + 0.5) / g))
        n.set(x, y, '=' if i % 6 == 3 else '-')
    # l'échafaudage collé au bord : d'où part la tyrolienne et d'où l'on saute sur le premier îlot
    haut = n.echafaudage(gx0 - 10, 9, 2)
    top = haut[-1]
    n.tyro(gx0 - 5, top - 1, gx1 + 3, base - 5)
    # trois îlots en escalier descendant (un saut de trois tuiles de l'un à l'autre) ; le butin est sur le premier
    for k, ytop in enumerate((base - 5, base - 4, base - 2)):
        _ilot(n, gx0 + 1 + 6 * k, ytop, 4)
    n.repere(gx0 + 2, '*', ymin=base - 6)
    n.ennemis(gx0 + 7, gx0 + 11, lettres, 1, ymin=base - 5)
    n.ennemis(gx0 + 13, gx0 + 17, lettres, 1, ymin=base - 3)
    n.ennemis(gx1 + 1, gx1 + 8, lettres, 2)
    n.ennemis(gx0 - 9, gx0 - 2, lettres, 1, ymin=top - 1)
    return gx0, gx1
