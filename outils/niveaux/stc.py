"""Saint-Cézaire-sur-Siagne (STC), village perché au bord de sa falaise au-dessus de la Siagne : le premier niveau. On part du
Clos, la maison des parents de JBT et son pré, on monte les restanques d'oliviers, on passe les remparts, la place de la fontaine
des Mulets et la mairie au château, les calades (les ruelles en escalier, sous leurs passages voûtés) et la chapelle Notre-Dame de
Sardaigne. Tout est en pierre calcaire (`{`) sous des toits de tuiles canal (`^`) ; les zones génériques (tour, forteresse, toits)
prennent la pierre du thème.

Les monuments sont posés à la main (la fontaine, le puits du Clos, le figuier...) ; la végétation (oliviers, cyprès, lavande) est
semée au hasard par le jeu autour d'eux (`semis` dans la définition du niveau).

Toutes les hauteurs se franchissent : une marche de deux tuiles se saute, au-delà il y a une échelle (contre une paroi, jamais
dans une rampe).
"""
from a_la_main import colonne, echelle, pose, toit

PIERRE, TOIT = '{', '^'


def maison(n, x0, largeur, etages=2, portes=(True, True)):
    """Une maison de village : murs de pierre, étages de cinq rangées (une dalle, une échelle qui change de côté à chaque étage),
    une porte au pied de chaque mur, un toit de tuiles à deux pentes qui déborde d'une tuile, et une échelle dehors, collée au
    mur de droite, pour monter au toit. Renvoie la rangée de l'égout du toit."""
    base = n.base
    haut = etages * 5
    top = base - haut
    n.rect(x0, top, x0 + largeur, base, '.')
    for y in range(top, base):
        n.set(x0, y, PIERRE)
        n.set(x0 + largeur - 1, y, PIERRE)
    for k in range(1, etages + 1):
        ys = base - k * 5
        for x in range(x0, x0 + largeur):
            n.set(x, ys, '=' if (x - x0) % 4 == 2 else PIERRE)
        if k < etages:  # la dernière dalle est le plafond : on monte au toit par dehors
            gx = x0 + 2 if k % 2 else x0 + largeur - 3
            for y in range(ys, base - (k - 1) * 5):
                n.set(gx, y, 'H')
    for x, ouverte in ((x0, portes[0]), (x0 + largeur - 1, portes[1])):
        if ouverte:
            n.rect(x, base - 2, x + 1, base, ' ')
    toit(n, x0 - 1, x0 + largeur + 1, top - 1)
    echelle(n, x0 + largeur + 1, haut + 1)
    return top - 1


def clos(n, x0, largeur, lettres='a'):
    """Le Clos, chez les parents de JBT : la maison (le local de répétition au rez-de-chaussée), puis le pré, son figuier, ses
    oliviers et son puits, fermé par un muret de pierres sèches qu'on enjambe."""
    base = n.base
    maison(n, x0 + 2, 12, etages=2)
    for nom, dx in (('enceinte34', 4), ('tonneau', 8)):  # le local de répétition
        pose(n, x0 + 2 + dx, nom, base, ecart=2)
    x = x0 + 18
    for nom in ('figuier', 'puits', 'olivier', 'lavande', 'olivier'):
        if pose(n, x, nom, base, ecart=3):
            x += 4
        x += 1
    n.set(x0 + largeur - 2, base - 1, PIERRE)  # le muret du pré
    n.ennemis(x0 + 18, x0 + largeur - 3, lettres, 1)


