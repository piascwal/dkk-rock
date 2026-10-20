"""Les modules du FISE (le Festival International des Sports Extrêmes, sur les berges du Lez, à Montpellier). Un niveau plat, mais
jamais en ligne droite : chaque zone du festival est un module, et son décor y est placé à la main (`Niveau.decor`), jamais au
hasard ; ce dont on n'a pas encore le sprite est un carré d'attente (voir decor-accessoires.ts).

- `entree` : l'arche du festival et ses barrières.
- `parc_street` : le grand parc noir à plateaux roses (box jump, spine, quarter et son mur), sur un sol noir (`L`, `U`).
- `food_court` : les platanes, l'ombre, les food trucks et leurs tables ; les pissotières au bout.
- `halfpipe_bois` : le Freestyle Park de bois : un deck où l'on monte par une échelle, la descente en courbe, le plat, la
  remontée, l'autre deck.
- `spine` : le mini spine de bois, deux courbes dos à dos.
- `breakdance` : une seule plateforme : le BREAK, le jury au centre, le DANCE ; ses danseurs ennemis (k).
- `flat_bmx` : la piste de flat, sol noir lisse, son panneau FLAT, les pros du BMX.
- `village` : les stands des marques (BMX, skate, trottinette, buvette, fringues) et des pissotières.
- `gradins` : une tribune qu'on gravit marche après marche ; une salle dessous (cage ou butin).
- `bigair` : la tour du big air, le bac à mousse au pied, la tyrolienne jusqu'à la piste d'arrivée.

Tout module surélevé a une échelle au départ (`_echelle`) : on ne grimpe pas une rampe ou une estrade autrement.
"""
import math

from structures import complexe

PARC, PLATEAU, RAMPE = 'L', 'U', 'A'


def _libre3(n, x, y):
    """Les neuf cases qu'occupe un décor posé en (x, y) : une de part et d'autre, trois au-dessus du sol de rangée y."""
    return all(n.get(x + dx, y - dy) in ' .' for dx in (-1, 0, 1) for dy in (1, 2, 3))


def _pose(n, x, nom, y=None, ecart=3):
    """Le décor à la main, mais jamais devant une échelle (deux tuiles de part et d'autre, cinq au-dessus), jamais sur une tuile,
    ni sur un autre décor. Renvoie True s'il est posé."""
    y = n.base if y is None else y
    for dx in range(-2, 3):
        for dy in range(1, 6):
            if n.get(x + dx, y - dy) == 'H':
                return False
    if not _libre3(n, x, y):
        return False
    if any(abs(x - xx) < ecart and yy == y for _, xx, yy in n.decors):
        return False
    n.decor(x, nom, y)
    return True


def _colonne(n, x, h, mat, dessus=None):
    """Une colonne pleine de `h` tuiles posée sur le sol ; `dessus` : la matière de la tuile du haut."""
    for k in range(h):
        n.set(x, n.base - 1 - k, dessus if (dessus and k == h - 1) else mat)


def _echelle(n, x, haut):
    """Une échelle de `haut` tuiles, posée sur la colonne libre x, au pied du module : on monte jusqu'à son plateau."""
    for k in range(1, haut + 1):
        n.set(x, n.base - k, 'H')


def _caissons(n, xs, piso, haut=1):
    """Des caissons de basses explosifs posés sur le sol de rangée `piso`, un tous les x de `xs`, un bleu puis un violet : les
    bleus font 5 de dégâts, les violets explosent plus large mais moins fort (3). Deux tuiles de haut au plus : on saute dessus."""
    for i, x in enumerate(xs):
        for k in range(haut if i % 3 else 1):
            n.set(x, piso - 1 - k, 'I' if i % 2 else 'T')


def _plateformes(n, x0, x1, piso, lettres, evite=()):
    """De petites plateformes à deux étages au-dessus du sol de rangée `piso` (on monte de deux tuiles à chaque fois, le saut du
    héros), des caissons explosifs dessus et un ennemi sur chaque planche. `evite` : des x à ne pas encombrer (portiques, jury)."""
    y1, y2 = piso - 2, piso - 4
    x, k = x0, 0
    while x + 8 < x1:
        if any(abs(x + 3 - e) < 9 for e in evite):
            x += 4
            continue
        for xx in range(x, x + 6):
            n.set(xx, y1, '-')
        n.ennemis(x, x + 6, lettres, 1, ymin=y1 - 2)
        n.set(x + 2, y1 - 1, 'T' if k % 2 else 'I')
        if k % 2 == 0:  # un second étage une planche sur deux
            for xx in range(x + 1, x + 5):
                n.set(xx, y2, '-')
            n.set(x + 3, y2 - 1, 'I' if k % 4 == 0 else 'T')
        x += 10
        k += 1


