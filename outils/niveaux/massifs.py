"""Les entrailles des massifs (le chantier du level design, à la manière de Broforce). Un niveau qui monte et descend laisse
sous ses plateaux et sous ses tours de grands blocs de roche pleins, sans rien à y faire. On y bâtit des complexes souterrains :

- des bunkers, construits comme les tours (voir blocs.py) mais sous la roche : un à quatre étages selon l'épaisseur du massif,
  de largeurs différentes, coupés en pièces, des échelles décalées d'un étage à l'autre, des gardes, des caisses, du butin ;
- reliés deux à deux par des boyaux creusés dans la roche, qui partent d'un étage de l'un pour arriver à un autre étage du
  suivant : ils serpentent, montent et descendent d'une marche à la fois, s'élargissent en poches où guette un garde ;
- entrés par des puits d'échelle depuis la surface (ou le rez-de-chaussée d'une tour) : le premier bunker de chaque massif en a
  un, les autres une fois sur deux. On descend dans un bunker, on traverse, on file par un boyau et on ressort plus loin.

Rien n'y est obligatoire : la surface ne change pas (le toit d'un bunker laisse trois rangées de terre au-dessus de lui), et le
chemin de tout le monde reste dehors. On ne creuse que la terre et la roche naturelles : les forts, les puits et les grottes des
modules restent tels quels.
"""
from blocs import ETAGE, tour

BUNKER = (12, 23)  # la largeur d'un bunker
ENTRE = (8, 17)  # la roche entre deux bunkers, où passe le boyau
CHAMBRE = 3  # la hauteur d'un boyau (un héros en fait deux)


def _naturel(n, c):
    return c in (n.t['sol'], n.t['sous'], n.t['profond'], '#', 'R')


def _plein(n, x0, x1, y0, y1):
    return all(_naturel(n, n.get(x, y)) for x in range(x0, x1) for y in range(y0, y1))


def _massifs(n):
    """Les massifs : des colonnes voisines de terre pleine sur au moins 12 rangées (sous un module, la terre pleine commence plus
    bas : `toit` en garde la première rangée, colonne par colonne), moins une paroi de deux tuiles à chaque bord."""
    toit = [None] * n.w
    for x in range(n.w):
        toit[x] = next((y for y in range(n.haut[x] + 1, n.haut[x] + 12) if y + 12 < n.bas and _plein(n, x, x + 1, y, y + 12)), None)
    morceaux, x = [], 10
    while x < n.w - 10:
        if toit[x] is None:
            x += 1
            continue
        fin = x
        while fin < n.w - 10 and toit[fin] is not None:
            fin += 1
        if fin - x >= BUNKER[0] + 4:
            morceaux.append((x + 2, fin - 2))
        x = fin
    return morceaux, toit


def _creuse(n, x, y):
    if _naturel(n, n.get(x, y)):
        n.set(x, y, ' ')


def _boyau(n, xa, ya, xb, yb, toit, rng, lettres):
    """Un boyau de la colonne xa (son plancher à la rangée ya) à la colonne xb (plancher yb) : CHAMBRE rangées de haut, parfois
    une de plus, il serpente d'une marche à la fois (on le parcourt sans échelle) et s'élargit en poches où guette un garde."""
    f = ya
    for x in range(xa, xb + 1):
        reste = xb - x
        if abs(f - yb) >= reste and f != yb:  # il faut rejoindre la porte d'en face
            f += 1 if yb > f else -1
        elif rng.random() < 0.35:  # une marche au hasard, si on a encore le temps de rattraper
            essai = f + rng.choice((-1, 1))
            if abs(essai - yb) < reste and (toit[x] or 0) + 5 <= essai <= n.bas - 3:
                f = essai
        haut = CHAMBRE + (rng.random() < 0.2)
        for y in range(f - haut, f):
            _creuse(n, x, y)
        if 3 < x - xa < xb - xa - 5 and rng.random() < 0.08:  # une poche : plus haute, plus large, gardée
            for xx in range(x, x + 4):
                for y in range(f - CHAMBRE - 2, f):
                    _creuse(n, xx, y)
            n.pose_sur_sol(x + 2, rng.choice(lettres), f - CHAMBRE - 2)


def reseau(r, lettres='a'):
    """Les complexes souterrains de tous les massifs du niveau (voir en tête de fichier)."""
    n, rng = r.n, r.n.rng
    mat = n.t['mur']
    morceaux, toit = _massifs(n)
    for a, fin in morceaux:
        bunkers = []
        x = a + rng.randrange(0, 4)
        while fin - x >= BUNKER[0]:
            w = min(fin - x, rng.randrange(*BUNKER))
            top = max(t for t in toit[x : x + w] if t is not None) + 3
            etages = min(4, (n.bas - 3 - top) // ETAGE, 1 + rng.randrange(4))
            if etages >= 1 and _plein(n, x - 1, x + w + 1, top - 1, top + etages * ETAGE + 1):
                bunkers.append(dict(x=x, w=w, g=top + etages * ETAGE, etages=etages, pg=[], pd=[]))
            x += w + rng.randrange(*ENTRE)
        # deux bunkers voisins : un boyau d'un étage de l'un à un étage de l'autre
        liens = []
        for b1, b2 in zip(bunkers, bunkers[1:]):
            j1, j2 = rng.randrange(b1['etages']), rng.randrange(b2['etages'])
            b1['pd'].append(j1)
            b2['pg'].append(j2)
            liens.append((b1, j1, b2, j2))
        for i, b in enumerate(bunkers):
            top, ta, tb = tour(n, b['x'], b['w'], b['g'], b['etages'], mat, lettres, b['pg'], b['pd'], rng, butin=b['x'] // 5, dehors=False)
            if i == 0:
                n.repere(b['x'] + b['w'] // 2, 'K', ymin=b['g'] - ETAGE + 1)  # une cage au fond du premier bunker
            # le puits d'entrée, depuis la surface (ou le rez-de-chaussée d'une tour) jusqu'au dernier étage
            if i == 0 or rng.random() < 0.5:
                plancher = b['g'] - (b['etages'] - 1) * ETAGE
                for px in rng.sample(range(ta + 2, tb - 2), max(0, tb - ta - 4)):
                    if n.get(px, n.haut[px] - 1) in ' .' and n.get(px, n.haut[px] - 2) in ' .':
                        for y in range(n.haut[px], plancher):
                            n.set(px, y, 'H')
                        break
        for b1, j1, b2, j2 in liens:
            ya, yb = b1['g'] - j1 * ETAGE, b2['g'] - j2 * ETAGE
            _boyau(n, b1['x'] + b1['w'], ya, b2['x'] - 1, yb, toit, rng, lettres)
