"""Les lieux d'Ottawa (voir plans.py) : ceux qui font la ville, et qui changent la façon d'y jouer.

- `patinoire` : la rivière gelée, sa glace qui glisse et ses trous ; au milieu, une patinoire de hockey (des bandes, deux cages),
  ses hockeyeurs et son gardien de but ;
- `parlement` : la colline du Parlement ; le bloc du Centre barre tout, on n'y passe qu'en montant dans la tour de la Paix ;
- `glebe` : le Glebe Collegiate Institute, bâti sur la pente ; on y entre en haut, on n'en ressort qu'en bas.

Comme partout : il y a toujours un chemin sans rien casser, le test d'accessibilité le vérifie.
"""


def patinoire(n, x0, largeur, lettres='a'):
    """La rivière gelée : une glace qui glisse sur trois rangées d'eau. Sur la rivière, des trous tous les sept pas (on tombe à
    l'eau, une échelle remonte) ; au milieu, la patinoire : des bandes de bois de deux tuiles aux deux bouts (on saute par-dessus),
    une cage à chaque bout, les hockeyeurs, et le gardien devant la cage d'en face."""
    base = n.base
    l0, l1 = x0 + 2, x0 + largeur - 2
    for x in range(l0, l1):
        n.set(x, base, 'G')
        for y in range(base + 1, base + 4):
            n.set(x, y, '~')
        n.set(x, base + 4, ';')
    r0, r1 = l0 + (l1 - l0) // 4, l1 - (l1 - l0) // 4  # la patinoire

    def trou(x):
        for y in range(base, base + 4):
            n.set(x, y, 'H')
            n.set(x + 1, y, '~')
            n.set(x + 2, y, 'H')

    for x in list(range(l0 + 3, r0 - 4, 7)) + list(range(r1 + 3, l1 - 4, 7)):
        trou(x)
    for xb in (r0, r1 - 1):  # les bandes
        for y in (base - 2, base - 1):
            n.set(xb, y, 'W')
    n.decor(r0 + 3, 'cageHockey', base)
    n.decor(r1 - 4, 'cageHockey', base)
    n.ennemis(r0 + 2, r1 - 8, lettres, 3, ymin=base - 2)
    n.ennemis(r1 - 7, r1 - 3, 'i', 1, ymin=base - 2)
    n.repere((r0 + r1) // 2, '+', ymin=base + 1)


def parlement(n, x0, largeur, lettres='a'):
    """Le bloc du Centre, en grès (la pierre), haut de neuf rangées : on y entre par la porte de l'ouest ; le mur de l'est est en
    pierre de taille, on ne le perce pas. La seule issue est la tour de la Paix, au milieu : une échelle monte du hall à travers le
    plafond ; en haut, une porte donne sur le toit de l'aile est, d'où l'on saute de l'autre côté. L'horloge, la flèche de cuivre."""
    base = n.base
    bx0, bx1 = x0 + 3, x0 + largeur - 3
    toit = base - 9
    n.rect(bx0, toit, bx1, base, '{')
    n.rect(bx0 + 1, toit + 1, bx1 - 1, base, '.')
    n.rect(bx1 - 2, toit, bx1, base + 3, '[')
    n.rect(bx0, base - 3, bx0 + 1, base, '.')  # la porte de l'ouest
    tx = (bx0 + bx1) // 2 - 3  # la tour de la Paix
    haut = toit - 10
    n.rect(tx, haut, tx + 6, toit, '{')
    n.rect(tx + 1, haut + 4, tx + 5, toit, '.')
    for x in (tx + 2, tx + 3):  # l'horloge
        n.set(x, haut + 2, 'V')
    n.rect(tx + 1, haut - 1, tx + 5, haut, 'M')  # la flèche de cuivre
    n.rect(tx + 2, haut - 2, tx + 4, haut - 1, 'M')
    for y in range(toit - 3, base):  # l'échelle, du hall jusqu'en haut de la tour
        n.set(tx + 2, y, 'H')
    n.rect(tx + 5, toit - 3, tx + 6, toit, ' ')  # la porte sur le toit de l'aile est
    n.decor(bx0 + 4, 'drapeauCanada', toit)
    n.repere(tx + 4, '+', ymin=toit - 2)
    n.ennemis(bx0 + 2, tx, lettres, 2, ymin=base - 2)
    n.ennemis(tx + 3, bx1 - 3, lettres, 1, ymin=base - 2)
    n.ennemis(tx + 7, bx1 - 1, lettres, 2, ymin=toit - 2)


def glebe(n, x0, largeur, lettres='a', chute=8):
    """Le Glebe Collegiate Institute, le lycée de brique où Mat a passé quelques mois, bâti sur la pente : on entre par la porte d'en
    haut, au niveau de la rue ; on descend les étages (les salles de classe, puis le gymnase) par des échelles qui alternent d'un
    bout à l'autre ; on ressort par la porte de la cour, `chute` rangées plus bas. Le soubassement côté rue est en pierre de taille.
    `base` descend d'autant."""
    base = n.base
    bas = base + chute
    sx0, sx1 = x0 + 3, x0 + largeur - 3
    for x in range(sx0, x0 + largeur):
        n.base_col(x, bas)
    n.rect(sx0, base - 6, sx1, bas, 'B')
    n.rect(sx0 + 1, base - 5, sx1 - 1, bas, '.')
    n.rect(sx0, base - 3, sx0 + 1, base, '.')  # la porte d'en haut
    n.rect(sx0, base + 1, sx0 + 1, bas, '[')
    for x in range(sx0 + 3, sx1 - 2, 5):  # les fenêtres de la façade
        n.set(x, base - 5, 'V')
    # les planchers de bois, tous les quatre rangs (chaque étage fait au moins trois rangées de haut, le héros y tient debout),
    # chacun percé d'une échelle jusqu'au plancher d'en dessous, à un bout puis à l'autre
    planchers = list(range(base, bas - 3, 4))
    for k, y in enumerate(planchers):
        for x in range(sx0 + 1, sx1 - 1):
            n.set(x, y, 'W')
        gx = sx1 - 3 if k % 2 == 0 else sx0 + 2
        for yy in range(y, planchers[k + 1] if k + 1 < len(planchers) else bas):
            n.set(gx, yy, 'H')
        n.ennemis(sx0 + 2, sx1 - 2, lettres, 1, ymin=y - 2)
    n.rect(sx1 - 1, bas - 3, sx1, bas, '.')  # la porte de la cour
    n.ennemis(sx0 + 2, sx1 - 2, lettres, 2, ymin=bas - 2)
    n.repere((sx0 + sx1) // 2, '*', ymin=bas - 2)
    n.base = bas
