"""Des idées prises à Broforce (le chantier du level design, voir src/niveaux/refontes.ts) :

- `plateau_caverne` : le terrain monte d'un coup, bien plus haut que la rue ; au ras du sol, on entre dans une vaste caverne
  creusée sous le plateau (un plafond irrégulier, des piliers de roche, des corniches, des gardes, du butin, une cage). On choisit :
  grimper sur le plateau par les corniches de sa face, ou s'enfoncer dans la caverne. Le sol continue à la même hauteur après lui ;
- `miradors` : une étendue de terrain dégagé où se dressent des miradors sur pilotis, un guetteur sur chacun, une échelle le long
  d'un pied ; on s'y bat à découvert, et l'on passe sous eux sans détour ;
- `cuvette` : le sol s'ouvre sur une large cuvette, bien trop large pour être sautée, sans pont : on y descend par des escaliers
  taillés dans le terrain (pas d'échelle), on se bat au fond (un fortin, des gardes sur les marches, du butin, une cage) et l'on
  remonte en face par d'autres marches. La verticalité vers le bas, imposée par le terrain et non par un mur ;
- `grotte_traversante` : la même descente, mais sous un massif : en allant tout droit, on entre dans une grotte au ras du sol,
  le sol descend en marches et l'on se retrouve sous terre, sans avoir pris d'échelle.
Au fond des cuvettes et des grottes, des boyaux partent vers les complexes souterrains voisins (voir massifs.py).
"""
from blocs import tour

PROPS = ['C', '%', 'T', 'O', 'C', '%']


