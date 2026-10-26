#!/usr/bin/env python3
"""Les cartes du battle royale (src/niveaux/cartes/arenes.ts) : petites (72 × 36 tuiles), tout en hauteur, faites pour se
chercher et se croiser. On y monte par les échelles, on saute de plateforme en plateforme, on traverse par les tyroliennes
(certaines à jointures : elles descendent, filent à plat, remontent). Le sol et les bords sont du socle : personne ne tombe
hors de la carte.

Le script vérifie ce que le jeu vérifiera : chaque départ de tyrolienne est relié au bon poteau (le plus proche à sa droite),
et aucun câble ne traverse un bloc. L'accessibilité (tout se rejoint depuis le départ) est vérifiée par tests/arene.test.ts.

Usage : python3 outils/arenes.py        Sortie : src/niveaux/cartes/arenes.ts
"""
import math
import pathlib

RACINE = pathlib.Path(__file__).resolve().parent.parent
SORTIE = RACINE / 'src' / 'niveaux' / 'cartes' / 'arenes.ts'
L, H = 72, 36
SOL = 31  # la rangée du sol : on se tient sur la rangée 30
# ce qui ne bloque pas (le vide, les plateformes, les échelles, le mur de fond, les repères)
TRAVERSABLE = set(' -=HE.@F!K*+%()$O123456789abcdefghijklmnopqrstuvwxyz')


