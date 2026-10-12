"""Gabarits des héros dont l'instrument est dans le sprite : polygones et pivots dans l'espace de travail
(voir prepare_instrument.py). La pièce `arme` (instrument et bras qui le tiennent) pivote pour viser."""
from gabarit_guitare import CORPS as CORPS_TOM, MEMBRES as MEMBRES_TOM, source_remplissage as SOURCE_TOM
from squelette import Membre


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


# ---- Mat : basse tenue comme la guitare de Tom
MAT = [
    Membre('arme', [(36, 96), (62, 96), (66, 122), (98, 120), (108, 108), (140, 96), (176, 70), (222, 60), (224, 100),
                    (170, 108), (168, 128), (142, 134), (120, 152), (118, 164), (100, 194), (36, 194)],
           (60, 102), filtre=pas_noir, z=1, epure=True),
] + jambes(
    [(100, 150), (140, 150), (140, 205), (100, 205)], [(104, 205), (154, 205), (154, 250), (104, 250)],
    [(58, 186), (102, 186), (102, 214), (58, 214)], [(54, 212), (102, 212), (102, 252), (54, 252)],
    (122, 158), (122, 206), (84, 186), (76, 212), ((122, 206), (0, 1)), ((76, 212), (0, 1)), retient=12)
CORPS_MAT = [(52, 96), (126, 92), (134, 130), (128, 172), (80, 172), (50, 130)]


def source_mat(x, y, rgb):
    r, g, b = rgb
    if y < 152:
        return 18 <= r <= 48 and 18 <= g <= 48 and 18 <= b <= 52
    return b > r + 25 and b < 140 and r < 70


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
    'mat': (MAT, CORPS_MAT, source_mat, 112, VISEES_GUITARE),
    'jbt': (JBT, CORPS_JBT, source_jbt, 118, VISEES_BRAS),
    'jbg': (JBG, CORPS_JBG, None, 118, VISEES_GUITARE),
}
