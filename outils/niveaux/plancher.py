"""Le plancher : pas de roche peinte jusqu'au bas de la carte. Sous les galeries les plus basses, quelques rangées de roche, puis
le vide ; le jeu y voit le bas du terrain (Carte.plancher) : la caméra s'y arrête, et qui tombe dessous est perdu (comme dans
Broforce : on meurt en sortant de l'écran par le bas, pas en touchant le fond de la carte).

Le bas du terrain ne suit pas chaque galerie : il est, en chaque colonne, le plus profond de ce qu'il faut porter à moins d'une
largeur d'écran (`RAYON` colonnes) de part et d'autre. Ainsi, d'où que l'on regarde, toutes les colonnes à l'écran descendent au
moins aussi bas que ce qu'on y voit : jamais de vide sous le terrain à l'écran, ni de mort alors qu'on voit encore de la roche
plus bas à côté.
"""

# la matière du terrain (ce qu'on enlève sous le plancher) ; le reste (vide, échelles, eau, ennemis, repères...) est à porter
MASSIF = set('#RNSDXG{')
# ce qui descend jusqu'au bas de la carte sans être à porter (la barrière de l'arène, peinte d'un bord à l'autre)
IGNORE = set('|')
# les colonnes vues de part et d'autre (un écran fait jusqu'à 44 colonnes de large) ; la marge de roche sous le plus bas
RAYON = 28
MARGE = 3


def allege(n):
    """Retire la roche sous le plancher, puis les rangées vides du bas de la carte."""
    besoin = []
    for x in range(n.w):
        col = [n.g[y][x] for y in range(n.h)]
        # le vide sans fond du bas de la colonne (sous un gouffre, sous une corniche) n'est pas à porter
        fin = n.h
        while fin > 0 and col[fin - 1] not in MASSIF:
            fin -= 1
        if fin == 0:
            besoin.append(None)  # un gouffre : rien à porter, il reste vide
            continue
        bas = max((y for y in range(fin) if col[y] not in MASSIF and col[y] not in IGNORE), default=0)
        besoin.append(min(n.h - 1, bas + MARGE))
    for x in range(n.w):
        if besoin[x] is None:
            continue
        voisins = [b for b in besoin[max(0, x - RAYON) : x + RAYON + 1] if b is not None]
        fond = max(voisins)
        for y in range(fond + 1, n.h):
            if n.g[y][x] in MASSIF or n.g[y][x] in IGNORE:
                n.g[y][x] = ' '
    while n.h > 1 and all(c == ' ' for c in n.g[-1]):
        n.g.pop()
        n.h -= 1
