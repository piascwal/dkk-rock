"""Les outils des niveaux faits à la main, zone par zone (le FISE, Saint-Cézaire, les gorges de la Siagne) : poser un décor là où il
a la place, monter une colonne ou une échelle, couvrir une maison d'un toit de tuiles, semer un tronçon de végétation."""


def libre3(n, x, y):
    """Les neuf cases qu'occupe un décor posé en (x, y) : une de part et d'autre, trois au-dessus du sol de rangée y (l'eau
    compte comme libre : des roseaux, un figuier les pieds dans la rivière, se voient à travers)."""
    return all(n.get(x + dx, y - dy) in ' .~' for dx in (-1, 0, 1) for dy in (1, 2, 3))


def pose(n, x, nom, y=None, ecart=3):
    """Le décor à la main, mais jamais devant une échelle (deux tuiles de part et d'autre, cinq au-dessus), jamais sur une tuile,
    ni sur un autre décor. Renvoie True s'il est posé."""
    y = n.base if y is None else y
    for dx in range(-2, 3):
        for dy in range(1, 6):
            if n.get(x + dx, y - dy) == 'H':
                return False
    if not libre3(n, x, y):
        return False
    if any(abs(x - xx) < ecart and yy == y for _, xx, yy in n.decors):
        return False
    n.decor(x, nom, y)
    return True


def colonne(n, x, h, mat, dessus=None):
    """Une colonne pleine de `h` tuiles posée sur le sol ; `dessus` : la matière de la tuile du haut."""
    for k in range(h):
        n.set(x, n.base - 1 - k, dessus if (dessus and k == h - 1) else mat)


def echelle(n, x, haut, sol=None):
    """Une échelle de `haut` tuiles, posée sur la colonne libre x, au pied du module (ou sur le sol de rangée `sol`)."""
    sol = n.base if sol is None else sol
    for k in range(1, haut + 1):
        n.set(x, sol - k, 'H')


def toit(n, x0, x1, y, mat='^'):
    """Un toit de tuiles à deux pentes sur [x0, x1), son égout en rangée y : chaque rang monte d'une tuile et rentre d'une tuile
    de chaque côté. On y marche, on saute de toit en toit."""
    k = 0
    while x0 + k < x1 - k:
        for x in range(x0 + k, x1 - k):
            n.set(x, y - k, mat)
        k += 1


def seme(n, x0, x1, noms, pas=(4, 8), sol=None):
    """Sème du décor de `noms` (à tour de rôle) sur le sol de [x0, x1), tous les `pas` tuiles, là où il a la place."""
    k = 0
    x = x0 + n.rng.randrange(*pas)
    while x < x1:
        y = n.sol(x) if sol is None else sol
        if y is not None and pose(n, x, noms[k % len(noms)], y, ecart=2):
            k += 1
        x += n.rng.randrange(*pas)
