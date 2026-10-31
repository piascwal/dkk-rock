"""Au-dessus et en dessous (docs/LEVEL-DESIGN.md) : une longue étendue plate, où l'on traverse sans changer de hauteur, reçoit
quelque chose au-dessus et une raison de passer dessous. Ce qu'on y pose dépend du lieu et varie d'une étendue à l'autre :

- un bâtiment : on y monte par l'intérieur (des pièces, des échelles décalées) ou sur son toit ; on passe dessous par une fosse ;
- une butte : le terrain monte en marches jusqu'à un guetteur ; à son pied, une fosse et l'entrée d'une grotte qui la traverse ;
- un trou : le sol s'effondre en marches jusqu'à un fond gardé, d'où partent des rampes vers les souterrains ;
- des gradins, seulement là où il y en aurait vraiment (autour de la patinoire) : des pitons posés en l'air au-dessus de la glace ;
- sur un lac gelé, une cabane de pêcheur : on la traverse par ses portes, ou l'on monte sur son toit.

La fosse : trois marches qui descendent, juste devant (on la saute, ou l'on y entre en marchant), puis un passage dessous qui
ressort de l'autre côté ; un boyau en part vers le complexe souterrain le plus proche. Aucune échelle : c'est le terrain qui
propose les deux chemins. `relief_des_plats` cherche ces étendues une fois les modules posés, avant le réseau souterrain.
"""
from blocs import tour
from massifs import _naturel

HAUT = 8  # la hauteur des gradins, en rangées
PRESERVE = set('0123456789!K*+@F&()$')  # les repères qu'on ne recouvre jamais : on les remonte dessus
HORS = ('arene', 'avion', 'ferry')  # là où l'on ne pose rien
# ce qui a du sens dans chaque lieu, dans l'ordre où on l'essaie (on tourne d'une étendue à l'autre)
FORMES = {
    'beauvais': ('batiment', 'trou'),
    'limerick': ('butte', 'batiment', 'trou'),
    'lund': ('batiment', 'butte', 'trou'),
    'newyork': ('batiment', 'trou'),
    'ottawa': ('butte', 'batiment', 'trou'),
    'marseille': ('butte', 'batiment', 'trou'),
    'foret': ('butte', 'trou'),
    'port': ('batiment', 'trou'),
    'groix': ('butte', 'batiment', 'trou'),
}
GRADINS = ('patinoire',)  # les lieux qui appellent des gradins


def _vide_dessus(n, x, g, hauteur=14):
    """Rien au-dessus du sol de la colonne x (le ciel, des gardes, des repères) : la place pour poser quelque chose."""
    return all(n.get(x, y) in ' ' or n.get(x, y).islower() or n.get(x, y) in PRESERVE for y in range(g - hauteur, g))


def _sur_glace(n, x0, x1, g):
    return any(n.get(x, g) == 'G' or n.get(x, g + 1) == '~' for x in range(x0, x1))