def _courbe(haut, longueur):
    """Les hauteurs d'une courbe de rampe qui descend de `haut` à 0 sur `longueur` colonnes (un quart de cercle)."""
    return [round(haut * (1 - math.sin(math.pi / 2 * (i + 1) / longueur))) for i in range(longueur)]


def entree(n, x0, largeur, lettres='s'):
    """L'arche d'entrée du festival, des barrières de part et d'autre, quelques riders qui attendent."""
    _pose(n, x0 + largeur // 2, 'archeFise')
    _pose(n, x0 + 2, 'barriere')
    _pose(n, x0 + largeur - 3, 'barriere')
    n.ennemis(x0 + 3, x0 + largeur - 2, lettres, 1)


def parc_street(n, x0, largeur, lettres='sot'):
    """Le grand parc noir, sur son sol noir : un box jump (montée, plateau rose, descente), un spine à arête rose, puis un quarter
    qui monte à un plateau rose et retombe d'un mur à pic."""
    for x in range(x0, x0 + largeur):
        n.set(x, n.base, PARC)
    _echelle(n, x0 + 1, 3)  # l'échelle du box jump
    x = x0 + 2
    for h in (1, 2, 3):  # le box jump
        _colonne(n, x, h, PARC)
        x += 1
    for _ in range(6):
        _colonne(n, x, 3, PARC, PLATEAU)
        x += 1
    for h in (3, 2, 1):
        _colonne(n, x, h, PARC)
        x += 1
    n.ennemis(x - 9, x - 3, lettres, 1, ymin=n.base - 6)
    x += 3
    for h in (1, 2, 3, 4, 4, 3, 2, 1):  # le spine, son arête rose
        _colonne(n, x, h, PARC, PLATEAU if h == 4 else None)
        x += 1
    x += 3
    n.ennemis(x - 3, x, lettres, 1)
    _echelle(n, x - 1, 5)  # l'échelle du quarter, collée à la rampe
    for h in (1, 2, 3, 4, 5):  # le quarter et son plateau, puis le mur
        _colonne(n, x, h, PARC)
        x += 1
    for _ in range(4):
        _colonne(n, x, 5, PARC, PLATEAU)
        x += 1
    n.ennemis(x - 4, x, lettres, 1, ymin=n.base - 8)
    n.ennemis(x + 1, x0 + largeur, lettres, 1)
    _pose(n, x0 + 1, 'barriere')
    _pose(n, x0 + largeur - 2, 'barriere')


def food_court(n, x0, largeur, lettres='f'):
    """L'ombre des platanes : des food trucks dessous, des tables devant ; au bout, les pissotières."""
    trucks = ['foodDuke', 'foodRougail', 'foodCroque', 'foodGlace']
    k = 0
    for x in range(x0 + 3, x0 + largeur - 8, 9):
        _pose(n, x, 'platane' if k % 2 == 0 else 'platane2')
        _pose(n, x + 4, trucks[k % 4])
        k += 1
    for x in range(x0 + 6, x0 + largeur - 10, 9):
        _pose(n, x + 2, ['tablePique', 'tableSkate', 'tableBmx', 'tableFamille'][k % 4])
    _pose(n, x0 + largeur - 6, 'pissotiere')
    _pose(n, x0 + largeur - 2, 'pissotiere')
    n.ennemis(x0 + 2, x0 + largeur - 2, lettres, 2)


def halfpipe_bois(n, x0, largeur, haut=5, lettres='sotx'):
    """Le half-pipe de bois : une échelle monte au deck de gauche, la courbe descend jusqu'au plat (en bois lui aussi), la courbe
    remonte au deck de droite ; derrière, le dos de la rampe retombe à pic."""
    courbe = _courbe(haut, haut + 1)
    deck = 4
    plat = largeur - 2 * (deck + len(courbe)) - 4
    x = x0 + 2
    for y in range(n.base - haut, n.base):
        n.set(x - 1, y, 'H')
    for _ in range(deck):
        _colonne(n, x, haut, RAMPE)
        x += 1
    for h in courbe:
        if h:
            _colonne(n, x, h, RAMPE)
        x += 1
    for _ in range(plat):
        n.set(x, n.base, RAMPE)
        x += 1
    n.ennemis(x - plat + 1, x - 1, lettres, 2)
    for h in reversed(courbe):
        if h:
            _colonne(n, x, h, RAMPE)
        x += 1
    for _ in range(deck):
        _colonne(n, x, haut, RAMPE)
        x += 1
    _echelle(n, x, haut)  # l'échelle du deck de droite
    n.ennemis(x0 + 2, x0 + 2 + deck, lettres, 1, ymin=n.base - haut - 3)
    n.ennemis(x - deck, x, lettres, 1, ymin=n.base - haut - 3)
    n.repere(x - 2, '*', ymin=n.base - haut - 3)


def spine(n, x0, largeur, haut=3, lettres='so'):
    """Le mini spine de bois : une courbe qui monte, l'arête (des pitons : on ne la casse pas), une courbe qui redescend."""
    courbe = list(reversed(_courbe(haut, haut + 1)))
    x = x0 + (largeur - 2 * len(courbe) - 2) // 2
    _echelle(n, x - 1, haut)  # l'échelle du spine
    for h in courbe + [haut, haut] + list(reversed(courbe)):
        if h:
            _colonne(n, x, h, RAMPE, '=' if h == haut else None)
        x += 1
    n.ennemis(x0, x0 + largeur, lettres, 1)


def breakdance(n, x0, largeur, lettres='k'):
    """La plateforme du breakdance, une seule estrade noire d'un bout à l'autre : le portique BREAK à gauche, le jury au centre,
    le portique DANCE à droite ; une échelle au pied de la paroi gauche ; des danseurs de décor entre les portiques, et les
    danseurs ennemis (un tous les dix tuiles) sur toute la longueur."""
    a, b = x0 + 3, x0 + largeur - 3
    for x in range(a, b):
        h = 1 if x in (a, b - 1) else 2
        _colonne(n, x, h, PARC)
    _echelle(n, a - 1, 2)  # l'échelle, collée à la paroi
    top = n.base - 2
    c = (a + b) // 2
    _pose(n, a + (c - a) // 2, 'portiqueBreak', top)
    _pose(n, c, 'juryBreak', top)
    _pose(n, c + (b - c) // 2, 'portiqueDance', top)
    _pose(n, a + 1 + (c - a) // 4, 'danseurFise', top)  # des danseurs de décor, entre les portiques et le jury
    _pose(n, c + 3 + (b - c) // 4, 'danseurFise', top)
    n.ennemis(a + 2, b - 2, lettres, max(4, largeur // 10), ymin=top - 3)
    evite = [x for _, x, y in n.decors if y == top]
    _plateformes(n, a + 4, b - 4, top, lettres, evite)
    _caissons(n, [x for x in range(a + 8, b - 6, 9) if all(abs(x - e) > 4 for e in evite)], top)


def flat_bmx(n, x0, largeur, lettres='px'):
    """La piste de flat : un sol noir lisse, une barrière à chaque bout, le panneau FLAT au milieu, les pros du BMX qui y tournent."""
    for x in range(x0 + 1, x0 + largeur - 1):
        n.set(x, n.base, PARC)
    _pose(n, x0 + 2, 'barriere')
    _pose(n, x0 + largeur // 2, 'portiqueFlat')
    _pose(n, x0 + largeur - 3, 'barriere')
    n.ennemis(x0 + 3, x0 + largeur - 3, lettres, 3)
    evite = [x for _, x, y in n.decors if y == n.base and x0 <= x < x0 + largeur]
    _plateformes(n, x0 + 4, x0 + largeur - 4, n.base, lettres, evite)
    _caissons(n, [x for x in range(x0 + 5, x0 + largeur - 5, 6) if all(abs(x - e) > 4 for e in evite)], n.base)


def village(n, x0, largeur, lettres='fs'):
    """Le village des marques : les stands (BMX, skate, trottinette, buvette, fringues), et deux pissotières au bout."""
    stands = [('standBmx', 6), ('buvette', 5), ('standSkate', 6), ('standFringues', 5), ('standTrottinette', 6)]
    x = x0 + 4
    for nom, w in stands:
        if x + w > x0 + largeur - 6:
            break
        _pose(n, x, nom, ecart=w)
        x += w + 4
    _pose(n, x0 + largeur - 5, 'pissotiere')
    _pose(n, x0 + largeur - 2, 'pissotiere')
    n.ennemis(x0 + 2, x0 + largeur - 2, lettres, 3)


def gradins(n, x0, largeur, haut=6, lettres='a', cage=False, butin='+', mat=None):
    """Une tribune : `haut` marches de deux tuiles, un palier de quatre en haut, puis le dos de la tribune, à pic. Dessous, une
    salle de trois tuiles de haut, ouverte par une porte dans le dos de la tribune."""
    mat = mat or n.t['mur']
    base = n.base
    _echelle(n, x0, haut)  # l'échelle de la tribune
    xd = x0 + 1 + 2 * haut + 4  # le dos de la tribune (exclu)
    for x in range(x0 + 1, xd):
        h = min(haut, (x - x0 - 1) // 2 + 1)
        for k in range(h):
            n.set(x, base - 1 - k, mat)
    # la salle sous les gradins : là où la tribune a au moins quatre tuiles d'épaisseur
    sx = x0 + 1 + 2 * 3
    n.rect(sx + 1, base - 3, xd - 1, base, '.')
    n.rect(xd - 1, base - 2, xd, base, ' ')  # la porte, dans le dos
    n.ennemis(sx + 1, xd - 1, lettres, 2, ymin=base - 3)
    n.repere(sx + 2, 'K' if cage else butin, ymin=base - 3)
    for k in range(haut):  # des spectateurs sur les marches
        if k % 2:
            n.ennemis(x0 + 1 + 2 * k, x0 + 3 + 2 * k, lettres, 1, ymin=base - haut - 3)
    n.ennemis(xd, x0 + largeur, lettres, 1)


def bigair(n, x0, largeur, lettres='a'):
    """La tour du big air (trois planchers), le bac à mousse au pied (trois tuiles de creux, une échelle pour en sortir), et la
    tyrolienne du haut de la tour à la piste d'arrivée."""
    base = n.base
    ys = n.echafaudage(x0 + 2, 8, 3)
    for y in ys:
        n.ennemis(x0 + 3, x0 + 9, lettres, 1, ymin=y - 1)
    n.repere(x0 + 5, '*', ymin=ys[-1] - 1)
    p0, p1 = x0 + 12, x0 + 22  # le bac à mousse
    for x in range(p0, p1):
        n.base_col(x, base + 3)
    for y in range(base, base + 3):
        n.set(p1 - 1, y, 'H')
    n.ennemis(p0 + 1, p1 - 2, lettres, 2, ymin=base)
    n.tyro(x0 + 9, ys[-1] - 1, p1 + 3, base - 2)
    n.ennemis(p1 + 2, x0 + largeur, lettres, 1)


def soirees(r, lettres='sotx'):
    """L'envers du décor : trois soirées du FISE sous la surface, sous les zones plates (le food court, le flat, le village). Chacune
    est un complexe à deux étages, en murs de métal comme une boîte de nuit : enceintes, projecteurs, des caissons explosifs, un
    escadron par étage, et une cage ou un médiator au fond. On y descend par une échelle depuis la surface ; ce sont des
    culs-de-sac (avec leur butin) : pas de galerie d'un bout à l'autre du niveau."""
    n, yg = r.n, r.n.yg
    mur = n.t['mur']
    n.t['mur'] = 'M'
    sites = [(x0, x1) for x0, x1, g in r.pieces if g in ('food_court', 'flat_bmx', 'village')]
    for k, (x0, x1) in enumerate(sites):
        x = x0 + 4
        butin = 'K' if k != 1 else '*'
        complexe(n, x, 28, lettres * 2, 5 + k, butin)
        n.puits(x + 8, None, yg - 4)
        for gx in (x - 9, x + 28):  # deux courtes galeries de gardes, qui finissent en cul-de-sac avec un médiator
            n.galerie(gx, gx + 9, alcoves=0)
            n.ennemis(gx, gx + 9, lettres, 1, ymin=yg - 1)
        n.repere(x - 7, '+', ymin=yg - 1)
        milieu = yg - 4
        # le décor de la soirée : pour chacun, la première position libre parmi les candidates (les échelles, les cloisons et les
        # fenêtres des salles en occupent une partie)
        for nom, etage, candidats in (
            ('projecteur', yg + 1, (13, 11, 20, 3)),
            ('enceinteRose', yg + 1, (20, 25, 13, 3)),
            ('lampadaireNeon', yg + 1, (25, 24, 3, 22)),
            ('projecteur', milieu, (3, 19, 24, 22)),
            ('enceinteRose', milieu, (19, 24, 3, 11)),
            ('lampadaireNeon', milieu, (24, 3, 19, 22)),
        ):
            for dx in candidats:
                if _pose(n, x + dx, nom, etage):
                    break
        # des enceintes explosives sur chaque plancher, là où aucun décor ne les masque
        for etage, xs in ((yg + 1, (16, 23, 9, 12)), (milieu, (11, 22, 26, 17))):
            for i, dx in enumerate(xs):
                px = x + dx
                if n.get(px, etage - 1) in ' .' and not any(abs(px - xx) <= 2 and yy == etage for _, xx, yy in n.decors):
                    n.set(px, etage - 1, 'I' if i % 2 else 'T')
    n.t['mur'] = mur