def plateau_caverne(n, x0, largeur, monte=11, lettres='a', butin='*'):
    """Un plateau de `monte` rangées au-dessus du sol sur [x0 + 3, x0 + largeur - 3), creusé au ras du sol d'une caverne qui le
    traverse de part en part ; des corniches en zigzag sur la face de gauche mènent au sommet. `base` ne change pas."""
    rng = n.rng
    base = n.base
    a, b = x0 + 3, x0 + largeur - 3
    top = base - monte
    for x in range(a, b):
        n.base_col(x, top)
    # la caverne : de 4 à 7 rangées de haut, le plafond monte et descend d'une rangée à la fois, toujours deux rangées de roche
    # au-dessus ; des piliers de roche de place en place
    h = 5
    for x in range(a, b):
        h = max(4, min(monte - 3, 7, h + rng.choice((-1, 0, 0, 1))))
        if a + 6 < x < b - 6 and rng.random() < 0.06:
            continue  # un pilier : la roche reste du sol au plafond
        for y in range(base - h, base):
            n.set(x, y, ' ')
    for x in range(a, b):  # au fond, le sol reste plein (pas de trou dans la caverne)
        if n.get(x, base) == ' ':
            n.set(x, base, n.t['sous'])
    # des corniches de pitons en hauteur, où se tient un garde ; des caisses et des barils pour se couvrir ; du butin et une cage
    for _ in range(max(1, (b - a) // 16)):
        cx = rng.randrange(a + 4, b - 8)
        if all(n.get(x, base - 4) == ' ' and n.get(x, base - 5) == ' ' for x in range(cx, cx + 4)):
            for x in range(cx, cx + 4):
                n.set(x, base - 3, '=')
            n.ennemis(cx, cx + 4, lettres, 1, ymin=base - 6)
    for k in range(max(2, (b - a) // 10)):
        px = rng.randrange(a + 2, b - 2)
        if n.get(px, base - 1) == ' ' and n.get(px, base - 2) == ' ':
            n.set(px, base - 1, PROPS[k % len(PROPS)])
    n.ennemis(a + 2, b - 2, lettres, 2 + (b - a) // 10, ymin=base - 7)
    n.repere(rng.randrange(a + 3, b - 3), butin, ymin=base - 7)
    n.repere(rng.randrange(a + 3, b - 3), 'K', ymin=base - 7)
    # l'échelle de la face de gauche, du sol au sommet, et des gardes là-haut
    _corniches(n, a, base, top, lettres)
    n.ennemis(a + 3, b - 2, lettres, 2, ymin=top - 3)
    n.repere(b - 4, '+', ymin=top - 3)


def _corniches(n, a, base, top, lettres):
    """La face d'un massif (sa première colonne : a) se gravit par des corniches de pitons en zigzag devant elle : quatre rangées
    entre deux, une courte échelle chaque fois, un garde sur chacune ; jamais une longue échelle dans le vide."""
    sol, k = base, 0
    while sol - 4 > top:
        y = sol - 4
        for x in range(a - 4, a):
            n.set(x, y, '=')
        ex = a - 4 if k % 2 else a - 1
        for yy in range(y, sol):
            n.set(ex, yy, 'H')
        n.ennemis(a - 4, a, lettres, 1, ymin=y - 2)
        sol, k = y, k + 1
    for yy in range(top, sol):
        n.set(a - 1, yy, 'H')


def miradors(n, x0, largeur, lettres='a'):
    """Du terrain dégagé et des miradors sur pilotis (un tous les 12 environ) : une plate-forme de cinq tuiles à six rangées du sol,
    un toit, une échelle pour pied et un poteau (on passe dessous) ; un guetteur en haut, des gardes en bas. `base` ne change pas."""
    rng = n.rng
    base = n.base
    x = x0 + 3
    while x + 7 <= x0 + largeur - 2:
        haut = base - rng.randrange(5, 8)
        for y in range(haut, base):  # les deux pieds : une échelle, et un poteau en arrière-plan (on passe dessous, sans détour)
            n.set(x, y, 'H')
            n.set(x + 4, y, '.')
        for xx in range(x - 1, x + 6):  # la plate-forme et le toit
            n.set(xx, haut, 'W')
            n.set(xx, haut - 4, '^')
        n.set(x - 1, haut - 1, '=')  # le garde-corps
        n.set(x + 5, haut - 1, '=')
        n.set(x, haut, 'H')  # l'échelle traverse la plate-forme : on y monte
        n.ennemis(x + 2, x + 4, lettres, 1, ymin=haut - 3)
        x += rng.randrange(11, 15)
    n.ennemis(x0 + 2, x0 + largeur - 2, lettres, 2, ymin=base - 3)


def _profil(prof, pente, paliers):
    """La descente d'une cuvette, colonne par colonne : la profondeur de chaque colonne sous le bord. `pente` colonnes par rangée
    (1 : raide, à sauter de marche en marche ; 3 : douce) ; `paliers` : toutes les `paliers` rangées, un replat de cinq colonnes
    où se tient un garde. Une marche ne fait jamais plus d'une rangée : on remonte toujours en sautant."""
    cols, d = [], 0
    while d < prof:
        d += 1
        cols += [d] * pente
        if paliers and d % paliers == 0 and d < prof:
            cols += [d] * 5
    return cols


def cuvette(n, x0, largeur, profondeur=14, lettres='a', pente=2, pente_d=None, paliers=0, fortin=True, bateau=False, ouverture=True):
    """Une cuvette de `profondeur` rangées sur [x0 + 2, x0 + largeur - 2), sans pont : on y descend par des marches taillées dans le
    terrain et l'on remonte en face, le fond plat entre les deux. Ses formes varient d'un niveau à l'autre (voir docs/LEVEL-DESIGN.md) :
    `pente` / `pente_d` (colonnes par rangée, à gauche / à droite : un ravin raide, une combe douce, un versant de chaque sorte),
    `paliers` (des terrasses), au fond un fortin (`fortin`) ou un bateau en cale sèche (`bateau`, sa coque se gravit par une
    échelle). Son toit reste sous le bord : ce n'est pas un pont. `ouverture` : à mi-hauteur de la remontée, un palier et, dans la
    paroi, une ouverture où l'on entre à l'horizontale dans les souterrains ; une courte échelle passe par-dessus. `base` ne
    change pas."""
    rng = n.rng
    base = n.base
    fond = min(base + profondeur, n.bas - 4)
    prof = fond - base
    a, c = x0 + 2, x0 + largeur - 2
    gauche = _profil(prof, pente, paliers)
    droite = _profil(prof, pente_d or pente, paliers)[::-1]
    mur = None
    if ouverture and prof >= 10:
        # le palier, à mi-hauteur : quatre colonnes ; la paroi qui suit monte d'un coup de quatre rangées (l'ouverture y est percée)
        j = next(i for i, v in enumerate(droite) if v <= prof // 2 + 2)
        palier = droite[j]
        droite = droite[:j] + [palier] * 4 + [v for v in droite[j:] if v <= palier - 4]
        mur = (j + 4, palier)
    for i, x in enumerate(range(a, a + len(gauche))):  # on descend...
        n.base_col(x, base + gauche[i])
    g, d = a + len(gauche), c - len(droite)
    for x in range(g, d):
        n.base_col(x, fond)
    for i, x in enumerate(range(d, c)):  # ... et on remonte en face
        n.base_col(x, base + droite[i])
    if mur:
        # l'ouverture : un boyau qui entre dans la paroi au niveau du palier (le réseau souterrain le prolonge, voir massifs.py) ;
        # la courte échelle, au bord du palier, monte sur la paroi
        xm, sol = d + mur[0], base + mur[1]
        for x in range(xm, min(xm + 6, c)):
            for y in range(sol - 3, sol):
                n.set(x, y, ' ')
        for y in range(base + droite[mur[0]] - 1, sol):
            n.set(xm - 1, y, 'H')
        n.ennemis(xm, xm + 6, lettres, 1, ymin=sol - 4)
        if not hasattr(n, 'ouvertures'):
            n.ouvertures = []
        n.ouvertures.append((xm + 6, sol, 1))
    # des gardes sur les versants (sur les terrasses, s'il y en a) et au fond
    n.ennemis(a, g, lettres, 2 + (paliers > 0), ymin=base - 2)
    n.ennemis(d, c, lettres, 2 + (paliers > 0), ymin=base - 2)
    n.ennemis(g, d, lettres, 3, ymin=fond - 3)
    mid = (g + d) // 2
    occupe = range(0)
    w = min(16, d - g - 16)  # huit colonnes de fond de chaque côté : la rampe vers les souterrains y passe
    if bateau and w >= 12:
        # la coque : quatre rangées de bois, plus étroite en bas ; une échelle sur son flanc gauche ; la cabine sur le pont
        x1, x2 = mid - w // 2, mid + w // 2
        for k in range(4):
            for x in range(x1 + (3 - k), x2 - (3 - k) // 2):
                n.set(x, fond - 1 - k, 'W')
        for y in range(fond - 5, fond):
            n.set(x1 + 1, y, 'H')
        tour(n, mid - 3, 8, fond - 4, 1, 'W', lettres, [0], [0], rng, butin=x0)
        occupe = range(x1 - 1, x2 + 2)
    elif fortin and w >= 10:
        tour(n, mid - w // 2, w, fond, max(1, (prof - 4) // 5), n.t['mur'], lettres, [0], [0], rng, butin=x0)
        occupe = range(mid - w // 2 - 2, mid + w // 2 + 3)
    for k in range(3 if d - g > 4 else 0):
        px = rng.randrange(g + 1, d - 1)
        if px not in occupe and n.get(px, fond - 1) == ' ' and n.get(px, fond - 2) == ' ':  # jamais devant une porte du fortin
            n.set(px, fond - 1, PROPS[k])
    # le drapeau, hors de la rampe qui part du bord vers les souterrains (six colonnes, voir massifs._entrees)
    n.repere(g + 7 if d - g > 20 else (g + d) // 2, '!', ymin=fond - 3)
    n.repere(mid + (w // 2 + 1 if occupe else 0), 'K', ymin=fond - 3)
    _acces(n, g, d - 1, fond)


def _acces(n, gauche, droite, fond):
    """Note les deux bords du fond (colonnes, rangée du sol) : le réseau souterrain (massifs.py) y fera partir ses boyaux."""
    if not hasattr(n, 'acces'):
        n.acces = []
    n.acces += [(gauche, fond, -1), (droite, fond, 1)]


def grotte_traversante(n, x0, largeur, profondeur=12, hauteur=10, lettres='a'):
    """Un massif de `hauteur` rangées sur [x0 + 2, x0 + largeur - 2), et une grotte qui le traverse : on y entre au ras du sol, le
    sol descend en marches (une rangée toutes les deux colonnes) jusqu'au fond, à `profondeur` rangées, puis remonte vers la
    sortie. La corniche d'en face, au niveau de l'entrée, est bien trop loin pour être sautée : on descend. Le plafond, irrégulier,
    laisse toujours trois rangées de roche ; un fortin d'un étage garde le fond (pas de longue échelle dans le vide). `base` ne
    change pas."""
    rng = n.rng
    base = n.base
    fond = min(base + profondeur, n.bas - 4)
    prof = fond - base
    a, c = x0 + 2, x0 + largeur - 2
    top = base - hauteur
    for x in range(a, c):
        n.base_col(x, top)
    marches = 2 * prof
    entree = 4  # le palier de l'entrée et de la sortie, au niveau du sol

    def sol(x):
        if x < a + entree:
            return base
        if x < a + entree + marches:
            return base + (x - a - entree) // 2 + 1
        if x >= c - entree:
            return base
        if x >= c - entree - marches:
            return base + (c - entree - 1 - x) // 2 + 1
        return fond

    plafond = base - 5
    for x in range(a, c):
        if a + entree <= x < c - entree:
            plafond = max(top + 3, min(base - 4, plafond + rng.choice((-1, 0, 0, 1))))
        haut = base - 4 if x < a + entree or x >= c - entree else plafond
        for y in range(haut, sol(x)):
            n.set(x, y, ' ')
        if n.get(x, sol(x)) == ' ':
            n.set(x, sol(x), n.t['sous'])
    g, d = a + entree + marches, c - entree - marches - 1
    # au fond : des gardes, des caisses et des barils, du butin, une cage, un drapeau ; des gardes sur les marches
    n.ennemis(g, d, lettres, 3 + (d - g) // 10, ymin=fond - 6)
    n.ennemis(a + entree, g, lettres, 2, ymin=base - 4)
    n.ennemis(d, c - entree, lettres, 2, ymin=base - 4)
    for k in range(4):
        px = rng.randrange(g + 2, d - 1)
        if n.get(px, fond - 1) == ' ' and n.get(px, fond - 2) == ' ':
            n.set(px, fond - 1, PROPS[k])
    n.repere(g + 1, '!', ymin=fond - 4)
    n.repere(rng.randrange(g + 3, d - 2), '*', ymin=fond - 4)
    n.repere((g + d) // 2 + 2, 'K', ymin=fond - 4)
    # le sommet du massif se gagne par les corniches de sa face (les puits des souterrains y débouchent), où guettent des gardes
    _corniches(n, a, base - 4, top, lettres)
    n.ennemis(a + 2, c - 2, lettres, 2, ymin=top - 3)
    # au milieu du fond, un fortin d'un étage (son toit reste loin du plafond) : on s'y bat, on n'y grimpe pas vers le haut
    w = min(12, d - g - 18)  # neuf colonnes de fond de chaque côté : les rampes vers les souterrains y passent
    if w >= 8:
        tour(n, (g + d) // 2 - w // 2, w, fond, 1, n.t['mur'], lettres, [0], [0], rng, butin=x0 + 1)
    _acces(n, g, d, fond)
