"""Les structures propres à chaque monde : ce qu'on ne trouve que dans un seul niveau, pour que chacun ait sa géométrie et pas
seulement ses couleurs. Le garage a son parking à étages, les alpages leur falaise à corniches, les cimes leur glacier, la plage
son ponton et son phare, la ville ses toits. Chacune garde un chemin (le test d'accessibilité de tests/niveaux.test.ts le vérifie).
"""
from verrous import trou


def parking(n, x0, largeur, lettres='a', mat='D'):
    """Un parking à étages : on monte par une rampe en escalier sur un premier niveau (6 de haut), on redescend de l'autre côté.
    Dessous, un local de garage (caisses, caissons, une cage) où l'on entre par un tunnel percé dans la rampe de descente ;
    dessus, par une échelle, un second niveau de pitons avec un médiator."""
    base = n.base
    for i in range(12):  # la montée : une marche toutes les deux colonnes
        for k in range(i // 2 + 1):
            n.set(x0 + 2 + i, base - 1 - k, mat)
    xd0, xd1 = x0 + 14, x0 + largeur - 14
    top = base - 6
    n.rect(xd0, top, xd1, base, '.')  # le local, sous la dalle
    for x in range(xd0, xd1):
        n.set(x, top, '=' if (x - xd0) % 4 == 2 else mat)
    for i in range(12):  # la descente, percée d'un tunnel d'accès au local
        for k in range(6 - i // 2):
            n.set(xd1 + i, base - 1 - k, mat)
    for i in range(12):
        n.set(xd1 + i, base - 1, ' ')
        n.set(xd1 + i, base - 2, ' ')
    # le local : un fouillis de garage, un escadron, une cage
    n.set(xd0 + 2, base - 1, 'C')
    n.set(xd0 + 3, base - 1, 'C')
    n.set(xd0 + 3, base - 2, 'C')
    n.set(xd1 - 3, base - 1, 'T')
    n.repere(xd0 + (xd1 - xd0) // 2, 'K', ymin=base - 5)
    n.ennemis(xd0 + 1, xd1 - 1, lettres, 2, ymin=base - 5)
    # le second niveau : une échelle depuis la dalle, des pitons, un médiator
    for y in range(base - 12, base - 6):
        n.set(xd0 + 2, y, 'H')
    for x in range(xd0 + 1, xd1 - 1):
        n.set(x, base - 12, '=')
    n.repere(xd0 + 5, '+', ymin=base - 13)
    n.ennemis(xd0, xd1, lettres, 2, ymin=base - 7)


def falaise(n, x0, largeur, lettres='a', mat='R'):
    """Une falaise de 16 tuiles qu'on gravit par des corniches de pitons reliées par des échelles en zigzag. À mi-hauteur, une porte
    donne sur une grotte creusée dans la roche (une cage). Au sommet, un plateau gardé et un médiator ; on redescend par l'échelle de
    l'autre côté (ou en sautant)."""
    base = n.base
    haut = 16
    xm = x0 + 7
    w = largeur - 15
    n.rect(xm, base - haut, xm + w, base, mat)
    for k in (1, 2, 3):
        y = base - 4 * k
        for x in range(xm - 4, xm):
            n.set(x, y, '=')
        gx = xm - 4 if k % 2 else xm - 1
        for yy in range(y, y + 4):
            n.set(gx, yy, 'H')
    for y in range(base - haut, base - 12):  # la dernière échelle jusqu'au plateau
        n.set(xm - 1, y, 'H')
    n.rect(xm, base - 10, xm + 1, base - 8, ' ')  # la porte de la grotte, au niveau de la deuxième corniche
    n.rect(xm + 1, base - 12, xm + 9, base - 8, '.')
    n.repere(xm + 5, 'K', ymin=base - 12)
    n.ennemis(xm + 1, xm + 9, lettres, 2, ymin=base - 12)
    n.ennemis(xm, xm + w, lettres, 2, ymin=base - haut - 1)
    n.repere(xm + w // 2, '*', ymin=base - haut - 1)
    for y in range(base - haut, base):  # la descente
        n.set(xm + w, y, 'H')
    n.ennemis(xm + w + 1, x0 + largeur - 1, lettres, 1)


def glacier(n, x0, largeur, lettres='y', nb=3):
    """Un glacier : trois bosses de glace qui glisse, séparées par des crevasses étroites (échelle à chaque bord, un palier au
    fond), puis un igloo qu'on traverse (une porte à chaque bout) et où attend un médiator."""
    base = n.base
    x = x0 + 2
    for w, hmax in ((8, 2), (9, 4), (8, 3))[:nb]:
        for i in range(w):
            h = min(hmax, min(i, w - 1 - i) // 2 + 1)
            for k in range(h):
                n.set(x + i, base - 1 - k, 'G' if k == h - 1 else 'N')
        n.ennemis(x + 1, x + w - 1, lettres, 1, ymin=base - hmax - 2)
        x += w
        trou(n, x, 3)
        n.ennemis(x + 3, x + 6, lettres, 1)
        x += 5
    # l'igloo
    n.rect(x, base - 5, x + 10, base, 'N')
    n.rect(x + 1, base - 4, x + 9, base, '.')
    n.rect(x, base - 2, x + 1, base, ' ')
    n.rect(x + 9, base - 2, x + 10, base, ' ')
    for dx in (3, 6):
        n.set(x + dx, base - 3, 'V')
    n.repere(x + 5, '+', ymin=base - 4)
    n.ennemis(x + 1, x + 9, lettres, 2, ymin=base - 4)


def ponton(n, x0, largeur, lettres='a', mat='W'):
    """Un ponton sur l'eau : une brèche de 24 tuiles qu'on franchit de planche en planche (des segments de pitons de trois tuiles,
    à des hauteurs qui varient, séparés d'un vide à sauter), sur des pilotis ; de l'autre côté, un phare de trois étages."""
    base = n.base
    g0 = x0 + 3
    g1 = g0 + 24
    for x in range(g0, g1):
        for y in range(base, n.h):
            n.set(x, y, ' ')
    for k in range(5):
        sx = g0 + 1 + 5 * k
        ligne = base + (-1 if k % 2 else 0)
        for dx in range(3):
            n.set(sx + dx, ligne, '=')
        for y in range(ligne + 1, ligne + 4):  # les pilotis
            n.set(sx + 1, y, mat)
    n.ennemis(g0 + 6, g0 + 14, lettres, 1, ymin=base - 3)
    n.ennemis(g0 + 15, g0 + 23, lettres, 1, ymin=base - 3)
    n.repere(g0 + 11, '*', ymin=base - 3)
    top = n.tour(g1 + 4, 9, 3, mat)
    n.repere(g1 + 8, '+', ymin=top - 1)
    n.ennemis(g1 + 5, g1 + 12, lettres, 2, ymin=base - 5)
    n.ennemis(g1 + 5, g1 + 12, lettres, 1, ymin=top - 1)
    n.ennemis(x0, g0, lettres, 1)


def toits(n, x0, largeur, lettres='a', mat='D'):
    """Trois immeubles sur pilotis (le chemin passe dessous), de hauteurs différentes : on monte par une échelle sur le premier
    toit, on saute de toit en toit (deux tuiles de vide), on redescend par l'échelle du troisième. Des antennes de pitons, des
    fenêtres, un médiator sur le deuxième toit et une cage sur le dernier."""
    base = n.base
    tops = (base - 8, base - 10, base - 8)
    x = x0 + 3
    for i, top in enumerate(tops):
        w = 10
        n.rect(x, top, x + w, base - 3, mat)
        for dx in range(w):
            if dx % 4 == 2:
                n.set(x + dx, top, '=')
        for dx in (2, 5, 8):
            for y in range(top + 2, base - 4, 3):
                n.set(x + dx, y, 'V')
        n.ennemis(x + 1, x + w - 1, lettres, 1 + (i == 1), ymin=top - 1)
        if i == 1:
            n.repere(x + 5, '+', ymin=top - 1)
        if i == 2:
            n.repere(x + 5, 'K', ymin=top - 1)
        x += w + 2
    for y in range(tops[0], base):  # l'échelle d'accès, devant le premier immeuble
        n.set(x0 + 2, y, 'H')
    for y in range(tops[2], base):  # l'échelle de descente, derrière le dernier
        n.set(x - 2 + 0, y, 'H')
    n.ennemis(x0, x, lettres, 2)


def scene(n, x0, largeur, lettres='a', mat='D'):
    """La scène d'un club : une estrade de deux tuiles (une marche de chaque côté) avec deux caissons de basses à ses extrémités,
    et au-dessus un portique de pitons (les projecteurs), gagné par une échelle depuis l'estrade : une arme y attend. Des
    danseurs sur l'estrade, des gardes devant."""
    base = n.base
    xs = x0 + 7
    w = min(18, largeur - 16)
    n.rect(xs - 2, base - 1, xs, base, mat)  # les marches
    n.rect(xs + w, base - 1, xs + w + 2, base, mat)
    n.rect(xs, base - 2, xs + w, base, mat)  # l'estrade
    n.set(xs + 1, base - 3, 'T')
    n.set(xs + w - 2, base - 3, 'T')
    for x in range(xs + 1, xs + w - 1):  # le portique des projecteurs
        n.set(x, base - 9, '=')
    for y in range(base - 9, base - 2):
        n.set(xs + 3, y, 'H')
    n.repere(xs + w // 2 + 2, '*', ymin=base - 10)
    n.ennemis(xs + 3, xs + w - 3, lettres, 2, ymin=base - 4)
    n.ennemis(xs + 3, xs + w - 3, lettres, 1, ymin=base - 10)
    n.ennemis(x0 + 1, xs - 3, lettres, 1)
    n.ennemis(xs + w + 3, x0 + largeur - 1, lettres, 1)
