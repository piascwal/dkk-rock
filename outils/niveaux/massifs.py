"""Les entrailles des massifs (le chantier du level design, à la manière de Broforce). Un niveau qui monte et descend laisse
sous ses plateaux de grands blocs de roche pleins, sans rien à y faire. On y creuse un réseau :

- des galeries jusqu'à cinq profondeurs sous la surface (tant que le massif est assez épais), en tronçons (jamais d'un bout à
  l'autre) ; chaque galerie d'un étage plus bas passe sous deux galeries du dessus et remonte des deux côtés (un treillis, pas
  un arbre : on ne revient pas sur ses pas) ;
- reliées par des échelles : de la surface (ou du rez-de-chaussée d'une tour) au premier étage, d'un étage à ceux du dessous ;
- des salles plus hautes, gardées, avec un piton où se tient un garde ; en profondeur, des cavernes à pitons en escalier ;
- du butin au bout des culs-de-sac (médiators, armes, tonneaux WOG, barils, quelques cages) ;
- des fenêtres sur la falaise quand une galerie arrive au bord d'un vide : on voit dehors, et on peut en tomber.

Rien n'y est obligatoire : la surface ne change pas (la galerie la plus haute laisse trois rangées de terre au-dessus d'elle),
et le chemin de tout le monde reste dehors. Le réseau est une autre route, à l'abri du ciel mais dans le noir, avec ses gardes.
On ne creuse que la terre et la roche naturelles : les forts, les puits et les grottes des modules restent tels quels.
"""

PROFONDEURS = (5, 10, 15, 20, 25)  # la rangée du sol de chaque étage, sous la surface la plus basse du tronçon
HAUT = 3  # la hauteur d'une galerie (un héros en fait deux)
TRONCON = (10, 30)  # la longueur d'un tronçon de galerie
ROCHE_ENTRE = (3, 6)  # la roche laissée entre deux tronçons du même étage (on la creuse, ou on fait le détour)
BUTINS = ['+', '*', 'O', '%', '+', 'K', '*', 'O']


def _naturel(n, c):
    return c in (n.t['sol'], n.t['sous'], n.t['profond'], '#', 'R')


def _plein(n, x0, x1, y0, y1):
    return all(_naturel(n, n.get(x, y)) for x in range(x0, x1) for y in range(y0, y1))


def _troncons(n, rng):
    """Les tronçons de massif : des colonnes de terre pleine sur au moins 12 rangées, coupés en morceaux. Sous un module (un fort,
    un puits, une grotte), la terre pleine commence plus bas : `toit` en garde la première rangée, colonne par colonne."""
    toit = [None] * n.w
    for x in range(n.w):
        toit[x] = next((y for y in range(n.haut[x] + 1, n.haut[x] + 12) if y + 12 < n.bas and _plein(n, x, x + 1, y, y + 12)), None)
    n.toit = toit
    epais = [t is not None for t in toit]
    morceaux = []
    x = 10
    while x < n.w - 10:
        if not epais[x]:
            x += 1
            continue
        fin = x
        while fin < n.w - 10 and epais[fin]:
            fin += 1
        a, bord = x + 2, fin - 2  # une paroi de deux tuiles au bord du massif : la galerie ne s'ouvre pas d'elle-même sur le vide
        while bord - a >= TRONCON[0]:
            longueur = min(bord - a, rng.randrange(*TRONCON))
            morceaux.append((a, a + longueur))
            a += longueur + rng.randrange(*ROCHE_ENTRE)
        x = fin
    return morceaux


def _galerie(n, a, b, sol):
    """Creuse [a, b) sur HAUT rangées au-dessus de la rangée `sol` (le plancher, qui reste plein)."""
    n.rect(a, sol - HAUT + 1, b, sol + 1, ' ')


def _fenetres(n, a, b, sol):
    """Au bord d'un vide (moins de cinq tuiles de roche jusqu'au dehors), la galerie s'ouvre sur la falaise."""
    for bout, pas in ((a - 1, -1), (b, 1)):
        for k in range(5):
            x = bout + pas * k
            if n.get(x, sol - 1) == ' ' and n.get(x, sol) == ' ':
                for xx in range(bout, x, pas):
                    for y in range(sol - 1, sol + 1):
                        n.set(xx, y, ' ')
                break
            if not _naturel(n, n.get(x, sol - 1)):
                break


