#!/usr/bin/env python3
"""Mesure à quel point un niveau se traverse « tout droit » (le défaut que corrige le chantier du level design, voir
src/niveaux/refontes.ts) : de quoi comparer une carte avant et après sa refonte.

Usage : python3 outils/mesure-niveaux.py [21-marseille ...]     (sans argument : toutes les cartes et leurs refontes)

Pour chaque carte, entre le départ (@) et le van (F) :
- raccourci : le chemin le moins cher pour un héros qui a le droit de tout casser (sauf l'incassable), de sauter un trou de
  SAUT colonnes, de se laisser tomber, de monter une échelle, une paroi (accroché au mur) ou une marche de SAUT_HAUT tuiles, de prendre une
  tyrolienne. Son coût : chaque tuile montée
  compte MONTEE, chaque tuile cassée ses points de vie (src/monde/tuiles.ts). On en donne la montée (en tuiles) et ce qu'il casse.
  On en donne aussi l'amplitude (l'écart de hauteur parcouru) : un niveau plat reste à la même hauteur du début à la fin ;
- en cassant tout : la montée du chemin d'un joueur qui préfère creuser plutôt que grimper (monter lui coûte 60). Si elle est
  faible, on traverse le niveau en cassant les murs. À la Broforce, même ce chemin-là monte et descend (des vides qu'on ne
  creuse pas, des falaises) ;
- gouffres : les suites de colonnes sans rien de solide de haut en bas (on les franchit, on ne les creuse pas) ;
- falaises : les ruptures d'au moins 5 tuiles entre deux colonnes voisines du terrain (le premier massif depuis le ciel : cinq
  tuiles solides d'affilée ; un plancher de bâtiment n'en est pas un) ;
- relief : l'écart entre le terrain le plus haut et le plus bas.
"""
import heapq
import pathlib
import re
import sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
DOSSIERS = [RACINE / 'src' / 'niveaux' / 'cartes', RACINE / 'src' / 'niveaux' / 'refontes']

# points de vie des tuiles solides (src/monde/tuiles.ts) ; None : incassable
PV = {
    '#': 3, 'R': 8, 'B': 5, 'M': 24, 'X': None, 'N': 2, 'G': 3, 'W': 3, 'C': 2, 'T': 2, 'S': 1, 'V': 1, 'D': 6,
    'O': 3, 'Q': 6, 'L': 6, 'U': 6, 'A': 4, 'I': 2, '|': None, '{': 6, '^': 3, ';': 2, '[': 30, '/': 2, '\\': 2,
}
PORTEURS = set(PV) | set('-=E')  # ce qui tient un héros debout
ECHELLES = set('HE')
SAUT = 4  # la largeur de trou qu'un héros franchit d'un saut
SAUT_HAUT = 2  # la hauteur d'une marche qu'il monte d'un saut
MONTEE = 6  # le prix d'une tuile montée, en points de vie : monter coûte plus que casser un peu de terre
MASSIF = 5


def lit(chemin):
    m = re.search(r'export const \w+: string\[\] = \[\n(.*?)\n\];', chemin.read_text(), re.S)
    if not m:
        return None
    lignes = [re.fullmatch(r"  '(.*)',", l) for l in m.group(1).split('\n')]
    lignes = [l.group(1).replace("\\'", "'").replace('\\\\', '\\') for l in lignes if l]
    w = max(len(l) for l in lignes)
    return [l.ljust(w) for l in lignes]


def trouve(g, c):
    return next(((x, y) for y, l in enumerate(g) for x, ch in enumerate(l) if ch == c), None)


