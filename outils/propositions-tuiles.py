#!/usr/bin/env python3
"""Trois styles de tuiles proposés au choix, sur une même scène (terre et herbe, puis neige et roche).

Usage : python3 outils/propositions-tuiles.py      Sorties : assets-sources/propositions/tuiles-{A,B,C}.png

Les tuiles tiennent compte de leurs voisines : l'herbe ne pousse que sur un dessus à l'air libre et coule sur les bords,
les coins exposés s'arrondissent, le dessous d'un surplomb s'assombrit.
"""
import pathlib

from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
T = 16
SCENE = [
    '..................................',
    '..................................',
    '..........====...........=====....',
    '..................................',
    '......##.........###..............',
    '.....####.......#####......###....',
    '############...#######....#####...',
    '############...########..#######..',
    '#############..##################.',
    '##################################',
    '##################################',
]

PALETTES = {
    'herbe': dict(ciel=(52, 38, 86), herbe=(76, 175, 80), herbe_clair=(140, 214, 98), herbe_sombre=(38, 110, 50),
                  terre=(122, 74, 42), terre_sombre=(88, 52, 30), terre_clair=(150, 98, 60), caillou=(130, 124, 118),
                  contour=(32, 18, 12), fleur=(255, 214, 63)),
    'neige': dict(ciel=(40, 58, 92), herbe=(236, 244, 252), herbe_clair=(255, 255, 255), herbe_sombre=(170, 196, 226),
                  terre=(109, 109, 120), terre_sombre=(78, 78, 90), terre_clair=(140, 140, 152), caillou=(160, 200, 230),
                  contour=(22, 22, 34), fleur=(150, 220, 255)),
}


def h(x, y, k=0):
    """Hasard déterministe, de 0 à 1."""
    n = (x * 374761393 + y * 668265263 + k * 2147483647) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return (n ^ (n >> 16)) / 0xFFFFFFFF


def solide(tx, ty):
    if ty < 0 or ty >= len(SCENE) or tx < 0 or tx >= len(SCENE[0]):
        return ty >= len(SCENE)
    return SCENE[ty][tx] == '#'


def scene(style, pal):
    w, hh = len(SCENE[0]) * T, len(SCENE) * T
    im = Image.new('RGB', (w, hh), pal['ciel'])
    px = im.load()

    def pose(x, y, c):
        if 0 <= x < w and 0 <= y < hh:
            px[x, y] = c

    for ty, ligne in enumerate(SCENE):
        for tx, c in enumerate(ligne):
            x0, y0 = tx * T, ty * T
            if c == '=':
                for x in range(T):
                    for y in range(4):
                        pose(x0 + x, y0 + y, (168, 116, 58) if y else (210, 154, 85))
                    pose(x0 + x, y0 + 4, (94, 59, 26))
                for x in (2, 3, 12, 13):
                    for y in range(5, 9):
                        pose(x0 + x, y0 + y, (94, 59, 26))
                continue
            if c != '#':
                continue
            haut, bas = not solide(tx, ty - 1), not solide(tx, ty + 1)
            gauche, droite = not solide(tx - 1, ty), not solide(tx + 1, ty)
            for y in range(T):
                for x in range(T):
                    gx, gy = x0 + x, y0 + y
                    # coins exposés arrondis (le ciel reste visible)
                    if (haut and gauche and x + y < 2) or (haut and droite and (T - 1 - x) + y < 2):
                        continue
                    if (bas and gauche and x + (T - 1 - y) < 2) or (bas and droite and (T - 1 - x) + (T - 1 - y) < 2):
                        continue
                    col = pal['terre']
                    r = h(gx, gy)
                    if style in ('A', 'C'):
                        if r < 0.08:
                            col = pal['terre_sombre']
                        elif r > 0.95:
                            col = pal['terre_clair']
                    else:
                        if (gx // 2 + gy // 3) % 7 == 0 and r < 0.5:
                            col = pal['terre_sombre']
                    if bas and y >= T - 3:  # dessous d'un surplomb : plus sombre
                        col = pal['terre_sombre']
                    if style == 'B':  # contour net autour de la masse, petit reflet intérieur
                        if (gauche and x == 0) or (droite and x == T - 1) or (bas and y == T - 1):
                            col = pal['contour']
                        elif (gauche and x == 1) or (droite and x == T - 2):
                            col = pal['terre_sombre']
                    pose(gx, gy, col)
            if style == 'C':  # des cailloux pris dans la terre
                for k in range(2):
                    if h(tx, ty, k + 7) < 0.55:
                        cx = x0 + 3 + int(h(tx, ty, k + 3) * 10)
                        cy = y0 + (7 if haut else 3) + int(h(tx, ty, k + 5) * 6)
                        for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1), (2, 1), (1, 2)):
                            pose(cx + dx, cy + dy, pal['caillou'])
                        pose(cx, cy, tuple(min(255, v + 40) for v in pal['caillou']))
                        pose(cx + 2, cy + 2, pal['terre_sombre'])
            if haut:  # l'herbe : une couche qui coule sur la terre, en dents irrégulières
                for x in range(T):
                    gx = x0 + x
                    if (gauche and x < 1) or (droite and x > T - 2):
                        prof = 3
                    else:
                        prof = 3 + int(h(gx, ty, 1) * (4 if style != 'B' else 2))
                    for y in range(prof):
                        if (gauche and x + y < 1) or (droite and (T - 1 - x) + y < 1):
                            continue
                        col = pal['herbe_clair'] if y == 0 else pal['herbe']
                        pose(gx, y0 + y, col)
                    pose(gx, y0 + prof, pal['herbe_sombre'])
                    if style == 'B' and (x == 0 and gauche or x == T - 1 and droite):
                        pass
                    if style in ('B', 'C') and h(gx, ty, 2) < 0.35:  # brins qui dépassent
                        hb = 1 + int(h(gx, ty, 3) * 2)
                        for k in range(1, hb + 1):
                            pose(gx, y0 - k, pal['herbe'] if k < hb else pal['herbe_clair'])
                    if style == 'C' and h(gx, ty, 9) < 0.04:
                        pose(gx, y0 - 2, pal['fleur'])
                        pose(gx, y0 - 1, pal['herbe_sombre'])
                # l'herbe déborde sur les flancs exposés
                for cote, xs in ((gauche, x0 - 1), (droite, x0 + T)):
                    if cote:
                        for y in range(1, 3 + (style != 'B')):
                            pose(xs, y0 + y, pal['herbe'] if y < 2 else pal['herbe_sombre'])
                if style == 'B':
                    for x in range(T):
                        if not ((gauche and x < 1) or (droite and x > T - 2)):
                            pose(x0 + x, y0 - 1 if h(x0 + x, ty, 2) >= 0.35 else y0 - 3, pal['contour'])
    return im


def main():
    sortie = RACINE / 'assets-sources' / 'propositions'
    sortie.mkdir(parents=True, exist_ok=True)
    for style in 'ABC':
        panneaux = [scene(style, PALETTES[p]) for p in ('herbe', 'neige')]
        w, hh = panneaux[0].size
        im = Image.new('RGB', (w, hh * 2 + 4), (0, 0, 0))
        for i, p in enumerate(panneaux):
            im.paste(p, (0, i * (hh + 4)))
        im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(sortie / f'tuiles-{style}.png')
    print('ok')


if __name__ == '__main__':
    main()
