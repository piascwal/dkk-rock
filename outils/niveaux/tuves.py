"""Le pont des Tuves : de Saint-Cézaire, on descend à pied jusqu'à la Siagne, comme quand on avait quinze ans. Le sentier part du
village, descend en lacets (des corniches de deux tuiles, des blocs de roche, des chênes verts), longe le canal de la Siagne, passe
des forts ; une tyrolienne plonge au fond des gorges ; on arrive au pont des Tuves (1802), son arche de pierre au-dessus de la
rivière (on en sautait ; un mini-jeu viendra). Puis on marche dans la rivière, les pieds dans la boue et l'eau qui coule, jusqu'aux
figuiers du « Viet Cong glaireux », où l'on se bat à coups de figues : leur lait brûle tout ce qu'il touche.

Le sol (`n.base`) baisse au fil du niveau : chaque lacet, la tyrolienne et la rivière descendent d'autant ; le niveau est plus
profond que les autres (`profondeur` dans son plan) pour avoir la place.
"""
from a_la_main import echelle, pose

PIERRE, EAU, BOUE, ROCHE = '{', '~', ';', 'R'


def sentier(n, x0, largeur, lettres='a'):
    """Le départ du sentier, au bord du village : le dernier muret de pierre, la balise jaune (« Pont des Tuves 1 h »), la chapelle
    Saint-Saturnin de loin (le fond), et le chemin de terre qui part vers les gorges."""
    base = n.base
    for dy in (1, 2):
        n.set(x0 + 2, base - dy, PIERRE)
    pose(n, x0 + 6, 'balise', base, ecart=3)
    pose(n, x0 + 11, 'croix', base, ecart=3)
    n.ennemis(x0 + 8, x0 + largeur - 2, lettres, 1)


