"""Le dessous des niveaux : plus de galerie d'un bout à l'autre (de longues lignes droites sans intérêt) mais des lieux,
chacun entré par une échelle depuis la surface : des complexes en pierre à deux étages (avec leurs courtes galeries de
gardes), des cavernes à pitons, des caches murées à creuser. Tout y est optionnel, sauf les gouffres de surface, qui
portent leur propre fond (voir verrous.py)."""
from structures import complexe


def place_libre(x, largeur, pris, w, n, yg, sol_max):
    """Le x le plus proche de `x` où une salle de `largeur` colonnes ne recoupe aucun des intervalles `pris` et où la
    terre au-dessus fait au moins deux rangées (la surface ne dépasse pas la rangée `sol_max`)."""
    for d in range(0, 160, 4):
        for cand in (x + d, x - d):
            if not 14 <= cand <= w - largeur - 14:
                continue
            if any(not (cand + largeur < a or cand > b) for a, b in pris):
                continue
            if max(n.haut[cand : cand + largeur]) > sol_max:
                continue
            return cand
    return None


def souterrain(r, ennemis='a'):
    n, w, yg = r.n, r.n.w, r.n.yg
    pris = [(a - 4, b + 4) for a, b, g in r.pieces if g in ('forteresse', 'traversee', 'barrage', 'gouffre', 'parking', 'falaise', 'glacier', 'ponton', 'toits')]
    lieux = ['complexe', 'caverne', 'complexe', 'cache', 'complexe', 'caverne']
    butins = ['K', '*', 'K', '+', 'K', '*']  # des cages : on en veut plusieurs par niveau
    nb = max(5, w // 85)
    dore = False  # le tonneau d'or WOG : un seul par niveau, dans la première cache
    for i in range(nb):
        genre, butin = lieux[i % len(lieux)], butins[i % len(butins)]
        largeur = {'complexe': 28, 'caverne': 18, 'cache': 8}[genre]
        sol_max = yg - {'complexe': 11, 'caverne': 9, 'cache': 10}[genre]
        x = place_libre(int(w * (i + 0.5) / nb) - largeur // 2, largeur, pris, w, n, yg, sol_max)
        if x is None:
            continue
        pris.append((x - 10, x + largeur + 10))
        if genre == 'complexe':
            complexe(n, x, largeur, ennemis * 2, 5 + i % 3, butin)
            n.puits(x + 8, None, yg - 4)  # de la surface à l'étage du haut
            # deux courtes galeries de part et d'autre, tenues par des gardes, qui finissent en cul-de-sac avec un médiator
            for x0 in (x - 9, x + largeur):
                n.galerie(x0, x0 + 9, alcoves=0)
                n.ennemis(x0, x0 + 9, ennemis, 1, ymin=yg - 1)
            n.repere(x - 7, '+', ymin=yg - 1)
            n.repere(x + largeur - 8, 'O', ymin=yg - 9)  # un tonneau WOG sur le plancher du haut
        elif genre == 'caverne':
            px, py = n.caverne(x, largeur, 7)
            n.puits(x + 2)
            n.repere(px, butin, ymin=py - 2)
            if i < 3:
                n.repere(px + 2, 'O', ymin=py - 2)
            n.ennemis(x + 4, x + largeur - 2, ennemis, 3, ymin=yg - 8)
        else:
            cx, cy = n.cache(x + 2, yg - 5, 4, 3)
            if dore:
                n.set(cx, cy, butin)
            else:
                n.set(cx, cy, 'Q')
                dore = True


def tonneaux_de_surface(r):
    """Des tonneaux WOG sur le terrain : un raccord sur deux en tonneau de bois, et au milieu du parcours un tonneau d'or
    bien en vue (on le voit forcément, pas seulement dans une cache). Sans raccord assez large, pas de tonneau d'or sur le
    terrain (la cache en garde un)."""
    n = r.n
    raccords = [(a, b) for a, b, g in r.pieces if g == 'raccord' and b - a >= 4]
    for k, (a, b) in enumerate(raccords):
        if k % 2 == 0:
            n.repere(a + 1, 'O', ymin=n.base - 3, surface=True)
    if raccords:
        a, b = raccords[len(raccords) // 2]
        n.repere(a + 1, 'Q', ymin=n.base - 3, surface=True)
