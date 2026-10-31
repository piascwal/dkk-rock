"""Les entrailles des massifs (le chantier du level design, à la manière de Broforce). Un niveau qui monte et descend laisse
sous ses plateaux et sous ses tours de grands blocs de roche pleins, sans rien à y faire. On y bâtit des complexes souterrains :

- des bunkers, construits comme les tours (voir blocs.py) mais sous la roche : un à quatre étages selon l'épaisseur du massif,
  de largeurs différentes, coupés en pièces, des échelles décalées d'un étage à l'autre ; plus garnis que les tours : deux à
  quatre gardes par étage, des caisses et des barils pour se couvrir, du butin à chaque étage, une cage au fond de chacun ;
- reliés deux à deux par des boyaux creusés dans la roche, qui partent d'un étage de l'un pour arriver à un autre étage du
  suivant : ils serpentent, montent et descendent d'une marche à la fois, gardés tout du long, et s'élargissent en poches où
  guette un garde près d'une arme, d'un médiator, d'un tonneau ou d'une cage ;
- entrés par le terrain : du fond des cuvettes et des grottes traversantes (voir plateaux.py), un boyau part au ras du sol vers
  le bunker voisin ; en suivant le chemin, on tombe dessus. Et aussi par des puits d'échelle depuis la surface (ou le
  rez-de-chaussée d'une tour) : le premier bunker de chaque massif en a un, les autres une fois sur deux.

Rien n'y est obligatoire : la surface ne change pas (le toit d'un bunker laisse trois rangées de terre au-dessus de lui), et le
chemin de tout le monde reste dehors. On ne creuse que la terre et la roche naturelles : les forts, les puits et les grottes des
modules restent tels quels.
"""
from blocs import ETAGE, place_libre, tour

BUNKER = (12, 23)  # la largeur d'un bunker
ENTRE = (8, 17)  # la roche entre deux bunkers, où passe le boyau
CHAMBRE = 3  # la hauteur d'un boyau (un héros en fait deux)
POCHES = ['*', '+', 'O', '%', '*', 'K']  # ce qu'on trouve au fond des poches des boyaux


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
        if 3 < x - xa < xb - xa - 6 and rng.random() < 0.16:  # une poche : plus haute, plus large, gardée, avec son butin
            for xx in range(x, x + 5):
                for y in range(f - CHAMBRE - 2, f):
                    _creuse(n, xx, y)
            n.pose_sur_sol(x + 1, rng.choice(lettres), f - CHAMBRE - 2)
            n.pose_sur_sol(x + 3, rng.choice(POCHES), f - CHAMBRE - 2)
        elif (x - xa) % 7 == 3 and x < xb - 2:  # des gardes tout le long
            n.pose_sur_sol(x, rng.choice(lettres), f - CHAMBRE)


def _strates(n, epaisseur=6):
    """Les couches du terrain suivent sa surface : `epaisseur` rangées de sous-sol sous chaque colonne, la roche profonde plus bas.
    Sinon la limite des couches reste à la hauteur du terrain de départ, d'un bout à l'autre du niveau, même sous les massifs qui
    ont monté : une veine de terre tendre qu'on creuse tout droit."""
    for x in range(n.w):
        for y in range(n.haut[x] + 1, n.bas + 6):
            if n.get(x, y) in (n.t['sous'], n.t['profond']):
                n.set(x, y, n.t['sous'] if y <= n.haut[x] + epaisseur else n.t['profond'])


def reseau(r, lettres='a'):
    """Les complexes souterrains de tous les massifs du niveau (voir en tête de fichier)."""
    n, rng = r.n, r.n.rng
    mat = n.t['mur']
    _strates(n)
    morceaux, toit = _massifs(n)
    tous = []
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
            # une cage au fond de chaque bunker, hors des embrasures et des trappes
            a0, b0 = b['x'], b['x'] + b['w']
            sol = b['g']
            for px in rng.sample(range(a0 + 2, b0 - 2), b0 - a0 - 4):
                if all(n.get(px, sol - k) == '.' for k in (1, 2, 3)) and n.get(px, sol) != 'H':
                    n.set(px, sol - 1, 'K')
                    break
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
        tous += bunkers
    _entrees(n, tous, toit, rng, lettres)


def _entrees(n, bunkers, toit, rng, lettres, portee=45, rampe=6):
    """Les complexes s'ouvrent sur les descentes : au fond d'une cuvette ou d'une grotte (les accès que ces modules notent dans
    `n.acces` : la colonne du bord, la rangée du fond, le côté où creuser), le sol plonge en marches (une rangée par colonne, sur
    `rampe` colonnes) dans un boyau qui passe sous les marches du bord, bien en dessous, et entre par une porte au rez-de-chaussée
    du bunker le plus proche de ce côté. En suivant le chemin, on tombe dessus : pas d'échelle."""
    for x, sol, cote in getattr(n, 'acces', []):
        proches = [b for b in bunkers if (b['x'] + b['w'] <= x if cote < 0 else b['x'] > x)]
        b = min(proches, key=lambda b: abs((b['x'] + b['w'] if cote < 0 else b['x']) - x), default=None)
        if not b or b['g'] < sol + rampe:
            continue
        mur = b['x'] + b['w'] - 1 if cote < 0 else b['x']
        bas = sol + rampe
        xa, ya, xb, yb = (mur + 1, b['g'], x - 1, bas) if cote < 0 else (x + 1, bas, mur - 1, b['g'])
        if not 4 <= xb - xa <= portee or abs(ya - yb) > xb - xa - 2:
            continue
        # la rampe : du fond, vers le bord, le sol descend d'une rangée par colonne (on y entre en marchant)
        for k in range(rampe + 1):
            cx = x - cote * (rampe - k)
            for y in range(sol + k - CHAMBRE, sol + k):
                if _naturel(n, n.get(cx, y)):
                    n.set(cx, y, ' ')
        n.rect(mur, b['g'] - 2, mur + 1, b['g'], ' ')  # la porte du rez-de-chaussée
        _boyau(n, xa, ya, xb, yb, toit, rng, lettres)
