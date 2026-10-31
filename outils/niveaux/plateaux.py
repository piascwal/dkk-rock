"""Des idées prises à Broforce (le chantier du level design, voir src/niveaux/refontes.ts) :

- `plateau_caverne` : le terrain monte d'un coup, bien plus haut que la rue ; au ras du sol, on entre dans une vaste caverne
  creusée sous le plateau (un plafond irrégulier, des piliers de roche, des corniches, des gardes, du butin, une cage). On choisit :
  grimper sur le plateau par l'échelle de sa face, ou s'enfoncer dans la caverne. Le sol continue à la même hauteur après lui ;
- `miradors` : une étendue de terrain dégagé où se dressent des miradors sur pilotis, un guetteur sur chacun, une échelle le long
  d'un pied ; on s'y bat à découvert, et l'on passe sous eux sans détour ;
- `cuvette` : le sol s'ouvre sur une large cuvette, bien trop large pour être sautée, sans pont : on y descend par des escaliers
  taillés dans le terrain (pas d'échelle), on se bat au fond (un fortin, des gardes sur les marches, du butin, une cage) et l'on
  remonte en face par d'autres marches. La verticalité vers le bas, imposée par le terrain et non par un mur.
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
    w = min(16, c - a - 2 * marches - 8)
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
    n.repere(c - marches - 3, 'K', ymin=fond - 3)
