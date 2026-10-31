"""Des idées prises à Broforce (le chantier du level design, voir src/niveaux/refontes.ts) :

- `plateau_caverne` : le terrain monte d'un coup, bien plus haut que la rue ; au ras du sol, on entre dans une vaste caverne
  creusée sous le plateau (un plafond irrégulier, des piliers de roche, des corniches, des gardes, du butin, une cage). On choisit :
  grimper sur le plateau par l'échelle de sa face, ou s'enfoncer dans la caverne. Le sol continue à la même hauteur après lui ;
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
    traverse de part en part ; une échelle sur la face de gauche mène au sommet. `base` ne change pas."""
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
    for y in range(top, base):
        n.set(a, y, 'H')
    n.ennemis(a + 3, b - 2, lettres, 2, ymin=top - 3)
    n.repere(b - 4, '+', ymin=top - 3)


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


def cuvette(n, x0, largeur, profondeur=14, lettres='a'):
    """Une cuvette de `profondeur` rangées sur [x0 + 2, x0 + largeur - 2) : des marches d'une rangée toutes les deux colonnes pour
    y descendre et pour en remonter, le fond plat entre les deux, un fortin au milieu du fond (son toit reste sous le bord : ce
    n'est pas un pont). `base` ne change pas."""
    rng = n.rng
    base = n.base
    fond = min(base + profondeur, n.bas - 4)
    prof = fond - base
    a, c = x0 + 2, x0 + largeur - 2
    marches = 2 * prof
    for i, x in enumerate(range(a, a + marches)):  # on descend...
        n.base_col(x, base + i // 2 + 1)
    for x in range(a + marches, c - marches):
        n.base_col(x, fond)
    for i, x in enumerate(range(c - marches, c)):  # ... et on remonte en face
        n.base_col(x, fond - i // 2 - 1)
    # le fortin, au milieu du fond, ses deux portes au rez-de-chaussée
    w = min(16, c - a - 2 * marches - 16)  # huit colonnes de fond de chaque côté : la rampe vers les souterrains y passe
    mid = (a + c) // 2
    fortin = range(mid - w // 2 - 2, mid + w // 2 + 3) if w >= 10 else range(0)
    if w >= 10:
        tour(n, mid - w // 2, w, fond, max(1, (prof - 4) // 5), n.t['mur'], lettres, [0], [0], rng, butin=x0)
    n.ennemis(a, a + marches, lettres, 2, ymin=base - 2)  # des gardes sur les marches
    n.ennemis(c - marches, c, lettres, 2, ymin=base - 2)
    n.ennemis(a + marches, c - marches, lettres, 3, ymin=fond - 3)
    for k in range(3):
        px = rng.randrange(a + marches + 1, c - marches - 1)
        if px not in fortin and n.get(px, fond - 1) == ' ' and n.get(px, fond - 2) == ' ':  # jamais devant une porte du fortin
            n.set(px, fond - 1, PROPS[k])
    n.repere(a + marches + 2, '!', ymin=fond - 3)
    n.repere(mid + (w // 2 + 1 if w >= 10 else 0), 'K', ymin=fond - 3)
    _acces(n, a + marches, c - marches - 1, fond)


def _acces(n, gauche, droite, fond):
    """Note les deux bords du fond (colonnes, rangée du sol) : le réseau souterrain (massifs.py) y fera partir ses boyaux."""
    if not hasattr(n, 'acces'):
        n.acces = []
    n.acces += [(gauche, fond, -1), (droite, fond, 1)]


def grotte_traversante(n, x0, largeur, profondeur=12, hauteur=10, lettres='a'):
    """Un massif de `hauteur` rangées sur [x0 + 2, x0 + largeur - 2), et une grotte qui le traverse : on y entre au ras du sol, le
    sol descend en marches (une rangée toutes les deux colonnes) jusqu'au fond, à `profondeur` rangées, puis remonte vers la
    sortie. La corniche d'en face, au niveau de l'entrée, est bien trop loin pour être sautée : on descend. Le plafond, irrégulier,
    laisse toujours trois rangées de roche ; une échelle remonte du fond sur le massif. `base` ne change pas."""
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
    # l'échelle du fond jusqu'en haut du massif (pour qui veut remonter) ; des gardes et un médiator là-haut
    mx = (g + d) // 2
    for y in range(top, fond):
        n.set(mx, y, 'H')
    n.ennemis(a + 2, c - 2, lettres, 2, ymin=top - 3)
    n.repere(c - 4, '+', ymin=top - 3)
    _acces(n, g, d, fond)
