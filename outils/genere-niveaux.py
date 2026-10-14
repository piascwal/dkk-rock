#!/usr/bin/env python3
"""Génère les cartes des niveaux (src/niveaux/cartes/NN-*.ts) à partir de recettes : des pièces posées le long d'un
terrain, une galerie souterraine qui double le chemin de surface, des tours, des îles, des butins.

Usage : python3 outils/genere-niveaux.py [garage|alpages|cimes|plage|ville ...]     Sortie : les cartes + un aperçu PNG
Les cartes sont ensuite modifiables à la main (c'est du texte) ; relancer le script les écrase.
"""
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / 'niveaux'))

from peintre import Niveau
from structures import complexe, forteresse, traversee
from verrous import barrage, gouffre, patrouilles, trou

RACINE = pathlib.Path(__file__).resolve().parent.parent
CARTES = RACINE / 'src' / 'niveaux' / 'cartes'
TEXTES = RACINE / 'src' / 'niveaux' / 'textes'

THEMES = {
    'garage': dict(sol='#', sous='#', profond='R', mur='B', deco=['C', 'C', 'T']),
    'alpages': dict(sol='#', sous='#', profond='R', mur='W', deco=['C', 'W']),
    'cimes': dict(sol='N', sous='R', profond='R', mur='R', deco=['G']),
    'plage': dict(sol='S', sous='S', profond='#', mur='W', deco=['C', 'W']),
    'ville': dict(sol='D', sous='D', profond='D', mur='D', deco=['C', 'T', 'M']),
}


def declencheurs(fichier):
    s = (TEXTES / fichier).read_text()
    m = re.search(r'dialogues:\s*\{(.*?)\n  \},\n  outro', s, re.S)
    return sorted(re.findall(r'^    (\d): \[', m.group(1), re.M))