class Arene:
    def __init__(self, sol='#', profond='R'):
        self.g = [[' '] * L for _ in range(H)]
        for y in range(SOL, H):
            for x in range(L):
                self.g[y][x] = sol if y < SOL + 2 else (profond if y < H - 1 else 'X')
        for y in range(H):
            self.g[y][0] = self.g[y][L - 1] = 'X'
        for x in range(L):
            self.g[0][x] = 'X'
        self.tyros = []

    def pose(self, x, y, c):
        if 0 < x < L - 1 and 0 < y < H - 1:
            self.g[y][x] = c

    def ligne(self, x0, x1, y, c):
        for x in range(x0, x1 + 1):
            self.pose(x, y, c)

    def bloc(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            self.ligne(x0, x1, y, c)

    def echelle(self, x, haut, bas=SOL - 1, c='E'):
        """Une échelle de la rangée `haut` (souvent celle d'une plateforme : on s'y tient en haut) jusqu'à `bas`."""
        for y in range(haut, bas + 1):
            self.pose(x, y, c)

    def tyrolienne(self, *poteaux):
        """Un départ, d'éventuelles jointures, une arrivée : (x, y) de chaque poteau, posés sur la rangée où l'on se tient."""
        (x, y), *milieu, (xf, yf) = poteaux
        self.pose(x, y, '(')
        for jx, jy in milieu:
            self.pose(jx, jy, '$')
        self.pose(xf, yf, ')')
        self.tyros.append(poteaux)

    def departs(self, n=8):
        """Les départs des joueurs : des cases où l'on tient debout, bien réparties (la plus loin des précédentes, à chaque fois),
        en partant du départ de la carte."""
        appui = set('#RBMXNGWCTSVDEJLUAI|{^;[=-HE')
        cases = [(x, y) for y in range(2, H - 1) for x in range(1, L - 1)
                 if self.g[y][x] in ' .' and self.g[y - 1][x] in ' .' and self.g[y + 1][x] in appui]
        choix = [next((x, y) for y, r in enumerate(self.g) for x, c in enumerate(r) if c == '@')]
        while len(choix) < n:
            choix.append(max(cases, key=lambda c: min(math.hypot(c[0] - o[0], 1.6 * (c[1] - o[1])) for o in choix)))
        return choix

    def texte(self):
        return [''.join(r) for r in self.g]

    def verifie(self, nom):
        """Les liens des tyroliennes (la règle du jeu : niveaux/tyroliennes.ts) et leurs câbles dégagés."""
        bouts = [(x, y) for y, r in enumerate(self.g) for x, c in enumerate(r) if c == ')']
        libres = {(x, y) for y, r in enumerate(self.g) for x, c in enumerate(r) if c == '$'}
        # comme le jeu : les départs dans l'ordre de lecture (rangée par rangée), une jointure ne sert qu'une fois
        voulues = {p[0]: list(p) for p in self.tyros}
        for depart in sorted(voulues, key=lambda p: (p[1], p[0])):
            de = depart
            obtenus = [de]
            while True:
                cand = [p for p in bouts + sorted(libres) if p[0] > de[0]]
                b = min(cand, key=lambda p: math.hypot(p[0] - de[0], p[1] - de[1]))
                obtenus.append(b)
                if b not in libres:
                    break
                libres.discard(b)
                de = b
            assert obtenus == voulues[depart], f'{nom} : tyrolienne {voulues[depart]} reliée à {obtenus}'
        for poteaux in self.tyros:
            for (ax, ay), (bx, by) in zip(poteaux, poteaux[1:]):
                x1, y1, x2, y2 = ax * 16 + 8, ay * 16 + 4, bx * 16 + 8, by * 16 + 4
                for i in range(1, 200):
                    px = x1 + (x2 - x1) * i / 200
                    py = y1 + (y2 - y1) * i / 200
                    c = self.g[int(py // 16)][int(px // 16)]
                    assert c in TRAVERSABLE, f'{nom} : câble {poteaux} dans « {c} » en {int(px // 16)},{int(py // 16)}'


def tour_de_mixage():
    """Le club : une tour centrale de quatre étages, deux tours de côté, des tyroliennes entre leurs sommets."""
    a = Arene('D', 'D')
    # la tour centrale : quatre étages de pitons, des échelles qui alternent
    for y, (xe, couvert) in zip((25, 19, 13, 7), ((31, 'T'), (40, 'B'), (31, 'T'), (40, 'B'))):
        a.ligne(29, 42, y, '=')
        a.echelle(xe, y, y + 5 if y < 25 else SOL - 1)
        a.pose(35 if xe == 31 else 36, y - 1, couvert)
    a.bloc(35, 26, 36, 30, 'B')  # un pilier au rez-de-chaussée, à contourner ou à percer
    # les tours de côté : trois paliers et leurs échelles
    for x0, xe, xb in ((3, 4, 13), (58, 67, 58)):
        for y, x in ((23, xe), (16, xb), (10, xe)):
            a.ligne(x0, x0 + 10, y, '=')
            a.echelle(x, y, y + 6 if y < 23 else SOL - 1)
    # des marches de plateformes entre le sol, les tours de côté et la tour centrale (deux rangées de haut, en quinconce)
    for x0, x1, y in ((15, 19, 28), (20, 26, 26), (45, 51, 26), (52, 56, 28)):
        a.ligne(x0, x1, y, '-')
    # les tyroliennes : des sommets de côté vers le haut de la tour centrale, et une grande à jointure par-dessus tout
    a.tyrolienne((5, 9), (36, 3), (66, 9))
    a.tyrolienne((11, 22), (36, 18), (61, 22))
    a.ligne(34, 38, 4, '=')  # le perchoir de la jointure, tout en haut
    a.echelle(37, 4, 6)
    # le butin : armes, soins, barils, un tonneau WOG
    for x, y, c in ((8, 22, '*'), (63, 22, '*'), (35, 6, '+'), (33, 18, '*'), (20, 30, '%'), (51, 30, '%'), (30, 6, 'O')):
        a.pose(x, y, c)
    a.pose(10, 30, '@')
    return a


def echafaudages():
    """Un chantier : une grille d'échafaudages (échelles tous les douze pas, planchers troués), des tyroliennes en zigzag."""
    a = Arene('#', 'R')
    for i, x in enumerate(range(6, 67, 12)):
        haut = 7 if i % 2 == 0 else 10
        a.echelle(x, haut, c='H')
        for y in range(haut, 30, 6):
            # des planchers de bois, troués par endroits (on tombe d'un étage, ou on saute par-dessus)
            for xx in range(x - 5, x + 6):
                if (xx + y) % 9 != 0:
                    a.pose(xx, y, '-')
            a.pose(x, y, 'H')
    # des caisses et des murets de brique pour se couvrir
    for x, y in ((14, 30), (15, 30), (40, 30), (57, 30)):
        a.pose(x, y, 'C')
    a.bloc(28, 28, 29, 30, 'B')
    a.bloc(44, 28, 45, 30, 'B')
    # les tyroliennes : une longue qui ondule d'un bout à l'autre du haut, et deux courtes plus bas
    a.tyrolienne((2, 6), (18, 9), (30, 6), (42, 9), (69, 6))
    a.ligne(1, 4, 7, '=')
    a.ligne(67, 70, 7, '=')
    a.echelle(2, 7, 30)
    a.echelle(69, 7, 30)
    a.tyrolienne((8, 15), (27, 21))
    a.tyrolienne((44, 21), (65, 30))
    for x, y, c in ((12, 12, '*'), (60, 12, '*'), (36, 18, '+'), (24, 30, '%'), (48, 30, '%'), (36, 30, '*')):
        a.pose(x, y, c)
    a.pose(3, 30, '@')
    return a


def port():
    """Le port : deux bateaux à quai et leurs mâts, un bassin au milieu, des tyroliennes de mât en mât."""
    a = Arene('W', 'R')
    # le bassin : on le traverse à la nage (lentement) ou par les airs
    a.ligne(27, 44, SOL, '~')
    # deux coques de bateau, deux ponts, et les mâts avec leurs hunes
    for x0 in (4, 47):
        a.bloc(x0, 25, x0 + 20, 30, 'W')
        a.bloc(x0 + 2, 27, x0 + 18, 29, '.')  # la cale
        a.ligne(x0 + 1, x0 + 19, 25, '=')
        for xm, hune in ((x0 + 5, 9), (x0 + 15, 13)):
            a.echelle(xm, hune, 24)
            a.ligne(xm - 2, xm + 2, hune, '=')
            a.pose(xm, hune, 'E')
        a.echelle(x0 + 10, 25, 29)  # l'écoutille vers la cale
        a.echelle(x0 - 1, 24)  # on monte à bord des deux côtés
        a.echelle(x0 + 21, 24)
    # la passerelle haute au-dessus du bassin
    a.ligne(31, 40, 17, '-')
    a.echelle(35, 17, 30)
    a.pose(35, SOL, 'W')
    # les tyroliennes : de hune en hune par-dessus le bassin, et une à jointure qui plonge vers la passerelle
    a.tyrolienne((21, 12), (35, 16), (50, 8))
    for x, y, c in ((8, 29, '*'), (63, 29, '*'), (36, 16, '+'), (9, 24, '%'), (62, 24, '%'), (24, 28, 'K')):
        a.pose(x, y, c)
    a.pose(26, 30, '@')  # sur le quai, entre la coque et le bassin
    return a


def sommet():
    """Les cimes : une montagne au milieu (des grottes, une cheminée), des tyroliennes du sommet vers les deux vallées."""
    a = Arene('N', 'R')
    # la montagne : chaque rangée un peu plus large en descendant
    for y in range(9, SOL):
        demi = 4 + (y - 9)
        a.ligne(36 - demi, 36 + demi, y, 'N' if y < 12 else 'R')
    # des grottes qui la traversent, et une cheminée de l'une à l'autre
    a.bloc(12, 27, 60, 30, ' ')
    a.bloc(25, 21, 47, 23, ' ')
    a.echelle(36, 21, 30, 'E')
    a.echelle(36, 9, 20, 'E')
    for x in (24, 48):
        a.echelle(x, 21, 30, 'E')
    # des corniches de glace sur les flancs, pour grimper par l'extérieur
    for x0, y in ((8, 25), (13, 20), (6, 15), (57, 25), (53, 20), (60, 15)):
        a.ligne(x0, x0 + 5, y, '=')
    for x, y0 in ((9, 15), (62, 15)):
        a.echelle(x, y0, SOL - 1)
    # du sommet vers les vallées, et d'une vallée à l'autre en passant par le sommet (montée puis descente)
    a.pose(36, 8, ' ')
    a.tyrolienne((7, 14), (36, 6), (65, 14))
    a.ligne(34, 38, 7, '=')
    for x, y, c in ((35, 6, '+'), (30, 26, '*'), (42, 26, '*'), (36, 30, 'O'), (12, 30, '%'), (60, 30, '%'), (28, 20, '*')):
        a.pose(x, y, c)
    a.pose(3, 30, '@')
    return a


ARENES = {
    'tour-de-mixage': tour_de_mixage,
    'echafaudages': echafaudages,
    'port': port,
    'sommet': sommet,
}


def main():
    sorties = []
    departs = []
    for nom, f in ARENES.items():
        a = f()
        a.verifie(nom)
        lignes = '\n'.join(f"    '{l}'," for l in a.texte())
        sorties.append(f"  '{nom}': [\n{lignes}\n  ],")
        departs.append(f"  '{nom}': [{', '.join(f'[{x}, {y}]' for x, y in a.departs())}],")
    SORTIE.write_text(
        '// Fichier généré par outils/arenes.py : les cartes du battle royale (modifiables à la main, le script les écrase).\n'
        'export const CARTES_ARENES: Record<string, string[]> = {\n' + '\n'.join(sorties) + '\n};\n\n'
        '/** les départs des joueurs (siège 0 à 7 : colonne, rangée où il se tient) */\n'
        'export const DEPARTS_ARENES: Record<string, [number, number][]> = {\n' + '\n'.join(departs) + '\n};\n'
    )
    print(f'{len(ARENES)} arènes écrites dans {SORTIE.relative_to(RACINE)}')


if __name__ == '__main__':
    main()
