"""Les blocs d'immeubles, à la manière de Broforce : des tours pleines de pièces, posées chacune sur son massif de terre (que le
réseau de galeries creuse, voir massifs.py), séparées par des vides sans fond. On ne passe d'une tour à l'autre que par une
passerelle tendue entre deux étages, ou par une tyrolienne depuis le toit vers la tour suivante, plus basse.

Une tour : des étages de ETAGE rangées (la dalle comprise), de largeurs et de places différentes (pas de façade lisse : des
étages qui glissent, débordent ou rentrent, des terrasses), chacun coupé en pièces par des cloisons (une porte au ras du sol),
des échelles d'un étage à l'autre, jamais l'une au-dessus de l'autre (pour monter, il faut traverser), des fenêtres, des caisses,
des caissons, des barils, des gardes à chaque étage, du butin, et sur le toit des guetteurs. Chaque dalle a ses pitons (on peut la
casser, on passe encore) et au moins une échelle : tout étage se rejoint, le toit aussi.

Un bloc laisse au suivant de quoi se raccorder (`r.lien`) : la rangée de la passerelle (la tour suivante y ouvre une porte, sur
un de ses planchers), ou le départ de la tyrolienne (la tour suivante a son toit plus bas). Le dernier bloc d'une suite (`lien`
None) rend la main au terrain : une porte au rez-de-chaussée, le sol à sa hauteur.
"""
from hauteurs import abime, pont

ETAGE = 5  # la hauteur d'un étage, dalle comprise : quatre rangées de pièce
PROPS = ['C', 'T', '%', 'C', 'O', 'T']
BUTINS = ['+', '*', '+', '*']
SOUS_BUTINS = ['*', '+', 'O', '*', '%', '+']  # sous terre, à chaque étage d'un bunker


def place_libre(n, a, b, haut, sol, rng):
    """Une colonne de [a + 3, b - 3) où poser un objet au sol de l'étage (rangées haut à sol - 1) : jamais dans l'embrasure d'une
    cloison, au pied d'une échelle ni sur une trappe ; None si l'on n'en trouve pas."""
    for _ in range(6):
        px = rng.randrange(a + 3, max(a + 4, b - 3))
        if all(n.get(x, y) == '.' for x in (px - 1, px, px + 1) for y in range(haut, sol)) and 'H' not in (
            n.get(px - 1, sol), n.get(px, sol), n.get(px + 1, sol)
        ):
            return px
    return None



def _plancher(g, j):
    """La rangée où l'on marche à l'étage j (0 : le rez-de-chaussée, sur le terrain à la rangée g)."""
    return g - j * ETAGE