def _fosse_et_passage(n, x0, x1, g, lettres):
    """La fosse devant [x0 + 3, x1 - 3), le passage dessous, la sortie en face et le boyau vers les souterrains."""
    debut, fin = x0 + 3, x1 - 3
    for k in range(3):
        n.base_col(x0 + k, g + 1 + k)
    sol = g + 3
    for x in range(debut, fin):
        for y in range(sol - 2, sol):
            if _naturel(n, n.get(x, y)):
                n.set(x, y, ' ')
    for k in range(3):
        n.base_col(fin + k, g + 3 - k)
    n.ennemis(debut, fin, lettres, 2, ymin=sol - 3)
    n.repere((debut + fin) // 2, '+', ymin=sol - 3)
    if not hasattr(n, 'acces'):
        n.acces = []
    n.acces.append((debut, sol, -1))  # la rampe et le boyau (voir massifs._entrees)


def gradins(n, x0, x1, g, lettres):
    """Des gradins de pitons en l'air au-dessus de la glace : des marches de deux colonnes, un palier, une corniche plus haut."""
    debut, fin = x0 + 3, x1 - 3
    for x in range(debut, fin):
        y = g - 1 - min((x - debut) // 2, HAUT - 1)
        if n.get(x, y) == ' ':
            n.set(x, y, '=')
    palier = g - HAUT
    n.ennemis(debut + 2 * HAUT, fin, lettres, 2 + (fin - debut) // 16, ymin=palier - 3)
    cx = debut + 2 * HAUT + 2
    if cx + 5 < fin:
        for x in range(cx, cx + 4):
            n.set(x, palier - 3, '=')
        n.ennemis(cx, cx + 4, lettres, 1, ymin=palier - 6)
        n.repere(cx + 1, '*', ymin=palier - 6)


def batiment(n, x0, x1, g, lettres, mat):
    """Un bâtiment de deux ou trois étages au milieu de l'étendue, une porte de chaque côté au rez-de-chaussée ; dessous, le passage."""
    _fosse_et_passage(n, x0, x1, g, lettres)
    w = min(18, x1 - x0 - 12)
    mid = (x0 + x1) // 2
    tour(n, mid - w // 2, w, g, 2 + n.rng.randrange(2), mat, lettres, [0], [0], n.rng, butin=x0)


def butte(n, x0, x1, g, lettres):
    """Le terrain monte en marches (une rangée toutes les deux colonnes) jusqu'à un sommet gardé, puis redescend ; à son pied, la
    fosse et l'entrée de la grotte qui la traverse."""
    _fosse_et_passage(n, x0, x1, g, lettres)
    debut, fin = x0 + 3, x1 - 3
    haut = min(6, (fin - debut) // 5)
    for x in range(debut, fin):
        k = min((x - debut) // 2, (fin - 1 - x) // 2, haut - 1)
        cible = g - 1 - k
        garde = [n.get(x, y) for y in range(cible, g) if n.get(x, y) != ' ']
        n.base_col(x, cible)
        for i, c in enumerate(garde):
            n.set(x, cible - 1 - i, c)
    sommet = g - haut
    n.ennemis(debut + 2 * haut, fin - 2 * haut, lettres, 2, ymin=sommet - 3)
    n.repere((debut + fin) // 2, '*', ymin=sommet - 3)


def trou(n, x0, x1, g, lettres, profondeur=7):
    """Le sol s'effondre : des marches d'une rangée par colonne jusqu'à un fond gardé, puis on remonte ; aux deux bords du fond,
    des rampes vers les souterrains (on y entre à l'horizontale, voir massifs._entrees)."""
    a, c = x0 + 2, x1 - 2
    prof = min(profondeur, (c - a) // 3)
    for i in range(prof):
        n.base_col(a + i, g + 1 + i)
        n.base_col(c - 1 - i, g + 1 + i)
    fond = g + prof
    for x in range(a + prof, c - prof):
        n.base_col(x, fond)
    n.ennemis(a + prof, c - prof, lettres, 3, ymin=fond - 3)
    n.repere((a + c) // 2, '+', ymin=fond - 3)
    if not hasattr(n, 'acces'):
        n.acces = []
    n.acces += [(a + prof, fond, -1), (c - prof - 1, fond, 1)]


def relief_des_plats(r, lettres, theme, longueur=34):
    """Chaque étendue plate d'au moins `longueur` colonnes, sans rien au-dessus, reçoit l'une des formes du lieu (on tourne)."""
    n = r.n
    hors = [(a, b) for a, b, genre in r.pieces if genre in HORS]
    appelle_gradins = [(a, b) for a, b, genre in r.pieces if genre in GRADINS]
    formes = FORMES.get(theme, ('batiment', 'butte', 'trou'))
    tour_ = n.rng.randrange(len(formes))  # chaque niveau commence par une forme différente
    x = 24
    while x < n.w - 24:
        g = n.haut[x]
        fin = x
        # du vrai sol : pas le fond d'un vide sans fond (entre deux tours, sous un pont)
        sol = g < n.bas - 4 and n.get(x, g) != ' '
        while sol and fin < n.w - 24 and n.haut[fin] == g and _vide_dessus(n, fin, g) and not any(a <= fin < b for a, b in hors):
            fin += 1
        if fin - x < longueur:
            x = fin + 1
            continue
        largeur = min(fin - x, 44)
        debut = x + (fin - x - largeur) // 2
        x1 = debut + largeur
        if any(a <= debut < b for a, b in appelle_gradins) and _sur_glace(n, debut, x1, g):
            gradins(n, debut, x1, g, lettres)
        elif _sur_glace(n, debut, x1, g):
            # une cabane de pêcheur sur la glace (pas de fosse : dessous, c'est l'eau)
            w = min(14, largeur - 16)
            tour(n, (debut + x1) // 2 - w // 2, w, g, 1 + n.rng.randrange(2), 'W', lettres, [0], [0], n.rng, butin=debut)
        else:
            forme = formes[tour_ % len(formes)]
            tour_ += 1
            if forme == 'batiment':
                batiment(n, debut, x1, g, lettres, n.t['mur'])
            elif forme == 'butte':
                butte(n, debut, x1, g, lettres)
            else:
                trou(n, debut, x1, g, lettres)
        x = x1 + 20