def lacets(n, x0, largeur, chute=6, lettres='a'):
    """Le sentier qui descend en lacets : des corniches de deux tuiles, chacune bordée d'un bloc de roche au bord du vide (on le
    saute), des chênes verts ; un ennemi sur chaque corniche. `base` descend de `chute`."""
    marches = max(1, chute // 2)
    w = max(4, largeur // (marches + 1))
    corniches = []
    for i in range(marches + 1):
        sol = n.base + 2 * i
        xa = x0 + i * w
        xb = x0 + largeur if i == marches else xa + w
        for x in range(xa, xb):
            n.base_col(x, sol)
        if i < marches:  # le bloc de roche au bord de la corniche
            n.set(xb - 1, sol - 1, ROCHE)
        corniches.append((xa, xb, sol))
    n.base += 2 * marches
    for xa, xb, sol in corniches:
        pose(n, (xa + xb) // 2 - 1, 'cheneVert', sol, ecart=3)
        n.ennemis(xa + 1, xb - 2, lettres, 1, ymin=sol - 3)


def canal(n, x0, largeur, lettres='a'):
    """Le canal de la Siagne, que le sentier longe : un chenal de pierre de deux tuiles, plein d'eau, entre deux parapets ; on marche
    sur le parapet ou dans l'eau (elle ralentit). Un médiator au fond, des ennemis de l'autre côté."""
    base = n.base
    xa, xb = x0 + 3, x0 + largeur - 3
    for x in range(xa, xb):
        n.set(x, base, EAU)
        n.set(x, base + 1, EAU)
        n.set(x, base + 2, PIERRE)
    for x in (xa - 1, xb):  # les parapets, à fleur du chemin : on ressort de l'eau d'un saut de deux tuiles
        for y in range(base, base + 3):
            n.set(x, y, PIERRE)
    n.repere((xa + xb) // 2, '+', ymin=base)
    n.ennemis(xb + 1, x0 + largeur, lettres, 1)
    n.ennemis(x0, xa - 1, lettres, 1)


def pont_des_tuves(n, x0, largeur, lettres='a', prof=9, haut=8):
    """Le pont des Tuves : on arrive sur la rive plate, on gravit la culée par des marches de pierre de deux tuiles, et on passe
    tout en haut, sur le tablier : dessous, l'arche, et le vide des gorges jusqu'à la Siagne (quatre tuiles d'eau sur un lit
    de boue, des rochers qui en sortent). De l'autre côté, on redescend les marches. Une échelle, contre la culée de droite,
    remonte de la rivière jusqu'au tablier. Des ennemis sur le pont, sur les rives et dans la rivière."""
    base = n.base
    marches = haut // 2
    yd = base - haut  # le tablier : on marche dessus en rangée yd - 1
    xa = x0 + 4  # la première marche de la culée de gauche
    g0 = xa + 2 * marches  # les gorges, entre les deux culées
    g1 = x0 + largeur - 4 - 2 * marches
    fond = base + prof
    # les gorges : creusées jusqu'au lit de boue, l'eau dedans, des parois de roche de part et d'autre
    for x in range(g0, g1):
        for y in range(base, fond):
            n.set(x, y, EAU if y >= fond - 4 else ' ')
        n.set(x, fond, BOUE)
        n.haut[x] = fond
    for x in (g0 - 1, g1):
        for y in range(base, fond + 1):
            n.set(x, y, ROCHE)
    # les culées : des marches de deux tuiles qui montent au tablier, à gauche ; qui en redescendent, à droite
    for k in range(marches):
        h = 2 * (k + 1)
        for dx in range(2):
            for y in range(base - h, base):
                n.set(xa + 2 * k + dx, y, PIERRE)
                n.set(g1 + 2 * (marches - 1 - k) + dx, y, PIERRE)
    # le pont : un tablier d'une rangée, et dessous l'arche, un anneau de pierre de deux tuiles qui prend appui sur les parois
    # des gorges, deux tuiles sous les rives, et touche le tablier en son milieu ; entre les deux, des piliers tous les cinq
    # pas, et le vide : depuis le tablier, on voit qu'on est tout en haut
    c = (g0 + g1) / 2
    demi = (g1 - g0) / 2
    naissance = base + 2
    for x in range(g0, g1):
        d = min(1.0, abs(x + 0.5 - c) / demi)
        intrados = naissance - round((naissance - yd - 1) * (1 - d * d) ** 0.5)
        plein = x < g0 + 2 or x >= g1 - 2 or (x - g0) % 5 == 2  # contre les culées, et les piliers
        for y in range(yd, intrados):
            if y == yd or y >= intrados - 2 or plein:
                n.set(x, y, PIERRE)
    # des rochers dans le courant
    for x in range(g0 + 3, g1 - 3, 7):
        n.set(x, fond - 1, ROCHE)
        n.set(x + 1, fond - 1, ROCHE)
    # remonter de la rivière : une échelle contre la paroi de droite, à travers la maçonnerie, jusqu'au tablier
    echelle(n, g1 - 1, fond - yd, sol=fond)
    n.ennemis(g0 + 2, g1 - 2, lettres, 2, ymin=yd - 3)
    n.ennemis(g0 + 2, g1 - 2, lettres, 1, ymin=base + 1)
    n.ennemis(x0, xa - 1, lettres, 1)
    n.ennemis(g1 + 2 * marches, x0 + largeur, lettres, 1)


def riviere(n, x0, largeur, lettres='a', chute=4):
    """Le lit de la rivière : le chemin descend au bord de l'eau ; on y marche dans une tuile d'eau qui coule, sur la boue, entre des
    rochers qu'on saute ; des vasques plus profondes. `base` descend de `chute`."""
    sol = n.base + chute
    for i, x in enumerate(range(x0, x0 + largeur)):
        n.base_col(x, n.base + min(chute, i // 2))
    n.base = sol
    for x in range(x0 + chute * 2, x0 + largeur):
        n.set(x, sol, BOUE)
        n.set(x, sol - 1, EAU)
    for x in range(x0 + chute * 2 + 6, x0 + largeur - 4, 9):  # un rocher, puis une vasque
        n.set(x, sol - 1, ROCHE)
        n.set(x, sol - 2, ROCHE)
        for dx in (3, 4):
            n.set(x + dx, sol, EAU)
            n.set(x + dx, sol + 1, BOUE)
    for x in range(x0 + 4, x0 + largeur - 2, 6):
        pose(n, x, 'roseaux', sol, ecart=4)
    n.ennemis(x0 + chute * 2, x0 + largeur - 1, lettres, 2)


def figuiers(n, x0, largeur, lettres='v'):
    """Les figuiers du Viet Cong glaireux : la boue, l'eau qui coule dessus, des figuiers partout ; dans leurs branches, des planches
    (on y monte de branche en branche, deux tuiles à la fois), d'où les glaireux lancent leurs figues ; une cabane de bois au
    milieu. Le lait des figues brûle les planches, les caisses et la boue : le terrain change pendant la bataille."""
    base = n.base
    for x in range(x0, x0 + largeur):
        n.set(x, base, BOUE)
        if x % 7 not in (0, 1):  # l'eau coule, avec des bancs de boue où l'on a pied au sec
            n.set(x, base - 1, EAU)
    xc = x0 + largeur // 2 - 4  # la cabane, au milieu (les branches des figuiers l'évitent)
    x = x0 + 3
    k = 0
    while x + 8 < x0 + largeur:
        if x + 7 > xc - 2 and x < xc + 11:
            x += 11
            continue
        # un figuier, ses branches : une planche à deux tuiles, une autre à quatre
        y1, y2 = base - 3, base - 5
        for dx in range(5):
            n.set(x + dx, y1, '-')
        for dx in range(1, 4):
            n.set(x + dx + 2, y2, '-')
        n.ennemis(x, x + 5, lettres, 1, ymin=y1 - 2)
        if k % 2:
            n.ennemis(x + 3, x + 6, lettres, 1, ymin=y2 - 2)
        x += 11
        k += 1
    # la cabane, au milieu : un plancher sur pilotis, deux murs de bois (une porte de deux tuiles au ras du plancher), un toit ;
    # un médiator dedans
    plancher = base - 4
    for dx in range(9):
        n.set(xc + dx, plancher, 'W')
    for dx in (0, 8):
        for y in range(plancher + 1, base):
            n.set(xc + dx, y, 'W')
        for y in range(plancher - 4, plancher - 2):
            n.set(xc + dx, y, 'W')
    for dx in range(-1, 10):
        n.set(xc + dx, plancher - 5, 'W')
    echelle(n, xc - 1, base - plancher)
    n.repere(xc + 4, '+', ymin=plancher - 4)
    # les figuiers eux-mêmes, et les roseaux du bord
    for xx in range(x0 + 6, x0 + largeur - 4, 11):
        pose(n, xx, 'figuier', base, ecart=4)
    n.ennemis(x0 + 2, x0 + largeur - 2, lettres, 2)
