"""Gabarit de Tom avec sa guitare : coordonnées en pixels du sprite à 512 px (cases de 2 px du fichier 1024)."""
from squelette import Membre


def hors_vetement(r, g, b, x, y):
    """La guitare et les bras, sans le maillot ni le pantalon bleus (sauf la tête du manche, sombre et bleutée)."""
    return x > 322 or not (b > r + 25)


ARME = [(146, 207), (232, 207), (238, 238), (268, 240), (280, 226), (290, 216), (364, 204), (364, 248), (322, 264),
        (318, 278), (288, 278), (268, 272), (262, 300), (232, 322), (146, 322)]
PIVOT_ARME = (200, 224)  # l'épaule : la guitare et les bras pivotent autour pour viser
CORPS = [(180, 205), (300, 205), (304, 240), (292, 262), (282, 292), (250, 302), (200, 302), (178, 260)]

MEMBRES = [
    Membre('arme', ARME, PIVOT_ARME, filtre=hors_vetement, z=1),
    Membre('tibia_avant', [(240, 336), (330, 336), (338, 380), (236, 380)], (282, 336), parent='cuisse_avant',
           coupe=((282, 336), (0, 1))),
    Membre('cuisse_avant', [(246, 288), (312, 288), (312, 336), (246, 336)], (280, 300), retient=14),
    Membre('tibia_arriere', [(140, 344), (236, 344), (242, 384), (140, 384)], (205, 342), parent='cuisse_arriere',
           derriere=True, coupe=((205, 342), (0.3, 0.95))),
    Membre('cuisse_arriere', [(160, 316), (262, 312), (262, 346), (160, 346)], (238, 306), retient=14, derriere=True),
]


def source_remplissage(x, y, rgb):
    """Sous la guitare : du maillot bleu vif au-dessus de la ceinture, du pantalon sombre en dessous."""
    r, g, b = rgb
    if y < 288:
        return b > 150 and r < 90
    return b > r + 25 and b < 140 and r < 70