def _etendues(w, etages, forces, rng):
    """L'étendue (début, fin) de chaque étage dans l'emprise [0, w) de la tour : pas de façade lisse. D'un étage à l'autre, au
    hasard : il glisse vers la droite (ou la gauche), s'élargit jusqu'au bord, rétrécit au milieu, ou garde la largeur du dessous.
    Le rez-de-chaussée et les étages à porte imposée (`forces` : étage -> 'g', 'd' ou 'gd') touchent le bord de l'emprise. Deux
    étages voisins se recouvrent toujours d'au moins six colonnes (une échelle y passe)."""
    etendues = []
    a, b = 0, w
    for j in range(etages):
        if j:
            pa, pb = etendues[-1]
            facon = rng.choice(('glisse', 'glisse', 'recule', 'large', 'etroit', 'etroit', 'pareil'))
            if facon in ('glisse', 'recule'):
                d = rng.randrange(2, 5) * (1 if facon == 'glisse' else -1)
                a, b = max(0, pa + d), min(w, pb + d)
            elif facon == 'large':  # plus grand que le dessous : il déborde, d'un côté ou des deux
                a, b = (0 if rng.random() < 0.7 else pa), (w if rng.random() < 0.7 else pb)
            elif facon == 'etroit':  # plus petit : un retrait de chaque côté, le toit du dessous fait des terrasses
                r = rng.randrange(2, max(3, (pb - pa - 10) // 2 + 1))
                a, b = pa + r, pb - rng.randrange(1, r + 1)
            else:
                a, b = pa, pb
            if b - a < 10:
                a, b = pa, pb
            if min(b, pb) - max(a, pa) < 6:
                a, b = pa, pb
        f = forces.get(j, '')
        if j == 0 or 'g' in f:
            a = 0
        if j == 0 or 'd' in f:
            b = w
        etendues.append((a, b))
    return etendues


def tour(n, x0, w, g, etages, mat, lettres, portes_g=(), portes_d=(), rng=None, butin=0, dehors=True):
    """Une tour de `etages` étages dans l'emprise [x0, x0 + w), son rez-de-chaussée sur la rangée g. `portes_g` / `portes_d` : les
    étages dont le mur de gauche / de droite (au bord de l'emprise) a une porte. Les étages n'ont pas tous la même largeur : là où
    l'étage du dessous dépasse, son toit fait une terrasse, et une porte y donne. `dehors` False : un bunker sous terre (ni
    terrasses, ni fenêtres, ni guetteurs sur le toit : la roche l'entoure). Renvoie la rangée du toit et l'étendue du dernier étage."""
    rng = rng or n.rng
    forces = {}
    for j in portes_g:
        forces[j] = forces.get(j, '') + 'g'
    for j in portes_d:
        forces[j] = forces.get(j, '') + 'd'
    et = [(x0 + a, x0 + b) for a, b in _etendues(w, etages, forces, rng)]
    top = _plancher(g, etages)
    for j, (a, b) in enumerate(et):  # chaque étage : sa boîte, ses deux murs
        sol = _plancher(g, j)
        n.rect(a, sol - ETAGE + 1, b, sol, '.')
        for y in range(sol - ETAGE + 1, sol):
            n.set(a, y, mat)
            n.set(b - 1, y, mat)
    echelles_dessous = []
    for k in range(1, etages + 1):  # la dalle k : le plafond de l'étage k - 1 et le plancher de l'étage k (leurs deux étendues)
        ys = _plancher(g, k)
        (a0, b0), (a1, b1) = et[k - 1], et[k] if k < etages else et[k - 1]
        for x in range(min(a0, a1), max(b0, b1)):
            n.set(x, ys, '=' if (x - x0) % 5 == 2 else mat)
        # une ou deux échelles là où les deux étages se recouvrent, loin de celles de la dalle d'en dessous
        libres = [x for x in range(max(a0, a1) + 2, min(b0, b1) - 2) if all(abs(x - e) > 3 for e in echelles_dessous)]
        libres = libres or list(range(max(a0, a1) + 2, min(b0, b1) - 2))
        choix = rng.sample(libres, min(len(libres), 1 + (w >= 22)))
        for gx in choix:
            for y in range(ys, _plancher(g, k - 1)):
                n.set(gx, y, 'H')
        echelles_dessous = choix
        # une terrasse : là où l'étage du dessous dépasse, une porte de l'étage k y donne, et un garde s'y tient
        if k < etages and dehors:
            for cote, mur, dehors_ in (('g', a1, range(a0, a1)), ('d', b1 - 1, range(b1, b0))):
                if len(dehors_) >= 3:
                    n.rect(mur, ys - 2, mur + 1, ys, ' ')
                    n.ennemis(dehors_.start, dehors_.stop, lettres, 1, ymin=ys - 2)
    for j, (a, b) in enumerate(et):  # l'étage j : cloisons, fenêtres, décor, gardes
        sol = _plancher(g, j)
        haut = sol - ETAGE + 1
        for _ in range(1 + (b - a >= 20)):
            cx = rng.randrange(a + 4, max(a + 5, b - 4))
            if all(n.get(cx, y) == '.' for y in range(haut, sol)):
                for y in range(haut, sol - 2):  # une cloison, sa porte au ras du sol
                    n.set(cx, y, mat)
        for x in (a, b - 1):
            if dehors and rng.random() < 0.6 and n.get(x, sol - 3) == mat:
                n.set(x, sol - 3, 'V')
        # des caisses, caissons, barils ou tonneaux (plus sous terre, où l'on se bat à couvert) ; un butin par étage sous terre
        for k in range(1 if dehors else 3):
            px = place_libre(n, a, b, haut, sol, rng)
            if px is not None:
                n.set(px, sol - 1, PROPS[(j + k + x0) % len(PROPS)])
        if not dehors:
            n.repere(rng.randrange(a + 2, b - 2), SOUS_BUTINS[(j + x0) % len(SOUS_BUTINS)], ymin=haut)
        gardes = 1 + (j > 0) + (b - a >= 22) if dehors else 2 + (b - a >= 18) + rng.randrange(2)
        n.ennemis(a + 2, b - 2, lettres, gardes, ymin=haut)
    for j in portes_g:
        n.rect(x0, _plancher(g, j) - 2, x0 + 1, _plancher(g, j), ' ')
    for j in portes_d:
        n.rect(x0 + w - 1, _plancher(g, j) - 2, x0 + w, _plancher(g, j), ' ')
    # le butin, à un étage tiré au sort ; des guetteurs et un parapet sur le toit
    j = rng.randrange(1, etages) if etages > 1 else 0
    a, b = et[j]
    n.repere(rng.randrange(a + 2, b - 2), BUTINS[butin % len(BUTINS)], ymin=_plancher(g, j) - ETAGE + 1)
    a, b = et[-1]
    if dehors:
        for x in range(a, b, 5):
            n.set(x, top - 1, '=')
        n.ennemis(a + 2, b - 2, lettres, 1 + (w >= 22), ymin=top - 2)
    return top, a, b


def bloc(r, x0, x1, etages=4, ecart=8, lien='passerelle', lettres='ac', mat=None, monte=0):
    """Une tour sur son massif, puis (sauf pour le dernier bloc d'une suite) le vide jusqu'au bloc suivant et ce qui le franchit.
    `lien` : 'passerelle' ou 'tyro' (au-dessus du vide), 'rue' (pas de vide : la rue entre les deux tours, au même niveau, et une
    passerelle métallique droite au-dessus, d'un étage à l'autre) ou None (le dernier bloc de la suite).
    `monte` : la tour se pose plus haut (négatif) ou plus bas que le terrain courant, quand rien ne l'impose."""
    n, rng = r.n, r.n.rng
    mat = mat or n.t['mur']
    w = x1 - x0 - (ecart if lien else 0)
    attente = getattr(r, 'lien', None)
    voulu = n.base + monte
    portes_g = [0]
    if attente and attente[0] == 'rue':
        # de l'autre côté de la rue, au même niveau : la passerelle arrive à un étage de cette tour (au besoin le dernier)
        g = attente[2]
        portes_g = [0, min(attente[3], etages - 1)]
        if attente[3] > etages - 1:
            etages = attente[3] + 1
    elif attente and attente[0] == 'passerelle':
        # un plancher de cette tour doit tomber sur la passerelle : le rez-de-chaussée en est à un nombre entier d'étages
        yb = attente[1]
        j = min(range(1, etages), key=lambda j: abs(yb + j * ETAGE - voulu))
        g = yb + j * ETAGE
        portes_g = [j]
    elif attente and attente[0] == 'tyro':
        g = max(voulu, attente[2] + 4 + etages * ETAGE)  # le toit, plus bas que le départ de la tyrolienne
        portes_g = []
    else:
        g = voulu
    g = min(g, n.bas - 14)
    for x in range(x0, x0 + w):
        n.base_col(x, g)
    portes_d = [] if lien in ('passerelle', 'tyro') else [0]
    jp = None
    if lien in ('passerelle', 'rue'):
        jp = rng.randrange(1, etages)
        portes_d.append(jp)
    top, ta, tb = tour(n, x0, w, g, etages, mat, lettres, portes_g, portes_d, rng, butin=x0 // 7)
    if attente and attente[0] == 'tyro':  # la tyrolienne du bloc précédent arrive sur ce toit
        n.tyro(attente[1], attente[2], ta + 3, top - 2)
    n.repere(x0 + 3, '!', ymin=g - ETAGE + 1)  # un drapeau au rez-de-chaussée de chaque tour
    if not lien:
        r.lien = None
        n.base = g
        return
    if lien == 'rue':  # la rue reste au sol, la passerelle passe au-dessus, droite et métallique (des pitons de place en place)
        yb = _plancher(g, jp)
        for x in range(x0 + w, x1):
            n.set(x, yb, '=' if (x - x0 - w) % 4 == 0 else '-')
        r.lien = ('rue', x1, g, jp)
        n.base = g
        return
    abime(n, x0 + w, x1)
    if lien == 'passerelle':
        yb = _plancher(g, jp)
        pont(n, x0 + w, x1, yb, creux=1)
        r.lien = ('passerelle', yb)
    else:  # la tyrolienne part du bord du toit
        r.lien = ('tyro', tb - 2, top - 2)
    n.base = g
