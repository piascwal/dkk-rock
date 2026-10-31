"""D'autres formes pour les étendues plates (voir relief.py), chacune réservée aux lieux où elle a du sens. Toutes se gravissent
d'un saut à l'autre (des pitons tous les deux rangs au plus, à trois colonnes au plus : ce que permet un saut, voir
src/niveaux/accessibilite.ts) ; devant chacune, une fosse et un passage dessous (relief._fosse_et_passage).

- le kiosque à musique : une scène de pitons où l'on saute, un balcon, un toit qu'on gagne par une corniche ;
- la fontaine : une vasque, une colonne qu'on escalade de corniche en corniche jusqu'au butin ;
- l'échafaudage de chantier : des planchers de pitons en zigzag au-dessus de la fouille, des caisses tout en haut ;
- les ruines : des piliers de plus en plus hauts, puis de moins en moins (un escalier de piliers), des gardes dessus ;
- le marché : des étals couverts ; on passe dessous, ou l'on monte sur les auvents par les caisses des étals.
"""


def _pose(n, x, y, c):
    """Pose une tuile sans jamais recouvrir un repère, un garde ou un drapeau."""
    if n.get(x, y) == ' ':
        n.set(x, y, c)


def _ligne(n, x0, x1, y, c):
    for x in range(x0, x1):
        _pose(n, x, y, c)


def _fosse(n, x0, x1, g, lettres):
    from relief import _fosse_et_passage  # (relief importe ce module)

    _fosse_et_passage(n, x0, x1, g, lettres)


def kiosque(n, x0, x1, g, lettres, mat):
    _fosse(n, x0, x1, g, lettres)
    m = (x0 + x1) // 2
    for y in range(g - 9, g):  # les poteaux, en arrière-plan
        _pose(n, m - 7, y, '.')
        _pose(n, m + 7, y, '.')
    _ligne(n, m - 7, m + 8, g - 2, '=')  # la scène
    _ligne(n, m - 6, m + 7, g - 4, '=')  # le balcon
    _ligne(n, m + 6, m + 9, g - 6, '=')  # la corniche vers le toit
    _ligne(n, m - 5, m + 6, g - 8, '^')  # le toit, et son faîte
    _ligne(n, m - 3, m + 4, g - 9, '^')
    n.ennemis(m - 6, m + 7, lettres, 2, ymin=g - 6)
    n.ennemis(m - 5, m - 3, lettres, 1, ymin=g - 11)
    n.repere(m + 4, '*', ymin=g - 11)


def fontaine(n, x0, x1, g, lettres, mat):
    _fosse(n, x0, x1, g, lettres)
    m = (x0 + x1) // 2
    _pose(n, m - 8, g - 1, mat)  # la vasque : deux margelles, de l'eau entre elles
    _pose(n, m + 9, g - 1, mat)
    for x in range(m - 7, m + 9):
        if n.get(x, g - 1) == ' ':
            n.set(x, g - 1, '~')
    for y in range(g - 10, g - 1):  # la colonne
        _pose(n, m, y, mat)
        _pose(n, m + 1, y, mat)
    for k, y in enumerate(range(g - 2, g - 10, -2)):  # les corniches, d'un côté puis de l'autre
        if k % 2 == 0:
            _ligne(n, m - 3, m, y, '=')
        else:
            _ligne(n, m + 2, m + 5, y, '=')
    n.ennemis(m - 6, m + 7, lettres, 2, ymin=g - 9)
    n.repere(m, '+', ymin=g - 12)


def echafaudage(n, x0, x1, g, lettres, mat):
    _fosse(n, x0, x1, g, lettres)
    s = (x0 + x1) // 2 - 7
    for x in range(s - 1, s + 15, 5):  # les montants
        for y in range(g - 11, g):
            _pose(n, x, y, '.')
    for k, y in enumerate(range(g - 2, g - 10, -2)):  # les planchers, en zigzag
        a = s if k % 2 == 0 else s + 7
        _ligne(n, a, a + 6, y, '=')
    _ligne(n, s + 2, s + 11, g - 10, '=')  # le dernier plancher, et ses caisses
    _pose(n, s + 3, g - 11, 'C')
    _pose(n, s + 9, g - 11, 'C')
    n.ennemis(s, s + 13, lettres, 3, ymin=g - 12)
    n.repere(s + 6, '*', ymin=g - 12)


def ruines(n, x0, x1, g, lettres, mat):
    _fosse(n, x0, x1, g, lettres)
    hauts = [2, 4, 6, 6, 4, 2] if x1 - x0 >= 40 else [2, 4, 6, 4, 2] if x1 - x0 >= 34 else [2, 4, 4, 2]
    s = (x0 + x1) // 2 - (len(hauts) * 5 - 2) // 2
    for i, h in enumerate(hauts):  # des piliers de trois colonnes, deux de vide entre eux
        for x in range(s + 5 * i, s + 5 * i + 3):
            for y in range(g - h, g):
                _pose(n, x, y, mat)
    n.ennemis(s, s + 5 * len(hauts), lettres, 3, ymin=g - 9)
    n.repere(s + 5 * 2 + 1, '*', ymin=g - 9)


def marche(n, x0, x1, g, lettres, mat):
    _fosse(n, x0, x1, g, lettres)
    nb = max(2, min(3, (x1 - x0 - 8) // 10))
    s = (x0 + x1) // 2 - (nb * 10 - 3) // 2
    for i in range(nb):
        a = s + 10 * i
        for y in range(g - 3, g):  # les poteaux de l'étal
            _pose(n, a - 1, y, '.')
            _pose(n, a + 5, y, '.')
        _pose(n, a + 1, g - 1, 'C')  # le comptoir : des caisses, par où l'on monte sur l'auvent
        _pose(n, a + 2, g - 1, 'C')
        _ligne(n, a - 1, a + 6, g - 3, '^')  # l'auvent
    m = s + 10 * (nb // 2) + 2
    _ligne(n, m - 2, m + 3, g - 5, '=')  # l'enseigne, au-dessus de l'étal du milieu
    n.ennemis(s, s + 10 * nb, lettres, 2 + nb, ymin=g - 7)
    n.repere(m, '+', ymin=g - 7)
