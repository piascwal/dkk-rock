"""Le pont des Tuves refait : la montagne, les ruisseaux et les arbres. Au lieu d'une rivière d'un côté et des figuiers du Viet Cong
glaireux de l'autre, l'eau est partout : un torrent qui descend en terrasses (des vasques, une cascade à chaque marche), la rivière
où l'on passe d'une cabane sur pilotis à l'autre (des planches, des échelles, de l'eau qui ruisselle des plateformes), et sous la
montagne une grotte où l'on retrouve la rivière.
"""
from a_la_main import echelle, pose
from plateaux import grotte_traversante

EAU, BOUE, ROCHE, BOIS, PLANCHE = '~', ';', 'R', 'W', '-'


def cascade(n, x, y0, y1):
    """De l'eau qui tombe sur la colonne x, de la rangée y0 à y1 (comprises), là où il n'y a que de l'air."""
    for y in range(y0, y1 + 1):
        if n.get(x, y) == ' ':
            n.set(x, y, EAU)


def torrent(n, x0, largeur, chute=8, lettres='a'):
    """Le torrent qui dévale la montagne : des terrasses de deux rangées, chacune avec sa vasque (une tuile d'eau, un rocher qui en
    sort), une cascade qui tombe de l'une à l'autre ; des chênes verts et des roseaux, un ennemi par terrasse. `base` descend de
    `chute`."""
    marches = max(1, chute // 2)
    w = max(6, largeur // (marches + 1))
    terrasses = []
    for i in range(marches + 1):
        sol = n.base + 2 * i
        xa = x0 + i * w
        xb = x0 + largeur if i == marches else xa + w
        for x in range(xa, xb):
            n.base_col(x, sol)
        terrasses.append((xa, xb, sol))
    n.base += 2 * marches
    for i, (xa, xb, sol) in enumerate(terrasses):
        # la vasque : creusée d'une rangée dans la terrasse, un rebord sec de chaque côté
        for x in range(xa + 2, xb - 1):
            n.set(x, sol, EAU)
            n.set(x, sol + 1, BOUE)
        if xb - xa > 9:
            n.set(xa + (xb - xa) // 2, sol - 1, ROCHE)
        if i < marches:  # la cascade, au bord de la terrasse, jusqu'à la vasque d'en dessous
            cascade(n, xb, sol - 1, sol + 1)
        pose(n, xa + 2, 'cheneVert' if i % 2 else 'roseaux', sol, ecart=3)
        n.ennemis(xa + 1, xb - 1, lettres, 1, ymin=sol - 3)


def _cabane(n, xa, w, plancher, etages, rng, lettres, figuier):
    """Une cabane sur pilotis : un plancher, des murs de bois percés d'une porte, un toit ; parfois un étage (une échelle intérieure).
    Une échelle descend du plancher jusqu'à l'eau ; un ennemi par étage."""
    xb = xa + w
    haut = 5
    for e in range(etages):
        y = plancher - e * haut
        for x in range(xa, xb):
            n.set(x, y, BOIS)
        for x in (xa, xb - 1):  # les murs, une porte de deux tuiles au ras du plancher
            for yy in range(y - haut + 1, y - 2):
                n.set(x, yy, BOIS)
        if e:  # l'échelle de l'étage, à l'intérieur
            echelle(n, xa + 2, haut, sol=y + haut)
        n.ennemis(xa + 1, xb - 1, lettres, 1, ymin=y - 3)
    toit = plancher - etages * haut
    for x in range(xa - 1, xb + 1):
        n.set(x, toit, BOIS)
    if figuier:  # le figuier qui pousse à travers le toit : on y monte, les glaireux y guettent
        for x in range(xa + 1, xb - 1):
            n.set(x, toit - 3, PLANCHE)
        n.ennemis(xa + 1, xb - 1, lettres, 1, ymin=toit - 5)
    if rng.random() < 0.5:
        n.repere(xa + w // 2, '+', ymin=plancher - 3)


def pilotis(n, x0, largeur, lettres='a', prof=3, figuiers=False):
    """La rivière sous les arbres : un lit de `prof` tuiles d'eau sur la boue, et dessus des cabanes sur pilotis et des passerelles
    de planches, à des hauteurs différentes, séparées par l'eau ; de l'eau ruisselle du bord des plateformes. On passe d'une
    structure à l'autre, ou par l'eau (elle ralentit) et les échelles. Avec `figuiers`, c'est le camp du Viet Cong glaireux : un
    figuier sur chaque toit. `base` ne change pas : on ressort au même niveau."""
    rng = n.rng
    base = n.base
    a, c = x0 + 2, x0 + largeur - 2
    for x in range(a, c):  # le lit : l'eau, la boue, et le sous-sol dessous
        for y in range(base, base + prof):
            n.set(x, y, EAU)
        n.set(x, base + prof, BOUE)
    # les berges descendent en marches d'une tuile (sous l'eau) : on sort de la rivière à pied, de chaque côté
    for k in range(prof - 1):
        for x in (a + k, c - 1 - k):
            for y in range(base + 1 + k, base + prof):
                n.set(x, y, BOUE)
    a, c = a + prof - 1, c - prof + 1
    for x in range(a + 3, c - 3, 9):  # des rochers dans le courant, où l'on a pied
        n.set(x, base + prof - 1, ROCHE)
    x = a + 3
    k = 0
    while x + 8 < c - 3:
        w = rng.choice((8, 9, 10))
        if k % 3 == 2:
            # une passerelle de planches entre deux cabanes, plus haut, l'eau qui en goutte
            y = base - rng.choice((4, 6))
            for xx in range(x, min(x + w + 2, c - 3)):
                n.set(xx, y, PLANCHE)
            for xx in (x, x + w):  # deux poteaux, jusqu'à l'eau (le lit reste libre : on y passe dessous)
                for yy in range(y + 1, base):
                    n.set(xx, yy, BOIS)
            echelle(n, x + 1, base + prof - y + 1, sol=base + prof)
            cascade(n, x + w + 1, y + 1, base - 1)
            n.ennemis(x + 1, x + w, lettres, 1, ymin=y - 3)
        else:
            plancher = base - rng.choice((3, 4, 5))
            etages = 1 if rng.random() < 0.6 else 2
            for xx in (x, x + w - 1):  # les pilotis, jusqu'à l'eau (le lit reste libre : on y passe dessous)
                for yy in range(plancher + 1, base):
                    n.set(xx, yy, BOIS)
            echelle(n, x - 1, base + prof - plancher + 1, sol=base + prof)
            _cabane(n, x, w, plancher, etages, rng, lettres, figuiers)
            # l'eau de pluie qui ruisselle du toit et du plancher vers la rivière
            cascade(n, x + w, plancher - etages * 5 + 1, base - 1)
        x += w + rng.choice((4, 5, 6))
        k += 1
    for xx in range(a + 1, c - 1, 7):
        pose(n, xx, 'figuier' if figuiers else 'roseaux', base, ecart=4)
    n.ennemis(a, c, lettres, 2, ymin=base)


def grotte_riviere(n, x0, largeur, profondeur=8, hauteur=14, lettres='a'):
    """Sous la montagne, la grotte où l'on retrouve la rivière : la grotte traversante (on y descend par des marches), et au fond de
    l'eau qui coule entre des bancs de sable, de l'eau qui tombe des fissures du plafond."""
    base = n.base
    grotte_traversante(n, x0, largeur, profondeur, hauteur, lettres)
    fond = min(base + profondeur, n.bas - 4)
    for x in range(x0 + 2, x0 + largeur - 2):
        if n.get(x, fond - 1) != ' ' or x % 8 in (0, 1):  # le fond seulement, des bancs secs pour reprendre pied
            continue
        if n.get(x, fond) in ('#', 'R', ';', '{'):
            n.set(x, fond, EAU)
            n.set(x, fond + 1, BOUE)
    for x in range(x0 + 12, x0 + largeur - 12, 17):  # l'eau des fissures, du plafond au fond
        plafond = next((y for y in range(fond - 1, base - hauteur, -1) if n.get(x, y) not in ' ~.'), None)
        if plafond is not None and n.get(x, fond - 1) == ' ':
            cascade(n, x, plafond + 1, fond - 1)