def restanques(n, x0, largeur, lettres='a', marches=3, haut=2):
    """Les restanques : des terrasses d'oliviers soutenues par des murets de pierres sèches, qui montent de `haut` tuiles à
    chaque marche puis redescendent ; un ennemi sur les plus hautes."""
    base = n.base
    w = max(4, (largeur - 2) // (2 * marches))
    x = x0 + 1
    hauteurs = [haut * (i + 1) for i in range(marches)]
    hauteurs += list(reversed(hauteurs[:-1]))
    terrasses = []
    for i, h in enumerate(hauteurs):
        for dx in range(w):
            colonne(n, x + dx, h, '#')
        # le muret, du côté de la pente : devant en montant, derrière en descendant
        mur = x if i < marches else x + w - 1
        colonne(n, mur, h, PIERRE)
        terrasses.append((x, h))
        x += w
    for x, h in terrasses:  # les oliviers et les ennemis, une fois toutes les terrasses montées
        pose(n, x + w // 2, 'olivier', base - h, ecart=3)
        if h >= haut * 2:
            n.ennemis(x + 1, x + w - 1, lettres, 1, ymin=base - h - 3)


def remparts(n, x0, largeur, haut=5, lettres='a'):
    """Les remparts du village : un mur épais de pierre, crénelé, qu'on monte par une échelle (ou en sautant contre lui), un
    chemin de ronde où veillent des ennemis ; de l'autre côté, on saute."""
    base = n.base
    x1 = x0 + 4
    x2 = min(x0 + largeur - 3, x1 + 6)
    n.rect(x1, base - haut, x2, base, PIERRE)
    for x in range(x1, x2, 2):  # les merlons
        n.set(x, base - haut - 1, PIERRE)
    echelle(n, x1 - 1, haut)
    n.ennemis(x1, x2, lettres, 1, ymin=base - haut - 3)
    n.ennemis(x2 + 1, x0 + largeur, lettres, 1)


def place(n, x0, largeur, lettres='a', caissons=True):
    """La place de la fontaine des Mulets : un pavé de pierre, la fontaine au milieu, des bancs et des lanternes ; les caissons
    de basses des fêtards empilés d'un côté ; au bout, la mairie, dans le château, sur trois étages."""
    base = n.base
    mairie = 13
    xm = x0 + largeur - mairie - 2
    for x in range(x0, xm):
        n.set(x, base, PIERRE)
    if caissons:
        for dx in (0, 1, 2):
            n.set(x0 + 4 + dx, base - 1, 'T')
        n.set(x0 + 5, base - 2, 'T')
    toit_mairie = maison(n, xm, mairie, etages=3)
    # le décor après les murs : rien ne se pose où une échelle ou un mur arrive ensuite
    milieu = (x0 + 8 + xm) // 2
    pose(n, milieu, 'fontaineMulets', base, ecart=4)
    for nom, dx in (('banc', -8), ('lanterne', -5), ('banc', 8), ('lanterne', 5), ('potGeranium', 11)):
        pose(n, milieu + dx, nom, base, ecart=2)
    n.repere(xm + mairie // 2, '+', ymin=toit_mairie - 8)
    n.ennemis(x0 + 8, xm - 1, lettres, 2)
    n.ennemis(xm + 1, xm + mairie - 1, lettres, 2, ymin=base - 15)


def calade(n, x0, largeur, lettres='a', haut=5):
    """Une calade : une ruelle en escalier (une marche d'une tuile tous les deux pas) qui monte sous un passage voûté (une
    maison jetée par-dessus la ruelle, son toit de tuiles), puis redescend ; une échelle, dehors, mène du haut de la descente au toit du passage."""
    base = n.base
    x = x0 + 2
    for k in range(1, haut + 1):  # la montée
        for dx in range(2):
            colonne(n, x + dx, k, PIERRE)
        x += 2
    palier = 8
    for dx in range(palier):
        colonne(n, x + dx, haut, PIERRE)
    # le passage voûté : trois rangées libres sur le palier, puis la maison et son toit
    voute = base - haut - 4
    n.rect(x, voute - 3, x + palier, voute + 1, PIERRE)
    toit(n, x - 1, x + palier + 1, voute - 4)
    # du haut de la descente au toit du passage : une échelle dehors, collée au mur, qui arrive à hauteur de l'égout
    echelle(n, x + palier + 1, base - haut - (voute - 4), sol=base - haut)
    n.repere(x + palier // 2, '*', ymin=voute - 8)
    n.ennemis(x + 1, x + palier - 2, lettres, 1, ymin=base - haut - 3)
    x += palier
    for k in range(haut, 0, -1):  # la descente
        for dx in range(2):
            colonne(n, x + dx, k, PIERRE)
        x += 2
    for dx in (0, 3):
        pose(n, x0 + dx + 1, 'potGeranium', base, ecart=2)
    n.ennemis(x, x0 + largeur, lettres, 1)


def chapelle(n, x0, largeur, lettres='a', cage=True):
    """La chapelle Notre-Dame de Sardaigne : une nef de pierre, romane, sous un toit de tuiles ; à gauche, son clocher-mur
    percé d'une baie ; une porte de chaque côté ; dedans, un membre du groupe en cage (ou un médiator)."""
    base = n.base
    w = min(largeur - 4, 16)
    xa = x0 + 2
    haut = 7
    top = base - haut
    n.rect(xa, top, xa + w, base, '.')
    for y in range(top, base):
        n.set(xa, y, PIERRE)
        n.set(xa + w - 1, y, PIERRE)
    for x in range(xa, xa + w):
        n.set(x, top, PIERRE)
    n.rect(xa, base - 2, xa + 1, base, ' ')
    n.rect(xa + w - 1, base - 2, xa + w, base, ' ')
    toit(n, xa + 2, xa + w + 1, top - 1)
    # le clocher-mur : deux tuiles de large, au-dessus du pignon gauche, percé d'une baie
    n.rect(xa - 1, top - 6, xa + 2, top, PIERRE)
    n.set(xa, top - 4, ' ')
    n.set(xa, top - 3, ' ')
    n.repere(xa + w // 2, 'K' if cage else '+', ymin=top + 1)
    n.ennemis(xa + 2, xa + w - 2, lettres, 2, ymin=top + 1)
    pose(n, xa + w + 2, 'croix', base, ecart=2)
