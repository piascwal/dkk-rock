"""Les verrous verticaux : des obstacles qui obligent à monter (barrage) ou à descendre (gouffre), et les salles de
combat souterraines. Sans eux, on traverse un niveau en ligne droite sans jamais lever ni baisser le regard.

Un verrou ne bloque jamais le niveau : il y a toujours un chemin (échelles scellées, planches, tyrolienne) et le test
d'accessibilité de tests/niveaux.test.ts le vérifie.
"""


def barrage(n, x0, haut=12, lettres='a', tyro=0, butin='*'):
    """Un mur incassable, haut de `haut` tuiles (multiple de 4), qui coupe aussi la galerie : on ne le contourne pas.

    À gauche, un échafaudage (planches tous les 4 rangs, échelles en alternance, des ennemis sur chaque planche) mène
    au sommet du mur ; de l'autre côté, une échelle (et, si `tyro`, une tyrolienne de `tyro` tuiles) ramène au sol.
    Renvoie (x du mur, rangée du sommet) : le mur est à reposer après le creusement des galeries.
    """
    largeur = 9
    top = n.base - haut
    ys = n.echafaudage(x0, largeur, haut // 4)
    xw = x0 + largeur
    n.rect(xw, top, xw + 3, n.h, 'X')
    for y in range(top, n.base):  # l'échelle de descente, collée au mur
        n.set(xw + 3, y, 'H')
    for y in ys:
        n.ennemis(x0 + 2, xw - 1, lettres, 1, ymin=y - 1)
    n.ennemis(xw, xw + 3, lettres, 1, ymin=top - 1)  # un garde sur le mur
    n.repere(xw + 1, butin, ymin=top - 1)
    if tyro:
        n.tyro(xw + 1, top - 1, xw + 3 + tyro, n.base - 5)
    return xw, top


def trou(n, x0, largeur, base=None):
    """Le creux du gouffre : du sol à la galerie, une échelle à chaque bord, une petite plate-forme au fond.
    (Reposé à la fin du creusement des galeries, qui pourraient l'avoir entamé ; `base` : le sol d'alors.)"""
    base = n.base if base is None else base
    for x in range(x0, x0 + largeur):
        for y in range(base, n.yg + 1):
            n.set(x, y, ' ')
        for y in (n.yg + 1, n.yg + 2):
            if n.get(x, y) == ' ':
                n.set(x, y, n.t['profond'])
    for x in (x0, x0 + largeur - 1):
        for y in range(base, n.yg + 1):
            n.set(x, y, 'H')
    for x in range(x0 + largeur // 2 - 1, x0 + largeur // 2 + 2):
        n.set(x, n.yg - 2, '=')


def gouffre(n, x0, largeur=12, lettres='a', nb=4):
    """Un trou jusqu'à la galerie, trop large pour être sauté : on descend par une échelle, on traverse la galerie
    (une zone de combat) et on remonte de l'autre côté. Pas de piton : c'est le seul chemin."""
    trou(n, x0, largeur)
    n.ennemis(x0 + 2, x0 + largeur - 2, lettres, nb, ymin=n.yg - 1)
    n.repere(x0 + largeur // 2, '+', ymin=n.yg - 3)


def bunker(n, x, largeur, lettres, nb, butin):
    """Une salle haute dans la galerie, tenue par un escadron : deux balcons de pitons, des caissons explosifs au
    centre, le butin (une cage, une arme, un médiator) sur le balcon du fond."""
    yg = n.yg
    n.rect(x, yg - 7, x + largeur, yg + 1, ' ')
    for yy in (yg + 1, yg + 2):
        for xx in range(x, x + largeur):
            if n.get(xx, yy) == ' ':
                n.set(xx, yy, n.t['profond'])
    for xx in range(x + 2, x + 8):
        n.set(xx, yg - 3, '=')
    for xx in range(x + largeur - 8, x + largeur - 2):
        n.set(xx, yg - 4, '=')
    for yy in range(yg - 3, yg + 1):  # une échelle pour monter sur le balcon de gauche
        n.set(x + 8, yy, 'H')
    for yy in range(yg - 4, yg + 1):
        n.set(x + largeur - 9, yy, 'H')
    mid = x + largeur // 2
    if 'T' in n.t['deco']:
        for dx in (-1, 0, 1):
            n.set(mid + dx, yg - 1, 'T')
    n.ennemis(x + 1, x + largeur - 1, lettres, nb, ymin=yg - 7)
    n.repere(x + largeur - 5, butin, ymin=yg - 6)


def patrouilles(n, x0, x1, lettres, pas=16):
    """Des ennemis tout au long de la galerie, un petit groupe tous les `pas` colonnes."""
    x = x0
    while x < x1:
        n.ennemis(x, min(x1, x + pas), lettres, 1 + (n.rng.random() < 0.5), ymin=n.yg - 1)
        x += pas
