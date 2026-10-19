"""Le ferry (niveau « La Traversée », entre le port et Groix) : le niveau n'est que le navire, posé sur la mer.

Le pont et la coque sont du socle indestructible (on ne creuse pas sous un bateau), la poupe et la proue aussi (ce sont les
rampes relevées) ; tout le reste est vide : la mer. Les quais de Lorient et de Groix sont dessinés par le jeu, pas posés ici
(voir src/niveaux/navire.ts, qui reprend ces mesures, et src/jeu/traversee.ts pour le déroulé : le van monte à bord, le ferry
appareille, les vagues montent à l'abordage, puis le van redescend à Groix).
"""

LONGUEUR = 30  # de la poupe à la proue comprises
COQUE = 3  # rangées de coque sous le pont
BASTINGAGE = 3  # hauteur de la poupe et de la proue au-dessus du pont
PARKING = 7  # la place du van, en tuiles depuis la poupe : sur le pont arrière, comme sur un roulier
POUPE = 14  # tuiles du début de la pièce à la poupe


def ferry(n, x0, largeur, lettres='a'):
    base = n.base  # la rangée du pont
    # la mer partout : on efface le terrain de tout le niveau
    for x in range(n.w):
        for y in range(n.h):
            n.set(x, y, ' ')
        n.haut[x] = n.h
    s0 = x0 + POUPE
    s1 = s0 + LONGUEUR
    n.rect(s0, base, s1, base + 1 + COQUE, 'X')  # le pont et la coque
    n.rect(s0, base - BASTINGAGE, s0 + 1, base, 'X')  # la poupe (la rampe arrière, relevée)
    n.rect(s1 - 1, base - BASTINGAGE, s1, base, 'X')  # la proue (la rampe avant)
    n.set(s0 + 1, base - 1, '&')  # le repère : la première case du pont, contre la poupe
    n.set(s0 + 3, base - 1, '@')
    n.set(s0 + 6, base - 1, '1')  # le dialogue de l'abordage
    n.set(s0 + PARKING, base - 1, 'F')  # la place du van : il arrive du quai au début du niveau
    # la largeur du monde (les lignes de la carte sont rognées à droite) : de quoi dessiner le quai de Groix au-delà de la proue,
    # et y voir partir le van ; une case de mur de fond invisible, tout en haut, la fixe
    n.set(n.w - 1, 0, '.')
