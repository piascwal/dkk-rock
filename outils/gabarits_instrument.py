"""Gabarits des héros dont l'instrument est dans le sprite : polygones et pivots dans l'espace de travail
(voir prepare_instrument.py). La pièce `arme` (instrument et bras qui le tiennent) pivote pour viser."""
from gabarit_guitare import CORPS as CORPS_TOM, MEMBRES as MEMBRES_TOM, source_remplissage as SOURCE_TOM
from squelette import Membre, dans_polygone


def pas_clair(r, g, b, x, y):
    """Ni le blanc du maillot ni le bleu sombre du pantalon (pour ne prendre que bras, baguettes et contours)."""
    return not ((r > 150 and g > 150 and b > 150) or (b > r + 25 and r < 100))


def pas_noir(r, g, b, x, y):
    """Sans le noir du maillot (la basse garde ses contours et ses gris)."""
    return not (18 <= r <= 48 and 18 <= g <= 48 and 18 <= b <= 52)


def pas_peau(r, g, b, x, y):
    """Les jambes ne prennent pas la peau ni les baguettes (couleur chair)."""
    return not (r > 150 and r > b + 40)


def jambes(av, tav, ar, tar, pv_av, pv_tav, pv_ar, pv_tar, coupe_av, coupe_ar, filtre=None, retient=14):
    """Quatre pièces de jambes : (polygone, pivot) pour cuisse/tibia avant et arrière, coupes aux genoux."""
    return [
        Membre('tibia_avant', tav, pv_tav, parent='cuisse_avant', coupe=coupe_av, filtre=filtre),
        Membre('cuisse_avant', av, pv_av, retient=retient, filtre=filtre),
        Membre('tibia_arriere', tar, pv_tar, parent='cuisse_arriere', derriere=True, coupe=coupe_ar, filtre=filtre),
        Membre('cuisse_arriere', ar, pv_ar, retient=retient, derriere=True, filtre=filtre),
    ]


# ---- JBM : micro à la main avant ; le bras entier (manche, main, micro) pivote à l'épaule
JBM = [
    Membre('arme', [(143, 92), (162, 92), (162, 124), (192, 126), (192, 152), (172, 162), (150, 160), (144, 146), (143, 130)],
           (150, 94), z=1),
] + jambes(
    [(116, 136), (160, 136), (160, 186), (136, 186)], [(135, 186), (178, 186), (178, 248), (135, 248)],
    [(80, 136), (122, 136), (122, 146), (104, 194), (76, 194)], [(58, 194), (110, 194), (110, 250), (58, 250)],
    (130, 144), (148, 186), (108, 142), (92, 194), ((148, 186), (0, 1)), ((92, 194), (0.15, 1)))
CORPS_JBM = None


def source_jbm(x, y, rgb):
    r, g, b = rgb
    return r + g + b > 180 and abs(r - b) < 25


# ---- Mat (outils/prepare-mat-essai.py) : la basse et les deux bras pivotent ensemble ; les points sont donnés sur sa
# grille d'origine (Mat debout, 118 pixels), posée à 14 pixels du bord et agrandie deux fois dans l'espace de travail
def _me(*points):
    return [(2 * (x + 14), 2 * (y + 2)) for x, y in points]


_TSHIRT_ME = _me((8, 31), (48, 29), (53, 62), (28, 68), (5, 58))


def basse_me(r, g, b, x, y):
    """La basse et les bras, sans le t-shirt noir qu'ils recouvrent ni le jean."""
    sombre = r + g + b < 150 and abs(r - b) < 25
    if sombre and dans_polygone(_TSHIRT_ME, x, y):
        return False
    return not (b > r + 25 and r < 100)


