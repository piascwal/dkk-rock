"""Les entrailles des massifs (le chantier du level design, à la manière de Broforce). Un niveau qui monte et descend laisse
sous ses plateaux et sous ses tours de grands blocs de roche pleins, sans rien à y faire. On y bâtit des complexes souterrains :

- des bunkers, construits comme les tours (voir blocs.py) mais sous la roche : un à quatre étages selon l'épaisseur du massif,
  de largeurs différentes, coupés en pièces, des échelles décalées d'un étage à l'autre ; plus garnis que les tours : deux à
  quatre gardes par étage, des caisses et des barils pour se couvrir, du butin à chaque étage, une cage au fond de chacun ;
- une seconde rangée de bunkers plus bas quand le massif est épais (une courte échelle à travers la roche les relie à ceux du
  dessus), et des cavernes dans la roche qui reste pleine : pas de grande étendue de pierre sans rien ;
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
ENTRE = (5, 10)  # la roche entre deux bunkers, où passe le boyau
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
            # les deux étages les plus proches en hauteur : le boyau doit pouvoir les relier (une marche par colonne au plus)
            j1, j2 = min(((i, j) for i in range(b1['etages']) for j in range(b2['etages'])),
                         key=lambda p: (abs((b1['g'] - p[0] * ETAGE) - (b2['g'] - p[1] * ETAGE)), rng.random()))
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
            if True:  # chaque bunker a son puits (le boyau vers le voisin n'est qu'un chemin de plus)
                plancher = b['g'] - (b['etages'] - 1) * ETAGE
                for px in rng.sample(range(ta + 2, tb - 2), max(0, tb - ta - 4)):
                    if n.get(px, n.haut[px] - 1) in ' .' and n.get(px, n.haut[px] - 2) in ' .':
                        for y in range(n.haut[px], plancher):
                            n.set(px, y, 'H')
                        break
        for b1, j1, b2, j2 in liens:
            ya, yb = b1['g'] - j1 * ETAGE, b2['g'] - j2 * ETAGE
            _boyau(n, b1['x'] + b1['w'], ya, b2['x'] - 1, yb, toit, rng, lettres)
        tous += bunkers + _rangee_profonde(n, bunkers, toit, rng, lettres, mat)
    _entrees(n, tous, toit, rng, lettres)
    _ouvertures(n, rng, lettres)
    _cavernes(n, rng, lettres)
    _relie_les_isoles(n)


def _rangee_profonde(n, dessus, toit, rng, lettres, mat):
    """Sous les bunkers, quand le massif est assez épais, une seconde rangée : chaque bunker profond est relié à celui du dessus par
    une courte échelle à travers la roche (de son rez-de-chaussée au dernier étage du profond), et à son voisin profond par un
    boyau. Pas de roche pleine sous les complexes."""
    profonds = []
    for b in dessus:
        top = b['g'] + 3
        etages = min(3, (n.bas - 3 - top) // ETAGE)
        x, w = b['x'] + rng.randrange(-3, 4), b['w']
        if etages < 1 or not _plein(n, x - 1, x + w + 1, top - 1, top + etages * ETAGE + 1):
            continue
        p = dict(x=x, w=w, g=top + etages * ETAGE, etages=etages, pg=[], pd=[])
        profonds.append((b, p))
    for (_, p1), (_, p2) in zip(profonds, profonds[1:]):
        p1['pd'].append(0)
        p2['pg'].append(0)
    for b, p in profonds:
        tour(n, p['x'], p['w'], p['g'], p['etages'], mat, lettres, p['pg'], p['pd'], rng, butin=p['x'] // 3, dehors=False)
        # la courte échelle : du rez-de-chaussée du bunker du dessus au dernier étage du profond, là où ils se recouvrent
        a, z = max(b['x'], p['x']) + 2, min(b['x'] + b['w'], p['x'] + p['w']) - 2
        if z > a:
            ex = rng.randrange(a, z)
            for y in range(b['g'] - 1, p['g'] - (p['etages'] - 1) * ETAGE):
                n.set(ex, y, 'H')
    for (_, p1), (_, p2) in zip(profonds, profonds[1:]):
        _boyau(n, p1['x'] + p1['w'], p1['g'], p2['x'] - 1, p2['g'], toit, rng, lettres)
    return [p for _, p in profonds]


def _cavernes(n, rng, lettres, largeur=18, hauteur=9, portee=40):
    """Ce qui reste de roche pleine sous la surface (des blocs de `largeur` × `hauteur`) devient des cavernes : un plafond
    irrégulier, des corniches de pitons, des gardes, du butin ; un boyau part de leur flanc vers le creux le plus proche (une porte
    s'ouvre si c'est le mur d'un bunker). Partout, de l'action."""
    for y0 in range(8, n.bas - hauteur - 1, 4):
        for x0 in range(12, n.w - largeur - 12, 6):
            # de la roche pleine tout autour, et trois rangées au-dessus : on ne creuse jamais sous des marches ou un plancher
            if y0 < max(n.haut[x0 : x0 + largeur]) + 4 or not _plein(n, x0 - 2, x0 + largeur + 2, y0 - 3, y0 + hauteur + 1):
                continue
            sol = y0 + hauteur - 2
            h = 4
            for x in range(x0 + 1, x0 + largeur - 1):
                h = max(3, min(hauteur - 3, h + rng.choice((-1, 0, 1))))
                for y in range(sol - h, sol):
                    n.set(x, y, ' ')
            for x in range(x0 + 6, x0 + 10):
                if n.get(x, sol - 4) == ' ' and n.get(x, sol - 5) == ' ':
                    n.set(x, sol - 3, '=')
            n.ennemis(x0 + 2, x0 + largeur - 2, lettres, 3, ymin=sol - h - 1)
            n.pose_sur_sol(x0 + largeur - 4, rng.choice(POCHES), sol - 3)
            # le boyau vers le creux le plus proche, à gauche ou à droite, au niveau du sol
            for pas, depart in ((-1, x0), (1, x0 + largeur - 1)):
                x = depart + pas
                for _ in range(portee):
                    c = n.get(x, sol - 1)
                    if c in ' .' and n.get(x, sol - 2) in ' .':
                        break
                    if not _naturel(n, c):  # le mur d'un bunker : une porte
                        if c != 'X':
                            n.set(x, sol - 1, '.')
                            n.set(x, sol - 2, '.')
                        break
                    if not _naturel(n, n.get(x, sol - CHAMBRE - 1)):  # on percerait un sol par en dessous : on s'arrête
                        break
                    for y in range(sol - CHAMBRE, sol):
                        _creuse(n, x, y)
                    x += pas
                else:
                    continue
                break
            else:
                # aucun boyau n'a trouvé de creux : une échelle à travers la roche, du fond de la caverne jusqu'au premier creux
                # au-dessus de son plafond (une trappe dans le sol d'en haut, s'il le faut)
                ex = x0 + largeur // 2
                creux = next((yy for yy in range(sol - h - 1, max(0, sol - h - 30), -1) if n.get(ex, yy) in ' .'), None)
                if creux is not None:
                    for yy in range(creux, sol):
                        n.set(ex, yy, 'H')


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


def _ouvertures(n, rng, lettres, portee=50):
    """Les ouvertures percées dans la paroi des remontées (plateaux.cuvette : la colonne, la rangée du sol, le côté) : le boyau
    continue à l'horizontale dans la roche, jusqu'au premier creux (une pièce, un boyau, une caverne) ; le mur d'un bunker reçoit
    une porte. On y entre en marchant, sans échelle. S'il ne trouve rien, il finit sur une poche (un garde, du butin)."""
    for x, sol, pas in getattr(n, 'ouvertures', []):
        for _ in range(portee):
            if all(n.get(x, y) in ' .' for y in (sol - 1, sol - 2)):
                break
            c = n.get(x, sol - 1)
            if c not in ' .' and not _naturel(n, c):  # le mur d'un bunker : une porte
                if c != 'X':
                    n.set(x, sol - 1, '.')
                    n.set(x, sol - 2, '.')
                break
            for y in range(sol - CHAMBRE, sol):
                _creuse(n, x, y)
            x += pas
        else:
            n.ennemis(x - 6 * pas, x, lettres, 1, ymin=sol - 4)
            n.pose_sur_sol(x - 2 * pas, rng.choice(POCHES), sol - 3)


def _relie_les_isoles(n, taille=10, portee=40):
    """Aucun creux sans issue : on remplit depuis le ciel tout ce qui communique (le vide, les pièces, les échelles, les repères) ;
    chaque creux qui reste isolé (plus de `taille` cases) est relié, par une échelle à travers la roche depuis son point le plus
    haut, au premier creux relié au-dessus (`portee` rangées au plus)."""
    from collections import deque
    from peintre import SOLIDES

    passe = lambda c: c not in SOLIDES or c in '-='
    relie = [[False] * n.w for _ in range(n.h)]

    def remplit(depart):
        file = deque(depart)
        for x, y in depart:
            relie[y][x] = True
        while file:
            x, y = file.popleft()
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < n.w and 0 <= ny < n.h and not relie[ny][nx] and passe(n.g[ny][nx]):
                    relie[ny][nx] = True
                    file.append((nx, ny))

    remplit([(x, 0) for x in range(n.w) if passe(n.g[0][x])])
    for y0 in range(n.h):
        for x0 in range(n.w):
            if relie[y0][x0] or not passe(n.g[y0][x0]):
                continue
            # le creux isolé : ses cases, et la plus haute
            vu, file, cases = {(x0, y0)}, deque([(x0, y0)]), []
            while file:
                x, y = file.popleft()
                cases.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < n.w and 0 <= ny < n.h and (nx, ny) not in vu and not relie[ny][nx] and passe(n.g[ny][nx]):
                        vu.add((nx, ny))
                        file.append((nx, ny))
            if len(cases) <= taille:
                continue
            ex, ey = min(cases, key=lambda p: (p[1], p[0]))
            haut = next((y for y in range(ey - 1, max(0, ey - portee), -1) if relie[y][ex]), None)
            if haut is None:
                continue
            for y in range(haut, ey + 1):
                n.set(ex, y, 'H')
            remplit(cases + [(ex, y) for y in range(haut, ey + 1)])
