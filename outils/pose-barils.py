#!/usr/bin/env python3
"""Des barils explosifs dans tous les niveaux de plateforme, seuls ou empilés, parfois sur un tonneau WOG.

Usage : python3 outils/pose-barils.py [01-stc 05-ville ...]     (sans argument : tous les niveaux de plateforme)

Le jeu mise sur la confusion : un tonneau WOG (un cœur), un tonneau d'or (tout revient) et un baril explosif se
ressemblent de loin ; on en trouve partout, parfois l'un sur l'autre. L'outil travaille sur les cartes telles qu'elles
sont (générées ou retouchées à la main) : il cherche des sols dégagés et y pose des piles :
- un baril seul, deux barils, ou un baril sur un tonneau WOG (jamais plus haut : on ne grimperait plus dessus d'un saut,
  et une pile de trois fermerait le chemin) ;
- jamais un tonneau sur un baril : le tonneau tomberait au travers (une tuile ne tient pas sur un objet) ;
- loin du départ, du van, des drapeaux, des cages, des autres tonneaux et barils, des ennemis et des échelles ;
- avec la place de monter dessus (deux cases de vide au-dessus de la pile) et du sol plat de chaque côté.

Il n'ajoute que ce qui manque pour atteindre le nombre voulu de piles (une tous les 45 cases, au moins 4) : le relancer
ne change rien. Le test des niveaux (tests/niveaux.test.ts) compte les barils comme des caisses : une pile qui
fermerait le chemin le ferait échouer.
"""
import pathlib
import random
import re
import sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
CARTES = RACINE / 'src' / 'niveaux' / 'cartes'

# les niveaux de plateforme (pas les mini-jeux : plongeon, rêve, avion, kart ; ni le ferry, tout en vagues)
NIVEAUX = [
    '01-stc', '02-alpages', '03-cimes', '04-plage', '05-ville', '06-club', '07-foret', '08-port', '09-groix', '11-fise',
    '12-pre-du-clos', '13-tuves', '17-beauvais', '18-limerick', '19-lund', '20-new-york', '21-marseille', '23-ottawa',
]

# sur quoi une pile peut se poser : le sol plein (pas une caisse, une vitre, un caisson qui explose, un tonneau)
SOLS = set('#RBMXNGWSD={}-')
# ce qui ne doit pas être à côté d'une pile (les repères et les tonneaux) ; les lettres sont des ennemis
PROCHES = set('@F!K*+%OQHE()$&|')
# les piles possibles, du bas vers le haut, et leur poids
PILES = [('%', 5), ('%%', 3), ('O%', 3)]
ECART = 18  # entre deux piles posées par l'outil


def lit(chemin):
    texte = chemin.read_text()
    lignes = texte.split('\n')
    debut = next(i for i, l in enumerate(lignes) if re.search(r'string\[\] = \[$', l)) + 1
    fin = next(i for i in range(debut, len(lignes)) if lignes[i].strip() == '];')
    rangees = [re.fullmatch(r"  '(.*)',", l).group(1) for l in lignes[debut:fin]]
    return lignes, debut, fin, rangees


def ecrit(chemin, lignes, debut, fin, rangees):
    lignes[debut:fin] = [f"  '{r}'," for r in rangees]
    chemin.write_text('\n'.join(lignes))


def colonnes_de_piles(grille):
    """Les colonnes qui portent déjà un baril."""
    return sorted({x for row in grille for x, c in enumerate(row) if c == '%'})


def pose(nom):
    chemin = CARTES / f'{nom}.ts'
    lignes, debut, fin, rangees = lit(chemin)
    largeur = max(len(r) for r in rangees)
    g = [list(r.ljust(largeur)) for r in rangees]
    H = len(g)
    at = lambda x, y: g[y][x] if 0 <= y < H and 0 <= x < largeur else ' '
    voulu = max(4, largeur // 45)
    deja = colonnes_de_piles(g)
    # un baril empilé compte une fois : des colonnes voisines forment une seule pile
    piles = [x for i, x in enumerate(deja) if i == 0 or x - deja[i - 1] > 1]
    manque = voulu - len(piles)
    if manque <= 0:
        return 0
    # les colonnes à éviter : départ, van, drapeaux, cages
    interdit = set()
    for y in range(H):
        for x in range(largeur):
            c = at(x, y)
            if c == '@':
                interdit.update(range(x - 12, x + 13))
            elif c in 'F!K':
                interdit.update(range(x - 5, x + 6))
    sites = []
    for y in range(4, H - 1):
        for x in range(2, largeur - 2):
            if x in interdit or at(x, y + 1) not in SOLS:
                continue
            # du sol plat de chaque côté, du vide sur cinq cases de haut au-dessus des trois colonnes
            if any(at(x + dx, y + 1) not in SOLS for dx in (-1, 1)):
                continue
            if any(at(x + dx, y - k) != ' ' for dx in (-1, 0, 1) for k in range(6)):
                continue
            # rien de proche : ni repère, ni tonneau, ni ennemi (une lettre), ni échelle, à quatre cases près
            voisins = [at(x + dx, y - k) for dx in range(-4, 5) for k in range(-1, 4)]
            if any(c in PROCHES or c.islower() for c in voisins):
                continue
            sites.append((x, y))
    rng = random.Random(nom)
    rng.shuffle(sites)
    poses = list(piles)
    ajout = 0
    for x, y in sites:
        if ajout >= manque:
            break
        if any(abs(x - p) < ECART for p in poses):
            continue
        pile = rng.choices([p for p, _ in PILES], [w for _, w in PILES])[0]
        for k, c in enumerate(pile):
            g[y - k][x] = c
        poses.append(x)
        ajout += 1
    # chaque rangée garde sa longueur, sauf si un baril est posé au-delà
    neuves = []
    for avant, r in zip(rangees, g):
        s = ''.join(r)
        neuves.append(s[: max(len(avant), len(s.rstrip()))])
    ecrit(chemin, lignes, debut, fin, neuves)
    return ajout


def main():
    noms = sys.argv[1:] or NIVEAUX
    for nom in noms:
        print(f'{nom} : {pose(nom)} pile(s) posée(s)')


if __name__ == '__main__':
    main()