def raccourci(g, depart, van, montee_prix=None):
    """(montée en tuiles, points de vie cassés, tuiles cassées, amplitude) du chemin le moins cher, ou None. Un état : la case
    des pieds. L'amplitude : l'écart entre la rangée la plus haute et la plus basse où passe le chemin."""
    prix_montee = MONTEE if montee_prix is None else montee_prix
    H, W = len(g), len(g[0])
    at = lambda x, y: g[y][x] if 0 <= x < W and 0 <= y < H else 'X'

    def casse(x, y):
        """Le prix pour libérer la case (x, y) et celle de la tête, ou None si c'est incassable (ou de l'eau)."""
        pv = tuiles = 0
        for c in (at(x, y), at(x, y - 1)):
            if c == '~' or (c in PV and PV[c] is None):
                return None
            if c in PV:
                pv += PV[c]
                tuiles += 1
        return pv, tuiles

    def pose(x, y):
        """Où l'on finit en tombant de (x, y) : la première case portée en dessous (None : dans le vide)."""
        while y < H - 1 and at(x, y + 1) not in PORTEURS and at(x, y) not in ECHELLES:
            if at(x, y + 1) == '~':
                return None
            y += 1
        return y if y < H - 1 else None

    # les tyroliennes : chaque ( ou $ mène au poteau ($ ou )) le plus proche à sa droite (voir src/niveaux/tyroliennes.ts)
    poteaux = [(x, y, c) for y, l in enumerate(g) for x, c in enumerate(l) if c in '()$']
    tyro = {}
    for x, y, c in poteaux:
        if c in '($':
            fins = [(px, py) for px, py, pc in poteaux if pc in ')$' and px > x]
            if fins:
                tyro[(x, y)] = min(fins, key=lambda f: (f[0] - x) ** 2 + (f[1] - y) ** 2)
    debut = pose(*depart)
    vus = {}
    tas = [(0, 0, 0, 0, depart[0], debut, debut, debut)]
    while tas:
        cout, montee, pv, tuiles, x, y, haut, bas = heapq.heappop(tas)
        if (x, y) in vus:
            continue
        vus[(x, y)] = True
        if abs(x - van[0]) <= 1 and abs(y - van[1]) <= 1:
            return montee, pv, tuiles, bas - haut
        suivants = []
        for (px, py), (fx, fy) in tyro.items():
            if abs(px - x) <= 1 and -3 <= py - y <= 1:
                ny = pose(fx, fy)
                if ny is not None:
                    suivants.append((fx, ny, 0, 0, 0))
        for dx in (-1, 1):
            # un pas (en cassant), puis on tombe ; ou un saut par-dessus un trou, à la même rangée
            for portee in range(1, SAUT + 2):
                nx = x + dx * portee
                prix = casse(nx, y)
                if prix is None:
                    break
                if portee > 1 and prix[1]:
                    break  # on ne casse pas en plein saut
                ny = pose(nx, y)
                if ny is not None and (portee == 1 or ny == y):
                    suivants.append((nx, ny, 0, *prix))
                if at(nx, y + 1) in PORTEURS:
                    break
            # un saut vers le haut, par-dessus un trou ou sur une marche : sans rien casser
            for portee in range(1, SAUT + 2):
                for h in range(1, SAUT_HAUT + 1):
                    nx, ny = x + dx * portee, y - h
                    if casse(nx, ny) == (0, 0) and casse(x, ny) == (0, 0) and at(nx, ny + 1) in PORTEURS:
                        suivants.append((nx, ny, h, 0, 0))
        # monter une échelle ou le long d'une paroi (accroché au mur, de saut en saut), ou casser vers le bas
        paroi = any(at(x + dx, y - 1) in PV for dx in (-1, 1))
        if at(x, y) in ECHELLES or at(x, y - 1) in ECHELLES or paroi:
            prix = casse(x, y - 1)
            if prix is not None:
                suivants.append((x, y - 1, 1, *prix))
        prix = casse(x, y + 2)
        if at(x, y + 1) in PV and PV[at(x, y + 1)] is not None and prix is not None:
            ny = pose(x, y + 1)
            if ny is not None:
                suivants.append((x, ny, 0, PV[at(x, y + 1)], 1))
        for nx, ny, m, p, t in suivants:
            if (nx, ny) not in vus:
                heapq.heappush(tas, (cout + m * prix_montee + p + 1, montee + m, pv + p, tuiles + t, nx, ny, min(haut, ny), max(bas, ny)))
    return None


def mesure(g):
    depart, van = trouve(g, '@'), trouve(g, 'F') or trouve(g, 'Z')
    if not depart or not van:
        return None
    x0, x1 = sorted((depart[0], van[0]))
    surface = []
    gouffres, dans = 0, False
    for x in range(x0, x1 + 1):
        col = [g[y][x] for y in range(len(g))]
        surface.append(next((y for y in range(len(col) - MASSIF + 1) if all(c in PV for c in col[y : y + MASSIF])), None))
        vide = not any(c in PV for c in col)
        gouffres += vide and not dans
        dans = vide
    pleins = [s for s in surface if s is not None] or [0]
    falaises = sum(1 for a, b in zip(surface, surface[1:]) if a is not None and b is not None and abs(a - b) >= 5)
    return dict(
        raccourci=raccourci(g, depart, van),
        casseur=raccourci(g, depart, van, montee_prix=60), gouffres=gouffres, falaises=falaises, relief=max(pleins) - min(pleins), largeur=x1 - x0
    )


def main():
    noms = sys.argv[1:]
    print(f"{'carte':22} {'largeur':>7} {'chemin : monte, casse, amplitude':>40} {'en cassant tout : monte':>24} {'gouffres':>8} {'falaises':>8}")
    for dossier in DOSSIERS:
        for f in sorted(dossier.glob('*.ts')):
            if noms and f.stem not in noms:
                continue
            g = lit(f)
            m = g and mesure(g)
            if not m or m['largeur'] < 60:
                continue
            r, c = m['raccourci'], m['casseur']
            texte = f'{r[0]} tuiles, {r[2]} tuiles ({r[1]} PV), {r[3]}' if r else 'aucun'
            casseur = f'{c[0]} tuiles ({c[2]} cassées)' if c else 'aucun'
            nom = ('refonte ' if dossier.name == 'refontes' else '') + f.stem
            print(f"{nom:22} {m['largeur']:7} {texte:>40} {casseur:>24} {m['gouffres']:8} {m['falaises']:8}")


if __name__ == '__main__':
    main()