def reseau(r, lettres='a'):
    """Le réseau de galeries sous tous les massifs du niveau (voir en tête de fichier)."""
    n, rng = r.n, r.n.rng
    etages = [[] for _ in PROFONDEURS]  # par étage : (a, b, sol)
    segments = _troncons(n, rng)  # le premier étage : les tronçons des massifs, calculés avant de creuser
    for k, prof in enumerate(PROFONDEURS):
        if k:
            # un étage plus bas : sous deux galeries voisines du dessus (le même massif, un peu de roche entre elles), du milieu de
            # l'une au milieu de l'autre. Chaque galerie profonde remonte des deux côtés : descendre fait passer sous la roche et
            # ressortir plus loin, jamais revenir sur ses pas
            dessus = etages[k - 1]
            segments = [((a1 + b1) // 2, (a2 + b2) // 2) for (a1, b1, _), (a2, b2, _) in zip(dessus, dessus[1:]) if a2 - b1 <= 8]
        for a, b in segments:
            if b - a < TRONCON[0] - 2:
                continue
            sol = max(n.toit[a:b]) + prof - 1
            if sol + 3 >= n.bas or not _plein(n, a - 1, b + 1, sol - HAUT, sol + 2):
                continue
            _galerie(n, a, b, sol)
            etages[k].append((a, b, sol))
    butin = 0
    for k, galeries in enumerate(etages):
        for i, (a, b, sol) in enumerate(galeries):
            # l'accès : une échelle vers chaque galerie du dessus qui la recouvre (deux, d'ordinaire), sinon de la surface
            dessus = [(a2, b2, s2) for a2, b2, s2 in (etages[k - 1] if k else []) if a2 + 2 < b - 2 and a + 2 < b2 - 2]
            for a2, b2, s2 in dessus[:2]:
                x = rng.randrange(max(a, a2) + 1, min(b, b2) - 1)
                for y in range(s2, sol + 1):
                    n.set(x, y, 'H')
            if not dessus:
                # du dehors, ou du rez-de-chaussée d'une tour (une trappe dans son plancher)
                x = next((x for x in (a + 2, b - 3, (a + b) // 2) if n.get(x, n.haut[x] - 1) in ' .' and n.get(x, n.haut[x] - 2) in ' .'), None)
                if x is None:
                    continue
                for y in range(n.haut[x], sol + 1):
                    n.set(x, y, 'H')
            # en profondeur, une galerie sur deux est une caverne : haute, des pitons en escalier, le butin sur le plus haut
            if k >= 2 and i % 2 == 0 and _plein(n, a, b, sol - 8, sol - HAUT + 1):
                px, py = n.caverne(a + 1, b - a - 2, 7, y=sol)
                n.repere(px, BUTINS[butin % len(BUTINS)], ymin=py - 2)
                butin += 1
            # une salle sur trois : plus haute, un piton au milieu et son garde
            elif i % 3 == 1 and b - a >= 20:
                m = (a + b) // 2
                if _plein(n, m - 5, m + 5, sol - HAUT - 3, sol - HAUT + 1):
                    n.rect(m - 5, sol - HAUT - 2, m + 5, sol - HAUT + 1, ' ')
                    for xx in range(m - 2, m + 2):
                        n.set(xx, sol - 3, '=')
                    n.ennemis(m - 2, m + 2, lettres, 1, ymin=sol - 5)
            # les gardes, et le butin au bout opposé à l'échelle
            n.ennemis(a + 2, b - 2, lettres, 1 + (b - a > 22) + (k >= 2), ymin=sol - HAUT)
            bout = b - 2 if x - a < b - x else a + 1
            n.repere(bout, BUTINS[butin % len(BUTINS)], ymin=sol - HAUT)
            butin += 1
            _fenetres(n, a, b, sol)
