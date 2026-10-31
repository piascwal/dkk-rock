"""Au-dessus et en dessous (docs/LEVEL-DESIGN.md) : une longue étendue plate, où l'on traverse sans changer de hauteur, reçoit des
gradins (sur la glace ou l'eau, des gradins de pitons posés en l'air, qu'on traverse par en dessous). On choisit : passer dessus (les gradins se gravissent marche après marche, des gardes en haut, une corniche de pitons plus
haut encore, du butin) ou dessous (une fosse de trois marches, juste devant, où l'on entre en marchant, puis un passage sous les
gradins qui ressort de l'autre côté ; un boyau en part vers les complexes souterrains). Aucune échelle : c'est le terrain qui
propose les deux chemins.

`relief_des_plats` cherche ces étendues une fois les modules posés, avant le réseau souterrain (massifs.py).
"""
from massifs import _naturel

HAUT = 8  # la hauteur des gradins, en rangées
PRESERVE = set('0123456789!K*+@F&()$')  # les repères qu'une marche ne doit pas recouvrir : on les remonte sur la marche
HORS = ('arene', 'avion', 'ferry')  # là où l'on ne pose jamais de gradins


def _vide_dessus(n, x, g, hauteur=14):
    """Rien au-dessus du sol de la colonne x (le ciel, des gardes, des repères) : la place pour des gradins."""
    return all(n.get(x, y) in ' ' or n.get(x, y).islower() or n.get(x, y) in PRESERVE for y in range(g - hauteur, g))


def _monte(n, x, haut, g, mat):
    """La colonne x devient une marche de `haut` à `g` ; les repères et les gardes qui y étaient remontent dessus."""
    garde = [n.get(x, y) for y in range(haut, g) if n.get(x, y) != ' ']
    for y in range(haut, g):
        n.set(x, y, mat)
    for k, c in enumerate(garde):
        n.set(x, haut - 1 - k, c)


def tribune(n, x0, x1, lettres, mat):
    """Des gradins sur [x0, x1), le sol à la rangée n.haut[x0] ; devant eux, la fosse et le passage dessous."""
    g = n.haut[x0]
    sous_eau = any(n.get(x, g) == 'G' or n.get(x, g + 1) == '~' for x in range(x0, x1))
    debut, fin = x0 + 3, x1 - 3
    # les gradins : des marches de deux colonnes, une rangée chacune ; en haut, un palier ; on redescend en sautant
    for x in range(debut, fin):
        k = (x - debut) // 2
        if sous_eau:
            # sur la glace : des gradins de pitons, posés en l'air ; on patine dessous, on y grimpe d'un saut par en dessous
            y = g - 1 - min(k, HAUT - 1)
            if n.get(x, y) == ' ':  # jamais sur un repère, un garde, un drapeau
                n.set(x, y, '=')
        else:
            _monte(n, x, g - 1 - min(k, HAUT - 1), g, mat)
    palier = g - HAUT
    n.ennemis(debut + 2 * HAUT, fin, lettres, 2 + (fin - debut) // 16, ymin=palier - 3)
    # une corniche de pitons au-dessus du palier : on y monte d'un saut, un garde et du butin
    cx = debut + 2 * HAUT + 2
    if cx + 5 < fin:
        for x in range(cx, cx + 4):
            n.set(x, palier - 3, '=')
        n.ennemis(cx, cx + 4, lettres, 1, ymin=palier - 6)
        n.repere(cx + 1, '*', ymin=palier - 6)
    if sous_eau:
        return  # sur la glace et l'eau, pas de passage dessous
    # la fosse : trois marches qui descendent, juste devant les gradins (on la saute, ou l'on y entre)
    for k in range(3):
        n.base_col(x0 + k, g + 1 + k)
    # le passage sous les gradins, à la hauteur du fond de la fosse, et la sortie de l'autre côté (trois marches qui remontent)
    sol = g + 3
    for x in range(debut, fin):
        for y in range(sol - 2, sol):
            if _naturel(n, n.get(x, y)):
                n.set(x, y, ' ')
    for k in range(3):
        n.base_col(fin + k, g + 3 - k)
    n.ennemis(debut, fin, lettres, 2, ymin=sol - 3)
    n.repere((debut + fin) // 2, '+', ymin=sol - 3)
    # un boyau vers le complexe souterrain le plus proche, par une rampe au début du passage (voir massifs._entrees)
    if not hasattr(n, 'acces'):
        n.acces = []
    n.acces.append((debut, sol, -1))


def relief_des_plats(r, lettres, longueur=34):
    """Chaque étendue plate d'au moins `longueur` colonnes, sans rien au-dessus, reçoit des gradins (un tous les 60 environ)."""
    n = r.n
    hors = [(a, b) for a, b, genre in r.pieces if genre in HORS]
    x = 24
    while x < n.w - 24:
        g = n.haut[x]
        fin = x
        # du vrai sol : pas le fond d'un vide sans fond (entre deux tours, sous un pont)
        sol = g < n.bas - 4 and n.get(x, g) != ' '
        while sol and fin < n.w - 24 and n.haut[fin] == g and _vide_dessus(n, fin, g) and not any(a <= fin < b for a, b in hors):
            fin += 1
        if fin - x >= longueur:
            largeur = min(fin - x, 44)
            debut = x + (fin - x - largeur) // 2
            tribune(n, debut, debut + largeur, lettres, n.t['mur'])
            x = debut + largeur + 20
        else:
            x = fin + 1
