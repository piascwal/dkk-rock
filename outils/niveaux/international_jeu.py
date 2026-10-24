"""Les lieux propres au jeu de l'International Tour (voir plans.py) : ce qui change la façon de jouer d'une ville à l'autre.

- Beauvais : le gymnase où JBT a été prof de sport, un parcours qui oblige à grimper (le mur d'escalade, la corde, la poutre) ;
- Lund : le lac gelé (une glace qui glisse, des trous où l'on tombe à l'eau), la butte de luge (on monte, on dévale sur la glace).

Comme partout : il y a toujours un chemin (échelles, planches), le test d'accessibilité le vérifie.
"""


def gymnase(n, x0, largeur, lettres='a'):
    """Le gymnase : une grande salle de brique. On entre au rez-de-chaussée, à gauche (les plinthes, la corde à grimper et son
    médiator) ; le passage est fermé par le mur d'escalade, qu'on gravit à l'espalier jusqu'à la poutre. La poutre mène à la
    sortie, en hauteur, d'où une échelle redescend dehors. Derrière le mur, la réserve (on y saute de la poutre, une échelle en
    remonte) et son médiator."""
    base = n.base
    mat = 'B'
    xa, xb = x0 + 2, x0 + largeur - 3  # les deux murs extérieurs
    top = base - 12
    n.rect(xa, top, xb + 1, base, mat)
    n.rect(xa + 1, top + 1, xb, base, '.')
    n.rect(xa, base - 2, xa + 1, base, ' ')  # la porte d'entrée
    for x in range(xa + 4, xb - 2, 6):  # les fenêtres hautes
        n.set(x, top + 3, 'V')
    yb = base - 7  # la poutre, au niveau du haut du mur d'escalade
    xw = xa + (xb - xa) * 3 // 5  # le mur d'escalade (deux tuiles de métal)
    n.rect(xw, yb, xw + 2, base, 'M')
    for y in range(yb, base):  # l'espalier, contre le mur
        n.set(xw - 1, y, 'H')
    for x in range(xw + 2, xb):  # la poutre
        n.set(x, yb, '-')
    n.rect(xb, yb - 2, xb + 1, yb, ' ')  # la sortie, en hauteur
    for y in range(yb, base):  # et l'échelle qui redescend dehors
        n.set(xb + 1, y, 'H')
    for y in range(yb, base):  # la réserve : une échelle pour remonter sur la poutre
        n.set(xb - 1, y, 'H')
    n.repere(xw + 4, '+', ymin=base - 2)
    # les plinthes (deux tuiles de bois, on saute par-dessus) et la corde à grimper, jusqu'à la barre fixe
    xr = xa + 4
    for x in (xr + 4, xr + 9):
        if x + 2 < xw - 2:
            n.rect(x, base - 2, x + 2, base, 'W')
    for y in range(top + 4, base):
        n.set(xr, y, 'H')
    for x in range(xr - 1, xr + 3):
        n.set(x, top + 4, '=')
    n.repere(xr + 1, '*', ymin=top + 3)
    n.ennemis(xa + 2, xw - 2, lettres, 3, ymin=base - 3)
    n.ennemis(xw + 2, xb - 1, lettres, 2, ymin=yb - 2)
    n.ennemis(xw + 2, xb - 2, lettres, 1, ymin=base - 3)


def lac_gele(n, x0, largeur, lettres='a'):
    """Le lac gelé : une glace qui glisse sur trois rangées d'eau. Des trous dans la glace, tous les huit pas : qui glisse dedans
    tombe à l'eau et remonte par l'échelle du bord (la glace se casse aussi d'un coup de feu). Un médiator sous la glace."""
    base = n.base
    l0, l1 = x0 + 3, x0 + largeur - 3
    for x in range(l0, l1):
        n.set(x, base, 'G')
        for y in range(base + 1, base + 4):
            n.set(x, y, '~')
        n.set(x, base + 4, ';')
    trous = []
    x = l0 + 5
    while x + 3 <= l1 - 4:
        for y in range(base, base + 4):
            n.set(x + 1, y, '~')
            n.set(x, y, 'H')
            n.set(x + 2, y, 'H')
        trous.append(x)
        x += 8
    if len(trous) > 1:
        n.repere(trous[0] + 5, '+', ymin=base + 1)
    n.ennemis(l0, l1, lettres, 3, ymin=base - 2)


def butte_de_luge(n, x0, largeur, lettres='a', haut=7):
    """La butte de luge : un escalier de neige tassée (des marches de deux tuiles) jusqu'au sommet et son médiator, puis la piste
    de glace qui redescend de l'autre côté (des marches de trois tuiles) : on dévale sans pouvoir s'arrêter, droit sur ceux d'en
    bas."""
    base = n.base
    for k in range(haut):
        for x in range(x0 + 2 + 2 * k, x0 + 4 + 2 * k):
            for y in range(base - 1 - k, base):
                n.set(x, y, 'N')
    xs = x0 + 2 + 2 * haut
    for x in range(xs, xs + 4):
        for y in range(base - haut, base):
            n.set(x, y, 'N')
    x = xs + 4
    for k in range(haut - 1, 0, -1):
        for xx in range(x, min(x + 3, x0 + largeur)):
            for y in range(base - k + 1, base):
                n.set(xx, y, 'N')
            n.set(xx, base - k, 'G')
        x += 3
    n.repere(xs + 2, '+', ymin=base - haut - 1)
    n.ennemis(xs, xs + 4, lettres, 1, ymin=base - haut - 2)
    n.ennemis(x0 + 2, xs, lettres, 1, ymin=base - haut - 2)
    n.ennemis(x, x0 + largeur, lettres, 2)
