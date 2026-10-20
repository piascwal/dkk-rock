"""Les modules du FISE (le Festival International des Sports Extrêmes, sur les berges du Lez, à Montpellier). Un niveau plat, mais
jamais en ligne droite : chaque zone du festival est un module, et son décor y est placé à la main (`Niveau.decor`), jamais au
hasard ; ce dont on n'a pas encore le sprite est un carré d'attente (voir decor-accessoires.ts).

- `entree` : l'arche du festival et ses barrières.
- `parc_street` : le grand parc noir à plateaux roses (box jump, spine, quarter et son mur), sur un sol noir (`L`, `U`).
- `food_court` : les platanes, l'ombre, les food trucks et leurs tables ; les pissotières au bout.
- `halfpipe_bois` : le Freestyle Park de bois : un deck où l'on monte par une échelle, la descente en courbe, le plat, la
  remontée, l'autre deck.
- `spine` : le mini spine de bois, deux courbes dos à dos.
- `scene_breaking` : l'estrade noire du breaking, son portique, ses enceintes, les b-boys (k).
- `flat_bmx` : la piste de flat, sol noir lisse entre deux barrières, les pros du BMX.
- `village` : les stands des marques (BMX, skate, trottinette, buvette, fringues) et des pissotières.
- `gradins` : une tribune qu'on gravit marche après marche ; une salle dessous (cage ou butin).
- `bigair` : la tour du big air, le bac à mousse au pied, la tyrolienne jusqu'à la piste d'arrivée.
"""
import math

PARC, PLATEAU, RAMPE = 'L', 'U', 'A'


def _pose(n, x, nom, y=None, ecart=3):
    """Le décor à la main, mais jamais devant une échelle (deux tuiles de part et d'autre, cinq au-dessus) ni sur un autre décor."""
    y = n.base if y is None else y
    for dx in range(-2, 3):
        for dy in range(1, 6):
            if n.get(x + dx, y - dy) == 'H':
                return
    if any(abs(x - xx) < ecart and yy == y for _, xx, yy in n.decors):
        return
    n.decor(x, nom, y)


def _colonne(n, x, h, mat, dessus=None):
    """Une colonne pleine de `h` tuiles posée sur le sol ; `dessus` : la matière de la tuile du haut."""
    for k in range(h):
        n.set(x, n.base - 1 - k, dessus if (dessus and k == h - 1) else mat)


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
        _pose(n, x + 2, 'tableFoodCourt')
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
    n.ennemis(x0 + 2, x0 + 2 + deck, lettres, 1, ymin=n.base - haut - 3)
    n.ennemis(x - deck, x, lettres, 1, ymin=n.base - haut - 3)
    n.repere(x - 2, '*', ymin=n.base - haut - 3)


def spine(n, x0, largeur, haut=3, lettres='so'):
    """Le mini spine de bois : une courbe qui monte, l'arête (des pitons : on ne la casse pas), une courbe qui redescend."""
    courbe = list(reversed(_courbe(haut, haut + 1)))
    x = x0 + (largeur - 2 * len(courbe) - 2) // 2
    for h in courbe + [haut, haut] + list(reversed(courbe)):
        if h:
            _colonne(n, x, h, RAMPE, '=' if h == haut else None)
        x += 1
    n.ennemis(x0, x0 + largeur, lettres, 1)


def scene_breaking(n, x0, largeur, lettres='k'):
    """L'estrade noire du breaking : une marche de chaque côté, le portique au fond, deux enceintes, les b-boys dessus."""
    a, b = x0 + 3, x0 + largeur - 3
    for x in range(a, b):
        h = 1 if x in (a, b - 1) else 2
        _colonne(n, x, h, PARC)
    top = n.base - 2
    _pose(n, (a + b) // 2, 'porticoBreaking', top)
    _pose(n, a + 3, 'enceinte34', top)
    _pose(n, b - 4, 'enceinte34', top)
    n.ennemis(a + 2, b - 2, lettres, 3, ymin=top - 3)


def flat_bmx(n, x0, largeur, lettres='px'):
    """La piste de flat : un sol noir lisse, une barrière à chaque bout, les pros du BMX qui y tournent."""
    for x in range(x0 + 1, x0 + largeur - 1):
        n.set(x, n.base, PARC)
    _pose(n, x0 + 2, 'barriere')
    _pose(n, x0 + largeur // 2, 'barriere')
    _pose(n, x0 + largeur - 3, 'barriere')
    n.ennemis(x0 + 3, x0 + largeur - 3, lettres, 3)


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
