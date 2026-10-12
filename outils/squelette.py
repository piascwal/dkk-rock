"""Animation par découpe en membres d'un sprite pixel art de référence (voir anime-heros.py).

Un personnage = un tronc (tête comprise) et des membres rigides (bras, cuisses, tibias), chacun avec
son polygone et son pivot, en coordonnées natives. Une pose = un angle par articulation. Les pixels
viennent tous de la référence ; rien n'est redessiné. Rotation façon RotSprite simplifié : agrandir ×8,
tourner sans lissage, puis voter dans chaque case 8×8.
"""
import math

import numpy as np
from PIL import Image

K = 8  # agrandissement pour la rotation


class Membre:
    def __init__(self, nom, polygone, pivot, parent=None, retient=0, derriere=False, coupe=None, filtre=None):
        self.nom, self.polygone, self.pivot = nom, polygone, pivot
        self.parent = parent  # nom du membre dont il suit le mouvement (tibia -> cuisse, par exemple)
        self.retient = retient  # rayon autour du pivot dont les pixels restent dans le tronc
        self.derriere = derriere  # dessiné derrière le tronc
        # (point, normale) : ne garde que les pixels du côté de la normale (coupe perpendiculaire au genou)
        self.coupe = coupe
        # (r, g, b) -> bool : ne garde que les pixels de ces couleurs (un bras ne prend pas le maillot)
        self.filtre = filtre

    def contient(self, x, y, rgb=None):
        if not dans_polygone(self.polygone, x, y):
            return False
        if self.filtre and rgb is not None and not self.filtre(*rgb):
            return False
        if self.coupe:
            (px, py), (nx, ny) = self.coupe
            return (x - px) * nx + (y - py) * ny >= 0
        return True


def dans_polygone(poly, x, y):
    dedans = False
    n = len(poly)
    for i in range(n):
        (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            dedans = not dedans
    return dedans


def vote(a, k=K):
    """Réduit par cases k×k : opaque dès 1/3 de pixels pleins, couleur la plus fréquente."""
    h, w = a.shape[0] // k, a.shape[1] // k
    cases = a.reshape(h, k, w, k, 4).transpose(0, 2, 1, 3, 4).reshape(h, w, k * k, 4)
    sortie = np.zeros((h, w, 4), np.uint8)
    for y, x in zip(*np.nonzero((cases[..., 3] > 0).sum(2) * 3 >= k * k)):
        px = cases[y, x]
        pleins = px[px[:, 3] > 0]
        couleurs, nb = np.unique(pleins, axis=0, return_counts=True)
        sortie[y, x] = couleurs[nb.argmax()]
    return sortie


def tourne(piece, angle, pivot, decalage=(0.0, 0.0)):
    """Fait tourner une image RGBA de `angle` degrés (sens horaire à l'écran) autour de `pivot`, puis la décale."""
    if angle == 0 and decalage == (0.0, 0.0):
        return piece
    grand = piece.resize((piece.width * K, piece.height * K), Image.NEAREST)
    centre = ((pivot[0] + 0.5) * K, (pivot[1] + 0.5) * K)
    r = grand.rotate(-angle, resample=Image.NEAREST, center=centre,
                     translate=(round(decalage[0] * K), round(decalage[1] * K)))
    return Image.fromarray(vote(np.array(r)))


def pivot_apres(pivot, angle, autour, decalage=(0.0, 0.0)):
    """Où va `pivot` quand on tourne de `angle` autour de `autour`, puis décale."""
    a = math.radians(angle)
    dx, dy = pivot[0] - autour[0], pivot[1] - autour[1]
    return (autour[0] + dx * math.cos(a) - dy * math.sin(a) + decalage[0],
            autour[1] + dx * math.sin(a) + dy * math.cos(a) + decalage[1])


class Personnage:
    def __init__(self, image, membres):
        self.taille = image.size
        self.membres = {m.nom: m for m in membres}
        a = np.array(image.convert('RGBA'))
        self.tronc = a.copy()
        self.pieces = {}
        # un pixel appartient au premier membre (dans l'ordre donné) dont le polygone le contient
        libres = a[..., 3] > 0
        for m in membres:
            piece = np.zeros_like(a)
            for y, x in zip(*np.nonzero(libres)):
                if m.contient(x + 0.5, y + 0.5, a[y, x, :3].astype(int)):
                    piece[y, x] = a[y, x]
                    libres[y, x] = False
                    if math.hypot(x + 0.5 - m.pivot[0], y + 0.5 - m.pivot[1]) > m.retient:
                        self.tronc[y, x] = 0
            self.pieces[m.nom] = Image.fromarray(piece)

    def pose(self, angles=None, corps=(0, 0)):
        """Assemble une pose. `angles` : {membre: degrés}, ceux d'un enfant (tibia) s'ajoutent à ceux du parent."""
        angles = angles or {}
        total, piv = {}, {}

        def resout(nom):
            if nom in total:
                return
            m = self.membres[nom]
            if m.parent:
                resout(m.parent)
                p = self.membres[m.parent]
                total[nom] = total[m.parent] + angles.get(nom, 0.0)
                piv[nom] = pivot_apres(m.pivot, total[m.parent], p.pivot)
            else:
                total[nom] = angles.get(nom, 0.0)
                piv[nom] = m.pivot

        derriere, devant = [], []
        for nom, m in self.membres.items():
            resout(nom)
            decal = (piv[nom][0] - m.pivot[0], piv[nom][1] - m.pivot[1])
            (derriere if m.derriere else devant).append(tourne(self.pieces[nom], total[nom], m.pivot, decal))
        w, h = self.taille
        toile = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        for img in derriere:
            toile.alpha_composite(img)
        toile.alpha_composite(Image.fromarray(self.tronc))
        for img in devant:
            toile.alpha_composite(img)
        res = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        res.alpha_composite(toile, (round(corps[0]), round(corps[1])))
        return res
