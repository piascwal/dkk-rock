"""Le ferry (niveau « La Traversée », entre le port et Groix) : un quai d'approche, puis le pont de bois d'un ferry, fermé par une proue.

Le repère `&` marque l'embarquement. Le jeu fait le reste (src/jeu/traversee.ts) : une fois tous les héros à bord, le pont se
ferme derrière eux, des vagues montent à l'abordage des deux côtés, et la porte du pont (à 19 tuiles du repère) ne s'ouvre
qu'à la dernière vaincue ; le van attend derrière elle.
"""

LARGEUR_PONT = 24  # tuiles, du repère d'embarquement à la proue (la porte est à 19, voir PORTE dans traversee.ts)
ENTREE = 14  # tuiles du début de la pièce au repère d'embarquement


def ferry(n, x0, largeur, lettres='a'):
    base = n.base
    g0 = x0 + ENTREE
    # le quai : quelques ennemis qui montent la garde avant l'embarquement
    n.ennemis(x0 + 2, g0 - 1, lettres, 2)
    n.repere(g0, '&', surface=True)
    # le pont : des planches de bois, une proue de six tuiles ; le van derrière la porte, tout près de la proue
    for x in range(g0, g0 + LARGEUR_PONT):
        n.set(x, base, 'W')
    n.rect(g0 + LARGEUR_PONT - 1, base - 6, g0 + LARGEUR_PONT, base, 'W')
    n.repere(g0 + LARGEUR_PONT - 3, 'F', surface=True)
