"""Les détours : des massifs de pierre de taille (`[`, cinq fois plus dure que la pierre) en travers du chemin. Les casser prend
une éternité ; il y a toujours un chemin plus court autour, par-dessus ou par-dessous : on a envie de faire le tour.

- `bastion` : un bloc plein, un escalier de pitons contre sa face pour passer par-dessus, une galerie sous ses fondations ;
- `passe_haute` : un mur de pierre de taille jusqu'en haut de l'écran, percé seulement en hauteur : on monte par des corniches
  jusqu'à la brèche, on redescend de l'autre côté par une échelle scellée ;
- `puits` : le sol se dérobe sur une dalle de pierre de taille ; le seul passage est dessous, par un puits et une galerie.

Comme partout, le test d'accessibilité vérifie qu'on passe sans rien casser.
"""


def escalier(n, xa, xb, bas, haut, mat='='):
    """Des marches de deux tuiles, une tous les deux rangs (la hauteur d'un saut prudent), de la rangée `bas` (exclue) jusqu'à la
    rangée `haut` (incluse), en zigzag entre les colonnes `xa` et `xb` : jamais deux marches l'une au-dessus de l'autre à moins de
    quatre rangs, la tête passe. La plus haute est en `xa`."""
    y, k = haut, 0
    while y < bas:
        x = xa if k % 2 == 0 else xb
        for xx in range(x, x + 2):
            n.set(xx, y, mat)
        y += 2
        k += 1


def bastion(n, x0, largeur, haut=8, lettres='a', butin='+'):
    """Un bastion plein de `haut` rangées (pair) : à gauche, des pitons en zigzag jusqu'au chemin de ronde ; à droite, on saute.
    Ses fondations s'enfoncent de trois rangs ; dessous passe une galerie, d'une échelle à l'autre, avec le butin au milieu."""
    base = n.base
    haut -= haut % 2
    b0, b1 = x0 + 6, x0 + largeur - 4
    top = base - haut
    n.rect(b0, top, b1, base + 3, '[')
    escalier(n, b0 - 2, b0 - 5, base, top + 2)
    # la galerie sous les fondations, entre deux échelles
    n.rect(b0 - 3, base + 3, b1 + 2, base + 5, ' ')
    for xe in (b0 - 3, b1 + 1):
        for yy in range(base, base + 5):
            n.set(xe, yy, 'H')
    if butin:
        n.repere((b0 + b1) // 2, butin, ymin=base + 3)
    n.ennemis(b0 + 1, b1 - 1, lettres, 1, ymin=top - 3)
    n.ennemis(b1 + 2, x0 + largeur, lettres, 1)


def passe_haute(n, x0, largeur, haut=10, lettres='a', butin='+'):
    """Un mur de pierre de taille de deux tuiles d'épaisseur, du haut de la carte jusque sous le sol, percé d'une brèche à `haut`
    rangées (pair) du sol. Devant, un escalier de corniches de bois jusqu'au palier de la brèche ; derrière, une échelle scellée
    redescend."""
    base = n.base
    haut -= haut % 2
    xm = x0 + largeur - 5
    breche = base - haut
    n.rect(xm, 0, xm + 2, base + 3, '[')
    n.rect(xm, breche - 3, xm + 2, breche, ' ')
    for x in range(xm - 3, xm):  # le palier devant la brèche
        n.set(x, breche, '=')
    escalier(n, xm - 6, xm - 3, base, breche + 2, '-')
    for yy in range(breche, base):  # l'échelle scellée, de l'autre côté
        n.set(xm + 2, yy, 'E')
    if butin:
        n.repere(xm - 2, butin, ymin=breche - 2)
    n.ennemis(x0 + 1, xm - 7, lettres, 1)
    n.ennemis(xm + 3, x0 + largeur, lettres, 1)


def puits(n, x0, largeur, lettres='a', butin='*'):
    """Une dalle de pierre de taille en travers du chemin, haute de neuf rangs (trop pour les sauts, aucune prise) et enfoncée de
    quatre ; on descend par un puits d'échelle devant elle, une galerie passe dessous et remonte derrière."""
    base = n.base
    d0, d1 = x0 + 5, x0 + largeur - 5
    n.rect(d0, base - 9, d1, base + 4, '[')
    n.rect(x0 + 2, base + 4, x0 + largeur - 2, base + 6, ' ')
    for xe in (x0 + 2, x0 + largeur - 3):
        for yy in range(base, base + 6):
            n.set(xe, yy, 'H')
    if butin:
        n.repere((d0 + d1) // 2, butin, ymin=base + 4)
    n.ennemis(d0, d1, lettres, 2, ymin=base + 3)
    n.ennemis(d1 + 1, x0 + largeur, lettres, 1)
