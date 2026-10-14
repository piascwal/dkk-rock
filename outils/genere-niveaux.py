#!/usr/bin/env python3
"""Génère les cartes des niveaux (src/niveaux/cartes/NN-*.ts) à partir de plans (outils/niveaux/plans.py) : une suite de
lieux (forteresses, barrages, traversées de gouffres, tours...) reliés par de très courts raccords, et sous la terre des
caves entrées par une échelle (outils/niveaux/souterrain.py). Jamais de longue ligne droite sans rien à y faire.

Usage : python3 outils/genere-niveaux.py [garage|alpages|cimes|plage|ville ...]     Sortie : les cartes + un aperçu PNG
Les cartes sont ensuite modifiables à la main (c'est du texte) ; relancer le script les écrase.
"""
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / 'niveaux'))

from peintre import Niveau
from plans import NIVEAUX, enchaine
from souterrain import souterrain
from structures import forteresse, traversee
from verrous import barrage, gouffre

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
    def p_plat(self, x0, x1, lettres='a', plus=0, deco=2, drones=0, cage=False, caissons=False):
        n = self.n
        n.plat(x0, x1, deco)
        if cage:  # un membre du groupe en cage, au milieu
            n.repere((x0 + x1) // 2, 'K', surface=True)
        if caissons:  # des caissons de basses, en pile au milieu
            for dx in (-1, 0, 1):
                n.repere((x0 + x1) // 2 + dx, 'T', surface=True)
            n.repere((x0 + x1) // 2, 'T', ymin=n.base - 4)
        self.combat(x0, x1, lettres, plus, drones)

    def p_raccord(self, x0, x1, lettres='a'):
        """Un court raccord entre deux lieux : un ennemi, rien de plus (le décor est semé à part)."""
        # (pas de caisse posée au hasard : à quatre tuiles de large, elle finirait devant la porte du lieu suivant)
        self.n.ennemis(x0 + 1, x1 - 1, lettres, 1 + (self.d > 0.5))

    def p_vide(self, x0, x1):
        """Du terrain nu, pour une arène que le plan remplira après coup."""

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
            n.tyro(x1 - 1, top - 1, x1 + tyro, n.base - 5)  # part du bord du toit : le câble ne traverse rien

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
        barrage(self.n, x0 + 2, haut, lettres, tyro, butin)
        self.n.ennemis(x1 - 9, x1 - 1, lettres, 2)

    def p_gouffre(self, x0, x1, lettres='a', nb=4):
        gouffre(self.n, x0 + 3, x1 - x0 - 6, lettres, nb)

    def p_forteresse(self, x0, x1, etages=3, lettres='a', sous_sol=True, cage=False, mat=None):
        forteresse(self.n, x0 + 2, x1 - x0 - 4, etages, lettres, mat, sous_sol, cage)

    def p_traversee(self, x0, x1, lettres='a'):
        traversee(self.n, x0, lettres)

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
            if g in ('plat', 'raccord', 'arene') and x0 >= cible - 10:
                r.drapeau(x0 + (x1 - x0) // 2)
                break
    # le van, au bout
    n.repere(total - 5, 'F', surface=True)
    return r


def fabrique(cle):
    """Construit un niveau d'après son plan (outils/niveaux/plans.py), puis ses caves, et l'écrit."""
    cfg = NIVEAUX[cle]
    plan = enchaine(cfg['lieux'], cfg['graine'], cfg['raccord'])
    r = construit(cfg['nom'], cfg['theme'], cfg['textes'], plan, '', '', cfg['graine'], base=cfg['base'])
    souterrain(r, cfg['caves'])
    if cle == 'cimes':
        arene_du_yeti(r)
    r.ecrit(0, cfg['fichier'], cfg['constante'])
    return r


def arene_du_yeti(r):
    """L'arène du Yéti Alpha, plate et fermée par de la roche, avec deux médiators ; le van est tout au bout."""
    n = r.n
    x0 = n.w - 64
    n.niveler(x0, n.w)
    n.repere(x0 + 30, 'Y', surface=True)
    n.repere(x0 + 14, '+', surface=True)
    n.repere(x0 + 50, '+', surface=True)
    n.rect(x0 + 8, n.base - 9, x0 + 22, n.base - 8, 'G')
    n.rect(x0 + 38, n.base - 9, x0 + 52, n.base - 8, 'G')
    n.repere(n.w - 5, 'F', surface=True)


if __name__ == '__main__':
    for nom in sys.argv[1:] or list(NIVEAUX):
        fabrique(nom)
