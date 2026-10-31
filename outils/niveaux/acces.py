"""Tout ce qu'on voit doit pouvoir s'atteindre (docs/LEVEL-DESIGN.md) : le modèle d'accès du test (src/niveaux/accessibilite.ts,
le même héros d'une case de large et deux de haut : marcher, tomber, sauter de 2 cases vers le haut et 3 de côté, grimper aux
échelles, prendre les tyroliennes), et `relie_l_inaccessible`, qui relie par une courte échelle chaque endroit où l'on pourrait se
tenir mais où l'on n'arrive pas (une caverne, une pièce de bunker, l'étage d'une tour) à la case atteinte la plus proche, au-dessus
ou en dessous. Le relier par la topologie ne suffit pas : un passage d'une case de haut, une échelle qui s'arrête sous un plafond
trop bas ou au-dessus du vide laissent le héros dehors.
"""
from collections import deque

from peintre import SOLIDES

TRAVERSABLES = set('-=')
PLEINS = (SOLIDES - TRAVERSABLES) | {'%'}  # un baril se pose sur le sol : on bute contre lui
ECHELLES = set('HE')
# ce qu'une échelle ne doit jamais recouvrir : les repères, les ennemis, l'eau, les poteaux des tyroliennes, les pièges
INTOUCHABLES = set('@F!K*+&()$~|%123456789abcdefghijklmnopqrstuvwxyzYPZ')


def _tyroliennes(g, w, h):
    """Les poteaux de chaque tyrolienne d'un seul tenant, de gauche à droite (comme relieTyroliennes dans tyroliennes.ts)."""
    debuts = [(x, y) for y in range(h) for x in range(w) if g[y][x] == '(']
    bouts = [(x, y) for y in range(h) for x in range(w) if g[y][x] == ')']
    libres = [(x, y) for y in range(h) for x in range(w) if g[y][x] == '$']
    chaines = []
    for d in debuts:
        chaine, de = [d], d
        while True:
            cand = [b for b in bouts + libres if b[0] > de[0]]
            if not cand:
                break
            b = min(cand, key=lambda o: (o[0] - de[0]) ** 2 + (o[1] - de[1]) ** 2)
            chaine.append(b)
            if b not in libres:
                break
            libres.remove(b)
            de = b
        chaines.append(chaine)
    return chaines


def accessibles(n):
    """Les cases (x, y) où les pieds du héros peuvent se poser, depuis le départ (`@`), sans rien détruire."""
    g, w, h = n.g, n.w, n.h

    def plein(x, y):
        if x < 0 or x >= w:
            return True
        return 0 <= y < h and g[y][x] in PLEINS

    def libre(x, y):
        return y >= 1 and not plein(x, y) and not plein(x, y - 1)

    def echelle(x, y):
        return 0 <= x < w and 0 <= y < h and g[y][x] in ECHELLES

    def porte(x, y):
        if y + 1 >= h:
            return False
        dessous = g[y + 1][x]
        return dessous in SOLIDES or dessous == '%' or (dessous in ECHELLES and not echelle(x, y))

    def chute(x, y):
        for yy in range(y, h):
            if not libre(x, yy):
                return None
            if porte(x, yy) or echelle(x, yy):
                return (x, yy)
        return None

    depart = next(((x, y) for y in range(h) for x in range(w) if g[y][x] == '@'), None)
    vu = set()
    file = deque()

    def ajoute(p):
        if p and 0 <= p[0] < w and p not in vu:
            vu.add(p)
            file.append(p)

    if depart:
        ajoute(chute(*depart))
    chaines = _tyroliennes(g, w, h)
    while file:
        x, y = file.popleft()
        for d in (-1, 1):
            if libre(x + d, y):
                ajoute(chute(x + d, y))
            for hh in (1, 2):
                if not libre(x, y - hh):
                    break
                for dx in (1, 2, 3):
                    tx = x + d * dx
                    if not libre(tx, y - hh):
                        break
                    ajoute(chute(tx, y - hh))
                ajoute(chute(x, y - hh))
        if echelle(x, y) or echelle(x, y + 1):
            if libre(x, y - 1) and (echelle(x, y) or echelle(x, y - 1)):
                ajoute((x, y - 1))
            if libre(x, y + 1) and echelle(x, y + 1):
                ajoute((x, y + 1))
        for poteaux in chaines:
            for i, (px, py) in enumerate(poteaux):
                if abs(px - x) > 3 or not 0 <= y - py <= 3:
                    continue
                for j, (qx, qy) in enumerate(poteaux):
                    if j != i:
                        ajoute(chute(qx + (1 if j == 0 else -1 if j == len(poteaux) - 1 else 0), qy + 1))
    return vu, libre, porte


def _zones(debout, atteint):
    """Les endroits où l'on pourrait se tenir sans y arriver, regroupés (deux cases à moins de trois l'une de l'autre)."""
    loin = {p for p in debout - atteint if not any((p[0] + a, p[1] + b) in atteint for a in (-1, 0, 1) for b in (-1, 0, 1))}
    vu, zones = set(), []
    for p in sorted(loin):
        if p in vu:
            continue
        zone, file = [], deque([p])
        vu.add(p)
        while file:
            u = file.popleft()
            zone.append(u)
            for a in range(-3, 4):
                for b in range(-3, 4):
                    v = (u[0] + a, u[1] + b)
                    if v in loin and v not in vu:
                        vu.add(v)
                        file.append(v)
        zones.append(zone)
    return sorted(zones, key=len, reverse=True)


def _echelle_pour(n, zone, atteint, portee):
    """La plus courte échelle qui relie la zone à une case atteinte : (colonne, de, à), ou None. Vers le haut, elle part du sol de
    la zone et monte jusque sous une case atteinte (on descend par elle) ; vers le bas, du sol de la zone jusqu'à une case atteinte
    en dessous (on monte par elle)."""
    meilleure = None
    for x, y in zone:
        # vers le haut : la première case atteinte au-dessus, dans la colonne
        haut = next((y - k for k in range(2, min(portee, y)) if (x, y - k) in atteint), None)
        # vers le bas : la première case atteinte en dessous
        bas = next((y + k for k in range(2, portee) if (x, y + k) in atteint), None)
        for c in (range(haut + 1, y + 1) if haut else None, range(y + 1, bas + 1) if bas else None):
            if c is None or any(n.get(x, yy) in INTOUCHABLES or n.get(x, yy) == 'X' for yy in c):
                continue
            if meilleure is None or len(c) < len(meilleure[1]):
                meilleure = (x, c)
    return meilleure


def relie_l_inaccessible(n, taille=4, portee=24, tours=80):
    """Relie chaque zone inaccessible d'au moins `taille` cases par une courte échelle (au plus `portee` rangées), la plus grande
    d'abord ; on recalcule l'accès après chaque échelle (une échelle en ouvre souvent plusieurs)."""
    rate = set()
    for _ in range(tours):
        atteint, libre, porte = accessibles(n)
        debout = {(x, y) for y in range(1, n.h - 1) for x in range(n.w) if libre(x, y) and (porte(x, y) or n.g[y][x] in ECHELLES)}
        zones = [z for z in _zones(debout, atteint) if len(z) >= taille and min(z) not in rate]
        if not zones:
            return
        e = _echelle_pour(n, zones[0], atteint, portee)
        if e is None:
            rate.add(min(zones[0]))
            continue
        x, cases = e
        for y in cases:
            n.set(x, y, 'H')