class Recette:
    """Pose les pièces les unes après les autres, de gauche à droite, et le butin."""

    def __init__(self, nom, theme, fichier_textes, largeur=430, base=30, graine=1):
        # peu de profondeur : 30 rangées sous la surface, dont 6 de vide ; le monde finit vite, on tombe vite
        self.nom, self.n = nom, Niveau(largeur, base + 30, base, graine, THEMES[theme])
        self.x = 6
        self.digits = declencheurs(fichier_textes)
        self.pieces = []  # (x0, x1, genre)
        self.gouffres = []  # (x0, largeur, sol) : à recreuser avec leurs échelles après les galeries
        self.coupures = []  # (début, fin, sol) : les gouffres sans fond des traversées, qui coupent aussi la galerie
        self.barrages = []  # (x du mur, rangée du sommet) : à reposer après le creusement des galeries
        self.flags = []

    @property
    def d(self):  # difficulté de 0 à 1 selon l'avancement
        return min(1.0, self.x / self.n.w)

    def suite(self, genre, largeur, **kw):
        x0, n = self.x, self.n
        x1 = x0 + largeur
        n.niveler(x0, x1)
        poser = getattr(self, 'p_' + genre)
        poser(x0, x1, **kw)
        self.pieces.append((x0, x1, genre))
        self.x = x1

    def combat(self, x0, x1, lettres='a', plus=0, drones=0):
        k = 1 + int(self.d * 3) + plus
        self.n.ennemis(x0 + 3, x1 - 2, lettres, max(0, k))
        if drones:
            self.n.drones(x0 + 3, x1 - 2, drones)

    # ---- pièces de surface
    def p_palier(self, x0, x1, dy=-4, lettres='a'):
        self.n.palier(x0, x1, dy)
        self.combat(x0, x1, lettres)

    def p_echafaudage(self, x0, x1, niveaux=2, lettres='a'):
        n = self.n
        ys = n.echafaudage(x0 + 2, x1 - x0 - 4, niveaux)
        for y in ys:
            n.ennemis(x0 + 4, x1 - 4, lettres, 1, ymin=y - 1)
        n.repere((x0 + x1) // 2, '*', ymin=ys[-1] - 1)
        n.ennemis(x0, x1, lettres, 1)

    def p_maison(self, x0, x1, lettres='a', mat=None):
        n = self.n
        top = n.maison(x0, x1 - x0, mat)
        n.ennemis(x0 + 2, x1 - 2, lettres, 1 + int(self.d * 2), ymin=top + 1)
        n.repere((x0 + x1) // 2, '+', ymin=top - 1)
        n.ennemis(x0 + 2, x1 - 2, lettres, 1, ymin=top - 3)
    def p_plat(self, x0, x1, lettres='a', plus=0, deco=2, drones=0):
        self.n.plat(x0, x1, deco)
        self.combat(x0, x1, lettres, plus, drones)

    def p_colline(self, x0, x1, haut=3, lettres='a', plus=0):
        self.n.colline(x0, x1 - x0, haut)
        self.combat(x0, x1, lettres, plus)

    def p_fosse(self, x0, x1, lettres='a'):
        self.n.fosse(x0, x1 - x0)
        self.n.ennemis(x1 + 1, x1 + 6, lettres, 1)

    def p_mur(self, x0, x1, haut=5, lettres='a'):
        self.n.mur(x0 + 3, haut)
        self.combat(x0, x1, lettres)

    def p_tour(self, x0, x1, etages=2, lettres='a', tyro=0, mat=None, vitre=False):
        n = self.n
        top = n.tour(x0, x1 - x0, etages, mat, vitre)
        for k in range(etages):
            ys = n.base - k * 6
            n.ennemis(x0 + 3, x1 - 3, lettres, 1 + (k > 0), ymin=ys - 5)
        n.repere(x0 + (x1 - x0) // 2, '*', ymin=top - 1)  # une arme sur le toit
        if tyro:
            n.tyro(x0 + 2, top - 1, x1 + tyro, n.base - 5)

    def p_pont(self, x0, x1, haut=6, lettres='a'):
        n = self.n
        y = n.pont(x0, x1 - x0, haut)
        n.ennemis(x0 + 2, x1 - 2, lettres, 1 + int(self.d * 2), ymin=y - 1)
        n.ennemis(x0, x1, lettres, 1)

    def p_iles(self, x0, x1, haut=12, lettres='a'):
        n = self.n
        ix, iy = n.iles(x0 + 2, x1 - x0, haut)
        n.repere(ix, '*', ymin=iy - 1)
        self.combat(x0, x1, lettres)

    def p_cheminee(self, x0, x1, haut=10, lettres='a'):
        n = self.n
        cx, cy = n.cheminee(x0 + 3, haut)
        n.repere(cx, '+', ymin=cy - 1)
        self.combat(x0, x1, lettres)

    def p_barrage(self, x0, x1, haut=12, lettres='a', tyro=0, butin='*'):
        self.barrages.append(barrage(self.n, x0 + 2, haut, lettres, tyro, butin))
        self.n.ennemis(x1 - 9, x1 - 1, lettres, 2)

    def p_gouffre(self, x0, x1, lettres='a', nb=4):
        self.gouffres.append((x0 + 3, x1 - x0 - 6, self.n.base))
        gouffre(self.n, x0 + 3, x1 - x0 - 6, lettres, nb)

    def p_forteresse(self, x0, x1, etages=3, lettres='a', sous_sol=True, cage=False, mat=None):
        forteresse(self.n, x0 + 2, x1 - x0 - 4, etages, lettres, mat, sous_sol, cage)

    def p_traversee(self, x0, x1, lettres='a'):
        debut, fin = traversee(self.n, x0, lettres)
        self.coupures.append((debut, fin, self.n.base))

    def p_arene(self, x0, x1, lettres='ab', plus=2):
        n = self.n
        n.plat(x0, x1, 5)
        k = 3 + int(self.d * 4) + plus
        n.ennemis(x0 + 3, x1 - 2, lettres, k)

    # ---- repères
    def dialogue(self, c, x):
        self.n.repere(x, c)

    def drapeau(self, x):
        self.n.repere(x, '!', surface=True)
        self.flags.append(x)

    def ecrit(self, indice, nom_fichier, constante):
        n = self.n
        lignes = n.lignes()
        ts = (
            f'// {self.nom} : la carte du niveau, générée par outils/genere-niveaux.py puis modifiable à la main.\n'
            f'// Légende dans ../format.ts. Une ligne par rangée de tuiles de 16 px ; sous la dernière rangée de terre, le vide.\n'
            f'export const {constante}: string[] = [\n' + ''.join(f"  '{l}',\n" for l in lignes) + '];\n'
        )
        (CARTES / nom_fichier).write_text(ts)
        apercu(lignes, nom_fichier.replace('.ts', '.png'))


COULEURS = {
    ' ': (30, 20, 40), '.': (60, 50, 70), '#': (122, 74, 42), 'R': (109, 109, 120), 'B': (156, 59, 46), 'M': (138, 150, 163),
    'X': (20, 20, 20), 'N': (230, 240, 251), 'G': (143, 208, 238), 'W': (168, 116, 58), '-': (210, 154, 85), 'H': (196, 154, 90),
    'E': (255, 255, 255), '=': (190, 200, 210), 'C': (176, 125, 60), 'T': (60, 60, 60), 'S': (232, 207, 138), 'V': (191, 233, 255),
    'D': (154, 154, 146), '(': (255, 0, 255), ')': (255, 0, 255),
}


def apercu(lignes, nom, z=3):
    from PIL import Image

    h, w = len(lignes), max(len(l) for l in lignes)
    im = Image.new('RGB', (w * z, h * z))
    px = im.load()
    for y, l in enumerate(lignes):
        for x, c in enumerate(l.ljust(w)):
            col = COULEURS.get(c, (255, 255, 0) if c in '@!F*+K' else (255, 80, 80) if c.isalpha() else (0, 255, 255))
            for dy in range(z):
                for dx in range(z):
                    px[x * z + dx, y * z + dy] = col
    out = pathlib.Path(sys.argv[0]).resolve().parent.parent / 'assets-sources' / 'niveaux'
    out.mkdir(exist_ok=True)
    im.save(out / nom)


# ---------------------------------------------------------------------------------------------------------------
# Les recettes. Chaque recette : une liste de pièces (genre, largeur, options), puis les galeries et le butin.


def construit(nom, theme, textes, plan, fichier, constante, graine, base=30):  # fichier et constante : inutilisés ici
    total = 12 + sum(p[1] for p in plan)
    r = Recette(nom, theme, textes, largeur=total, graine=graine, base=base)
    n = r.n
    n.repere(3, '@', surface=True)
    digits = iter(r.digits)
    for genre, w, kw in plan:
        kw = dict(kw)
        c = kw.pop('digit', None)
        x0 = r.x
        r.suite(genre, w, **kw)
        if c:
            n.repere(x0 + 1, c, surface=True)
        if kw.get('flag'):
            pass
    # drapeaux : au début de la 1re plate-forme de chaque quart du niveau
    for q in (1, 2, 3):
        cible = total * q // 4
        for x0, x1, g in r.pieces:
            if g in ('plat', 'arene') and x0 >= cible - 10:
                r.drapeau(x0 + (x1 - x0) // 2)
                break
    # le van, au bout
    n.repere(total - 5, 'F', surface=True)
    return r


def place_libre(x, largeur, pris, w):
    """Le x le plus proche de `x` où une salle de `largeur` colonnes ne recoupe aucun des intervalles `pris`."""
    for d in range(0, 120, 4):
        for cand in (x + d, x - d):
            if 14 <= cand <= w - largeur - 14 and all(cand + largeur < a or cand > b for a, b in pris):
                return cand
    return None


def souterrain(r, seq_puits, caveau=None, ennemis='a'):
    """Sous tout le niveau : la galerie principale et ses puits, des cavernes, des boucles, des caches, un second étage."""
    n = r.n
    w = n.w
    salles = n.galerie(10, w - 10, alcoves=max(3, w // 45))
    for x in seq_puits:
        n.puits(x)
    # un tunnel plus bas qui double le principal, deux fois dans le niveau
    for frac in (0.22, 0.62):
        x0 = int(w * frac)
        n.boucle(x0, x0 + 36)
        n.repere(x0 + 18, '+', ymin=n.yg + 3)
        n.ennemis(x0 + 6, x0 + 30, ennemis, 2, ymin=n.yg + 3)
    # des cavernes : une salle haute avec ses pitons, le butin tout en haut
    for frac, c in ((0.15, '*'), (0.45, '+'), (0.8, '*')):
        x0 = int(w * frac)
        px, py = n.caverne(x0, 16, 7)
        n.repere(px, c, ymin=py - 2)
        n.ennemis(x0 + 2, x0 + 14, ennemis, 2, ymin=n.yg - 8)
    objets = ['+', '*', 'a', '+', 'a', '*']
    for i, x in enumerate(salles):
        c = objets[i % len(objets)]
        n.repere(x, c, ymin=n.yg - 4)
        n.ennemis(x - 3, x + 4, ennemis, 1 + i % 2, ymin=n.yg - 4)
    # des caches murées, à creuser (on les devine au creux dans le plafond du tunnel) : une cache une cage (+1 vie)
    for frac in (0.1, 0.33, 0.55, 0.7, 0.9):
        x = int(w * frac)
        cx, cy = n.cache(x, n.yg - 5, 4, 3)
        n.set(cx, cy, 'K' if frac == 0.7 else '+' if (x // 7) % 2 else '*')
    # des ennemis tout au long de la galerie, et des complexes souterrains en pierre (deux étages, fenêtres, butin) : à
    # l'écart des forteresses et des gouffres, dont les sous-sols et les trous se mêleraient à eux
    patrouilles(n, 14, w - 14, ennemis)
    pris = [(a - 4, b + 4) for a, b, g in r.pieces if g in ('forteresse', 'traversee', 'barrage', 'gouffre')]
    for frac, butin in ((0.27, '*'), (0.5, 'K'), (0.77, '+'), (0.93, '*')):
        x = place_libre(int(w * frac), 28, pris, w)
        if x is not None:
            complexe(n, x, 28, ennemis * 2, 5 + int(frac * 3), butin)
    if caveau:
        x0, x1 = caveau
        y2 = n.yg + 8
        s2 = n.sous_sol(x0, x1, y2)
        px = x0 + 6
        n.puits(px, n.yg + 1, y2 + 1)
        for i, x in enumerate(s2):
            n.repere(x, '+' if i == 0 else '*', ymin=y2 - 4)
            n.ennemis(x - 3, x + 4, ennemis, 1, ymin=y2 - 4)
    verrouille_galerie(r, seq_puits)


def verrouille_galerie(r, seq_puits):
    """Les murs des barrages coupent la galerie (on ne les contourne pas par en dessous) ; chaque tronçon ainsi isolé
    garde au moins un puits depuis la surface, sinon on n'y entrerait pas."""
    n = r.n
    for xw, top in r.barrages:
        n.rect(xw, top, xw + 3, n.h, 'X')
    for x0, largeur, sol in r.gouffres:  # les salles creusées dans la galerie ont pu entamer les trous et les puits
        trou(n, x0, largeur, sol)
    for debut, fin, sol in r.coupures:  # les gouffres sans fond : plus de terre dessous, sous la passerelle
        n.rect(debut, sol + 5, fin, n.h, ' ')
    for x in seq_puits:
        n.puits(x)
    coupes = sorted([(xw, xw + 3) for xw, _ in r.barrages] + [(d, f) for d, f, _ in r.coupures])
    bornes = [10] + [b for c in coupes for b in c] + [n.w - 10]
    puits = list(seq_puits)
    for a, b in zip(bornes[::2], bornes[1::2]):
        if any(a <= x < b for x in puits):
            continue
        for x in range(a + 6, b - 3):  # une colonne de terrain plein, hors des trous et des échelles
            if n.get(x, n.haut[x]) in n.t['sol'] and all(n.get(x, y) not in 'H ' for y in range(n.haut[x], n.yg)):
                n.puits(x)
                puits.append(x)
                break


def avec_verrous(plan, lettres='a'):
    """Insère dans le plan, après une plate-forme et tous les ~12 % du niveau, des structures qui obligent à changer d'étage
    ou à franchir le vide : forteresses (étages, pièces, sous-sol), barrages (il faut monter), traversées de gouffres
    (passerelle, tyrolienne, îlots), gouffres à descendre. Plus de rue droite."""
    total = sum(p[1] for p in plan)
    cibles = [0.10, 0.21, 0.32, 0.43, 0.54, 0.65, 0.76, 0.86]
    modeles = [
        ('forteresse', 34, dict(etages=3, lettres=lettres)),
        ('barrage', 28, dict(haut=12, lettres=lettres, butin='*')),
        ('traversee', 38, dict(lettres=lettres)),
        ('forteresse', 34, dict(etages=4, lettres=lettres, cage=True)),
        ('gouffre', 20, dict(lettres=lettres, nb=5)),
        ('traversee', 38, dict(lettres=lettres)),
        ('barrage', 28, dict(haut=16, lettres=lettres, tyro=11, butin='+')),
        ('forteresse', 34, dict(etages=3, lettres=lettres, cage=True)),
    ]
    sortie, acc, k = [], 0, 0
    for i, (genre, w, kw) in enumerate(plan):
        sortie.append((genre, w, kw))
        acc += w
        if k < len(cibles) and acc >= total * cibles[k] and genre == 'plat' and i < len(plan) - 3:
            g, largeur, options = modeles[k]
            sortie.append((g, largeur, dict(options)))
            k += 1
    return sortie


def garage():
    plan = [
        ('plat', 22, dict(plus=-1, lettres='a', deco=3)),
        ('plat', 20, dict(lettres='a', digit='2')),
        ('colline', 18, dict(haut=3)),
        ('fosse', 8, dict()),
        ('plat', 14, dict(lettres='a')),
        ('mur', 16, dict(haut=5, digit='3')),
        ('plat', 20, dict(digit='4')),  # la cage
        ('plat', 18, dict(digit='5', deco=0)),  # les caissons
        ('tour', 18, dict(etages=2, tyro=26, digit='6')),
        ('plat', 20, dict(lettres='ac')),
        ('palier', 20, dict(dy=-4)),
        ('plat', 16, dict(lettres='a')),
        ('echafaudage', 24, dict(niveaux=2)),
        ('plat', 14, dict(lettres='ac')),
        ('fosse', 9, dict()),
        ('plat', 12, dict(lettres='a')),
        ('palier', 18, dict(dy=4)),
        ('plat', 14, dict(lettres='ac')),
        ('maison', 14, dict()),
        ('plat', 10, dict(lettres='a')),
        ('colline', 20, dict(haut=4, lettres='ac')),
        ('cheminee', 24, dict(haut=10)),
        ('plat', 14, dict(lettres='a')),
        ('pont', 30, dict(haut=7, lettres='ac')),
        ('palier', 16, dict(dy=-3)),
        ('plat', 12, dict(lettres='ac')),
        ('tour', 22, dict(etages=3, lettres='ac')),
        ('plat', 14, dict(lettres='a')),
        ('fosse', 8, dict()),
        ('plat', 12, dict(lettres='ac')),
        ('echafaudage', 28, dict(niveaux=3, lettres='ac')),
        ('palier', 20, dict(dy=3)),
        ('plat', 16, dict(lettres='ac')),
        ('iles', 30, dict(haut=12)),
        ('plat', 14, dict(lettres='ac')),
        ('mur', 18, dict(haut=6)),
        ('plat', 14, dict(lettres='ac')),
        ('arene', 40, dict(lettres='ac')),
    ]
    plan = avec_verrous(plan, 'ac')
    r = construit('Le Garage', 'garage', '01-garage.ts', plan, '01-garage.ts', 'CARTE_GARAGE', 11)
    n = r.n
    plats = [p for p in r.pieces if p[2] == 'plat']
    # les puits : une échelle au ras du sol, au début de quelques plates-formes
    souterrain(r, seq_puits=[plats[i][0] + 3 for i in range(1, len(plats), 3)], caveau=(120, 400))
    # la cage et les caissons de basses sur la surface, là où les dialogues les annoncent
    n.repere(plats[2][0] + 14, 'K', surface=True)
    for dx in (6, 7, 8):
        n.repere(plats[3][0] + dx, 'T', surface=True)
    n.repere(plats[3][0] + 7, 'T', ymin=n.base - 4)
    r.ecrit(0, '01-garage.ts', 'CARTE_GARAGE')


def finis(r, fichier, constante, plats, puits_pas=3, caveau=(120, 400), ennemis='a'):
    n = r.n
    souterrain(r, seq_puits=[plats[i][0] + 3 for i in range(1, len(plats), puits_pas)], caveau=caveau, ennemis=ennemis)
    r.ecrit(0, fichier, constante)


def alpages():
    plan = [
        ('plat', 24, dict(plus=-1, deco=3)),  # la radio : « Radio Sommet »
        ('colline', 20, dict(haut=3, lettres='ac')),
        ('plat', 18, dict(lettres='a', drones=1)),
        ('palier', 20, dict(dy=-4)),
        ('maison', 16, dict(lettres='ac')),
        ('plat', 14, dict(lettres='a')),
        ('fosse', 9, dict()),
        ('plat', 16, dict(lettres='ad')),
        ('echafaudage', 26, dict(niveaux=2, lettres='ac')),
        ('plat', 16, dict(lettres='a', digit='3', drones=1)),  # les vaches
        ('palier', 22, dict(dy=-4)),
        ('plat', 14, dict(lettres='ad')),
        ('pont', 32, dict(haut=7, lettres='ad')),
        ('plat', 14, dict(lettres='ac')),
        ('mur', 18, dict(haut=6)),
        ('plat', 16, dict(lettres='ad', drones=1)),
        ('iles', 32, dict(haut=13)),
        ('plat', 12, dict(lettres='ac')),
        ('cheminee', 26, dict(haut=11)),
        ('palier', 22, dict(dy=-4)),
        ('plat', 14, dict(lettres='adf')),
        ('fosse', 9, dict()),
        ('plat', 14, dict(lettres='ad')),
        ('tour', 22, dict(etages=3, lettres='adf', digit='2')),  # le chalet du DJ, là-haut
        ('plat', 18, dict(lettres='adf', drones=2)),
        ('echafaudage', 30, dict(niveaux=3, lettres='adf')),
        ('palier', 24, dict(dy=4)),
        ('plat', 16, dict(lettres='adf', digit='4')),  # le yodel
        ('palier', 22, dict(dy=4)),
        ('plat', 14, dict(lettres='adf')),
        ('arene', 44, dict(lettres='adf')),
    ]
    plan = avec_verrous(plan, 'ad')
    r = construit('Les Alpages Lounge', 'alpages', '02-alpages.ts', plan, '', '', 22, base=34)
    n = r.n
    plats = [p for p in r.pieces if p[2] == 'plat']
    finis(r, '02-alpages.ts', 'CARTE_ALPAGES', plats, ennemis='ad')


def cimes():
    plan = [
        ('plat', 24, dict(plus=-1, lettres='y', deco=2)),
        ('colline', 22, dict(haut=3, lettres='y')),
        ('palier', 20, dict(dy=-4)),
        ('plat', 16, dict(lettres='y', digit='2')),  # la glace et la neige qui tombe
        ('fosse', 9, dict(lettres='y')),
        ('plat', 16, dict(lettres='ya')),
        ('echafaudage', 26, dict(niveaux=2, lettres='y')),
        ('mur', 18, dict(haut=6, lettres='y')),
        ('plat', 14, dict(lettres='ya')),
        ('palier', 22, dict(dy=-4)),
        ('pont', 32, dict(haut=7, lettres='y')),
        ('plat', 16, dict(lettres='ya')),
        ('cheminee', 26, dict(haut=11, lettres='y')),
        ('plat', 14, dict(lettres='y')),
        ('iles', 32, dict(haut=13, lettres='y')),
        ('plat', 14, dict(lettres='ya')),
        ('fosse', 9, dict()),
        ('plat', 14, dict(lettres='y')),
        ('palier', 22, dict(dy=4)),
        ('tour', 22, dict(etages=3, lettres='ya', mat='R')),
        ('plat', 16, dict(lettres='yy')),
        ('palier', 24, dict(dy=-4)),
        ('echafaudage', 30, dict(niveaux=3, lettres='ya')),
        ('plat', 14, dict(lettres='yy', digit='3')),  # flash spécial : Detroit
        ('palier', 22, dict(dy=4)),
        ('plat', 18, dict(lettres='ya')),
    ]
    plan = avec_verrous(plan, 'ya')
    r = construit('Les Cimes Minimales', 'cimes', '03-cimes.ts', plan, '', '', 33, base=34)
    n = r.n
    plats = [p for p in r.pieces if p[2] == 'plat']
    souterrain(r, seq_puits=[plats[i][0] + 3 for i in range(1, len(plats), 3)], caveau=(120, 380), ennemis='y')
    # l'arène du Yéti Alpha, plate et fermée par de la roche, avec deux médiators ; le van est tout au bout
    x0 = n.w - 64
    n.niveler(x0, n.w)
    n.repere(x0 + 30, 'Y', surface=True)
    n.repere(x0 + 14, '+', surface=True)
    n.repere(x0 + 50, '+', surface=True)
    n.rect(x0 + 8, n.base - 9, x0 + 22, n.base - 8, 'G')
    n.rect(x0 + 38, n.base - 9, x0 + 52, n.base - 8, 'G')
    n.repere(n.w - 5, 'F', surface=True)
    r.ecrit(0, '03-cimes.ts', 'CARTE_CIMES')


def plage():
    plan = [
        ('plat', 24, dict(plus=-1, lettres='c', deco=3)),
        ('plat', 18, dict(lettres='ac', digit='1')),  # les danseurs du tube de l'été
        ('colline', 22, dict(haut=3, lettres='cc')),
        ('fosse', 9, dict(lettres='c')),
        ('plat', 16, dict(lettres='ac', digit='2')),  # le sable qui s'effondre
        ('maison', 16, dict(lettres='ac')),
        ('plat', 14, dict(lettres='cd')),
        ('pont', 34, dict(haut=6, lettres='cd')),  # un ponton
        ('plat', 16, dict(lettres='acd')),
        ('palier', 20, dict(dy=-3)),
        ('echafaudage', 26, dict(niveaux=2, lettres='cd')),
        ('plat', 14, dict(lettres='acf')),
        ('mur', 18, dict(haut=6)),
        ('plat', 16, dict(lettres='cdf')),
        ('palier', 20, dict(dy=3)),
        ('iles', 32, dict(haut=12)),
        ('plat', 14, dict(lettres='acd')),
        ('fosse', 9, dict()),
        ('plat', 14, dict(lettres='cdf')),
        ('cheminee', 26, dict(haut=10)),
        ('tour', 20, dict(etages=3, lettres='acdf')),
        ('plat', 16, dict(lettres='cdb')),
        ('pont', 36, dict(haut=7, lettres='cdf')),
        ('palier', 22, dict(dy=-3)),
        ('plat', 14, dict(lettres='acdf', digit='3')),  # reggae, cumbia, raï...
        ('echafaudage', 30, dict(niveaux=3, lettres='cdf')),
        ('palier', 22, dict(dy=3)),
        ('plat', 16, dict(lettres='cdb')),
        ('arene', 44, dict(lettres='acdbf')),
    ]
    plan = avec_verrous(plan, 'acd')
    r = construit('La Plage du Tube de l’Été', 'plage', '04-plage.ts', plan, '', '', 44)
    plats = [p for p in r.pieces if p[2] == 'plat']
    finis(r, '04-plage.ts', 'CARTE_PLAGE', plats, ennemis='acd')


def ville():
    plan = [
        ('plat', 24, dict(plus=-1, lettres='a', deco=3)),
        ('plat', 18, dict(lettres='ar', digit='1')),  # les robots vocodeurs
        ('colline', 22, dict(haut=3, lettres='ac')),
        ('palier', 20, dict(dy=-4)),
        ('tour', 20, dict(etages=3, lettres='acr', mat='D', vitre=True, tyro=28, digit='2')),  # la tyrolienne entre les toits
        ('plat', 16, dict(lettres='ar', drones=1)),
        ('fosse', 9, dict()),
        ('plat', 14, dict(lettres='acf')),
        ('echafaudage', 28, dict(niveaux=3, lettres='adr')),
        ('plat', 14, dict(lettres='arf', drones=1)),
        ('mur', 18, dict(haut=7)),
        ('plat', 16, dict(lettres='acdr', digit='3')),  # le vocodeur
        ('palier', 22, dict(dy=4)),
        ('pont', 36, dict(haut=8, lettres='adr')),
        ('plat', 14, dict(lettres='arf')),
        ('tour', 24, dict(etages=4, lettres='acdr', mat='D', vitre=True, tyro=30)),
        ('plat', 16, dict(lettres='arrf', drones=2)),
        ('cheminee', 26, dict(haut=11)),
        ('palier', 22, dict(dy=-4)),
        ('plat', 14, dict(lettres='arcf')),
        ('fosse', 9, dict()),
        ('plat', 14, dict(lettres='adr')),
        ('iles', 34, dict(haut=14)),
        ('plat', 14, dict(lettres='arrf')),
        ('echafaudage', 32, dict(niveaux=3, lettres='adrf')),
        ('palier', 22, dict(dy=4)),
        ('plat', 16, dict(lettres='arrb', digit='4', drones=2)),  # la tour du Club Infini
        ('tour', 24, dict(etages=3, lettres='acdr', mat='M', vitre=True)),
        ('plat', 16, dict(lettres='arrf')),
        ('arene', 48, dict(lettres='acdrf')),
    ]
    plan = avec_verrous(plan, 'acr')
    r = construit('La Ville Autotunée', 'ville', '05-ville.ts', plan, '', '', 55)
    plats = [p for p in r.pieces if p[2] == 'plat']
    finis(r, '05-ville.ts', 'CARTE_VILLE', plats, ennemis='acr')


RECETTES = {'garage': garage, 'alpages': alpages, 'cimes': cimes, 'plage': plage, 'ville': ville}

if __name__ == '__main__':
    for nom in sys.argv[1:] or list(RECETTES):
        RECETTES[nom]()
