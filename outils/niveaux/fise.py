"""Les modules du FISE (le Festival International des Sports Extrêmes, à Montpellier) : un niveau plat, mais pas en ligne droite.

- `bowl` : une cuvette de béton qu'on traverse par le fond (des marches d'une tuile), des riders dedans, le butin au fond.
- `rampes` : une funbox (une rampe qui monte, un plateau, une rampe qui redescend) puis un rail de planches à hauteur de tête,
  qu'on longe dessous ou qu'on prend dessus.
- `gradins` : une tribune qu'on gravit marche après marche ; on redescend derrière, où une porte mène sous les gradins (une
  salle gardée, avec une cage ou du butin).
- `bigair` : la tour de départ du big air (un échafaudage), le bac à mousse au pied (qu'on traverse en descendant dedans), et une
  tyrolienne du haut de la tour jusqu'à la piste d'arrivée, au-delà du bac.
"""


def bowl(n, x0, largeur, profondeur=4, lettres='a', butin='*'):
    """Une cuvette de `profondeur` tuiles : chaque colonne descend d'une tuile, jusqu'au fond plat. `base` ne change pas."""
    base = n.base
    for i in range(largeur):
        n.base_col(x0 + i, base + max(0, min(profondeur, i, largeur - 1 - i)))
    n.ennemis(x0 + profondeur, x0 + largeur - profondeur, lettres, 2, ymin=base)
    n.repere(x0 + largeur // 2, butin, ymin=base)


def rampes(n, x0, largeur, haut=3, lettres='a'):
    """Une funbox de `haut` tuiles (des marches d'une tuile), puis un rail de planches à deux tuiles du sol, où l'on passe dessous."""
    mat = n.t['mur']
    base = n.base
    box = largeur - 10  # la funbox ; le rail prend la fin de la pièce
    for i in range(box):
        h = min(haut, i + 1, box - i)
        for k in range(h):
            n.set(x0 + i, base - 1 - k, mat)
    n.ennemis(x0 + haut, x0 + box - haut, lettres, 1, ymin=base - haut - 3)
    for x in range(x0 + box + 2, x0 + largeur - 1):  # le rail
        n.set(x, base - 3, '-')
    n.ennemis(x0 + box + 2, x0 + largeur - 1, lettres, 1, ymin=base - 6)


def gradins(n, x0, largeur, haut=6, lettres='a', cage=False, butin='+'):
    """Une tribune : `haut` marches de deux tuiles, un palier de quatre en haut, puis le dos de la tribune, à pic. Dessous, une
    salle de trois tuiles de haut, ouverte par une porte dans le dos de la tribune."""
    mat = n.t['mur']
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