MAT_ESSAI = [
    Membre('arme', _me((1, 37), (20, 37), (30, 46), (44, 41), (56, 33), (70, 23), (93, 23), (93, 40), (66, 48), (65, 61),
                       (48, 63), (40, 72), (30, 84), (22, 93), (1, 93)), _me((30, 48))[0], filtre=basse_me, z=1),
] + jambes(
    _me((34, 69), (52, 67), (54, 96), (36, 96)), _me((32, 96), (60, 96), (60, 119), (32, 119)),
    _me((10, 86), (34, 70), (35, 96), (10, 96)), _me((6, 96), (35, 96), (35, 119), (6, 119)),
    _me((43, 73))[0], _me((45, 96))[0], _me((26, 76))[0], _me((22, 96))[0],
    (_me((45, 96))[0], (0, 1)), (_me((22, 96))[0], (0, 1)), retient=12)
# le tronc à reboucher : le t-shirt et le haut du jean, pas le vide où pendaient le bras et le corps de la basse
CORPS_MAT_ESSAI = _me((12, 40), (50, 36), (54, 66), (50, 76), (34, 84), (20, 80), (12, 66))


def source_mat_essai(x, y, rgb):
    r, g, b = rgb
    if y < 2 * (66 + 2):
        return r + g + b < 150 and abs(r - b) < 25
    return b > r + 25 and r < 100


# ---- JBT : baguettes ; le bras avant (image de droite) pivote à l'épaule
JBT = [
    Membre('arme', [(156, 108), (186, 108), (222, 100), (232, 104), (208, 140), (210, 162), (190, 178), (170, 178),
                    (174, 162), (160, 148), (154, 130)], (162, 110), filtre=pas_clair, z=1),
] + jambes(
    [(112, 150), (180, 150), (176, 200), (136, 200), (112, 170)], [(130, 198), (194, 198), (194, 248), (130, 248)],
    [(52, 150), (115, 150), (110, 190), (92, 198), (50, 198)], [(48, 196), (106, 196), (106, 250), (48, 250)],
    (150, 160), (152, 200), (96, 156), (82, 196), ((152, 200), (0, 1)), ((82, 196), (0.25, 1)), filtre=pas_peau)
CORPS_JBT = None


def source_jbt(x, y, rgb):
    r, g, b = rgb
    return r > 150 if y < 150 else (b > r + 25 and r < 100)


# ---- JBG : guitare V et mains forment une seule pièce
JBG = [
    Membre('arme', [(32, 128), (60, 128), (104, 118), (150, 106), (176, 84), (190, 72), (218, 68), (224, 76), (214, 92),
                    (192, 96), (190, 112), (170, 122), (150, 130), (128, 150), (100, 178), (82, 194), (66, 194), (62, 170),
                    (66, 150), (50, 140), (32, 138)], (110, 100), z=1, epure=True),
] + jambes(
    [(125, 140), (158, 140), (158, 205), (120, 205)], [(118, 205), (182, 205), (182, 250), (118, 250)],
    [(70, 178), (122, 150), (122, 205), (70, 205)], [(58, 205), (112, 205), (112, 250), (58, 250)],
    (140, 150), (140, 206), (112, 155), (88, 206), ((140, 206), (0, 1)), ((88, 206), (0, 1)))
CORPS_JBG = [(96, 120), (140, 114), (150, 135), (128, 168), (100, 186)]

# nom : (membres, masque du tronc, modèle de remplissage, milieu des pieds, angles de visée 1 à 4)
VISEES_GUITARE = {1: -28, 2: -48, 3: 26, 4: 46}
VISEES_BRAS = {1: -40, 2: -75, 3: 35, 4: 70}
HEROS = {
    'tom': (MEMBRES_TOM, CORPS_TOM, SOURCE_TOM, 262, VISEES_GUITARE),
    'jbm': (JBM, CORPS_JBM, source_jbm, 117, VISEES_BRAS),
    'jbt': (JBT, CORPS_JBT, source_jbt, 118, VISEES_BRAS),
    'jbg': (JBG, CORPS_JBG, None, 118, VISEES_GUITARE),
    'mat': (MAT_ESSAI, CORPS_MAT_ESSAI, source_mat_essai, 98, VISEES_GUITARE),
}
