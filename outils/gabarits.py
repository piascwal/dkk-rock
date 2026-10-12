"""Les gabarits de découpe des personnages : polygones et pivots en coordonnées natives (128×128)."""
from squelette import Membre


def peau_ou_contour(r, g, b, *_):
    """Peau (tons chauds) ou contour sombre : de quoi isoler un bras nu du vêtement."""
    return (r > g > b and r - b > 40 and r > 110) or r + g + b < 150


class Gabarit:
    def __init__(self, membres, repos, ancre_x, foulee=25, genou=45, bras=12):
        self.membres = membres
        self.repos = repos  # angles absolus des cuisses dans la référence (+ = pied vers l'arrière)
        self.ancre_x = ancre_x  # milieu du personnage, pour centrer les images
        self.foulee, self.genou, self.bras = foulee, genou, bras

# Tom et JBT : même corps, même pose (en foulée, penché), seuls les vêtements et la tête changent.
# Les membres sont listés dans l'ordre de priorité : un pixel va au premier qui le contient.
GABARIT_COSTAUD = [
    Membre('bras_arriere', [(12, 38), (34, 36), (48, 44), (48, 58), (43, 64), (42, 86), (12, 86)], (32, 46),
           retient=8, derriere=True, filtre=peau_ou_contour),
    Membre('bras_avant', [(61, 55), (72, 52), (86, 51), (95, 57), (104, 63), (112, 72), (112, 86), (92, 87), (72, 79), (61, 68)],
           (67, 58), retient=6, filtre=peau_ou_contour),
    Membre('tibia_arriere', [(8, 80), (40, 80), (52, 92), (38, 104), (34, 128), (8, 128)], (31, 95), parent='cuisse_arriere',
           derriere=True, coupe=((31, 95), (-0.58, 0.81))),
    Membre('cuisse_arriere', [(8, 76), (38, 76), (51, 80), (51, 90), (8, 128)], (43, 80), retient=10, derriere=True),
    Membre('tibia_avant', [(54, 80), (102, 80), (102, 128), (54, 128)], (74, 98), parent='cuisse_avant',
           coupe=((74, 98), (0, 1))),
    Membre('cuisse_avant', [(51, 80), (100, 80), (100, 128), (51, 128)], (73, 82), retient=16),
]


# JBM : corps plus mince et plus droit, sweat à capuche gris (pas de peau à isoler sur les bras).
GABARIT_MINCE = [
    Membre('bras_arriere', [(30, 36), (51, 33), (52, 50), (50, 66), (50, 84), (30, 84)], (45, 40), retient=7, derriere=True),
    Membre('bras_avant', [(71, 36), (86, 38), (88, 60), (96, 66), (96, 82), (76, 82), (76, 67), (71, 60)], (77, 42), retient=6),
    Membre('tibia_arriere', [(30, 72), (59, 72), (60, 90), (58, 128), (30, 128)], (50, 94), parent='cuisse_arriere',
           derriere=True, coupe=((50, 94), (-0.19, 0.98))),
    Membre('cuisse_arriere', [(30, 72), (59, 72), (60, 90), (58, 128), (30, 128)], (54, 76), retient=10, derriere=True),
    Membre('tibia_avant', [(60, 72), (98, 72), (98, 128), (60, 128)], (73, 94), parent='cuisse_avant',
           coupe=((73, 94), (0.16, 0.99))),
    Membre('cuisse_avant', [(60, 72), (98, 72), (98, 128), (60, 128)], (70, 76), retient=14),
]

# Mat : debout, de face, T-shirt noir à manches courtes : seuls les avant-bras sont nus (filtre de peau).
GABARIT_MAT = [
    Membre('bras_arriere', [(38, 52), (58, 52), (60, 58), (58, 70), (60, 88), (38, 88)], (52, 54), retient=5, derriere=True,
           filtre=peau_ou_contour),
    Membre('bras_avant', [(75, 56), (92, 56), (93, 70), (93, 86), (74, 86), (75, 70)], (80, 55), retient=5,
           filtre=peau_ou_contour),
    Membre('tibia_arriere', [(44, 72), (66, 72), (67, 90), (66, 128), (44, 128)], (55, 92), parent='cuisse_arriere',
           derriere=True, coupe=((55, 92), (-0.14, 0.99))),
    Membre('cuisse_arriere', [(44, 72), (66, 72), (67, 90), (66, 128), (44, 128)], (58, 74), retient=9, derriere=True),
    Membre('tibia_avant', [(67, 72), (92, 72), (92, 128), (67, 128)], (75, 92), parent='cuisse_avant',
           coupe=((75, 92), (0.05, 1))),
    Membre('cuisse_avant', [(67, 72), (92, 72), (92, 128), (67, 128)], (74, 74), retient=11),
]

# JBG : long manteau noir ; les pans du manteau restent avec le tronc, seules les jambes et les manches bougent.
GABARIT_MANTEAU = [
    Membre('bras_arriere', [(30, 36), (50, 36), (52, 60), (52, 80), (38, 80), (30, 70)], (44, 42), retient=8, derriere=True),
    Membre('bras_avant', [(76, 38), (92, 40), (98, 60), (98, 80), (82, 80), (76, 64)], (84, 44), retient=6),
    Membre('tibia_arriere', [(51, 78), (68, 78), (69, 128), (36, 128), (36, 104), (47, 101), (50, 90)], (52, 96),
           parent='cuisse_arriere', derriere=True, coupe=((52, 96), (-0.35, 0.94))),
    Membre('cuisse_arriere', [(51, 78), (68, 78), (69, 128), (36, 128), (36, 104), (47, 101), (50, 90)], (58, 80),
           retient=10, derriere=True),
    Membre('tibia_avant', [(68, 78), (82, 78), (84, 92), (84, 104), (104, 106), (104, 128), (68, 128)], (77, 96),
           parent='cuisse_avant', coupe=((77, 96), (0.06, 1))),
    Membre('cuisse_avant', [(68, 78), (82, 78), (84, 92), (84, 104), (104, 106), (104, 128), (68, 128)], (76, 80), retient=12),
]

GABARITS = {
    'tom': Gabarit(GABARIT_COSTAUD, {'cuisse_arriere': 25, 'cuisse_avant': -13}, 64),
    'jbt': Gabarit(GABARIT_COSTAUD, {'cuisse_arriere': 25, 'cuisse_avant': -13}, 64),
    'mat': Gabarit(GABARIT_MAT, {'cuisse_arriere': 8, 'cuisse_avant': -3}, 64, foulee=24, genou=42, bras=10),
    'jbg': Gabarit(GABARIT_MANTEAU, {'cuisse_arriere': 20, 'cuisse_avant': -3}, 63, foulee=22, genou=40, bras=8),
    'jbm': Gabarit(GABARIT_MINCE, {'cuisse_arriere': 11, 'cuisse_avant': -9}, 63, foulee=22, genou=42, bras=10),
}
