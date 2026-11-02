"""La marche du nouveau Mat (mode essai), tirée de sa seule pose de marche (voir prepare-mat-essai.py). Aucun pixel n'est redessiné :
la jambe de devant est découpée en trois morceaux (cuisse, tibia, pied), qui tournent autour de la hanche, du genou et de la
cheville (rotation façon RotSprite : agrandie huit fois, tournée sans lissage, puis rééchantillonnée) ; la jambe de derrière est
la même, un peu assombrie (elle est de l'autre côté du corps) ; le haut du corps, les bras et la guitare ne bougent pas. Six
images : le pas posé, l'appui, le passage, puis la même chose de l'autre jambe.
"""
import math

import numpy as np
from PIL import Image

# les articulations de la jambe de devant, sur la pose de marche remise sur sa grille (pixels de planche)
HANCHE, CHEVILLE = (55, 77), (68, 100)
HANCHE_DERRIERE = (38, 79)
JAMBE0 = 30  # l'angle de la jambe dans la pose (degrés depuis la verticale, vers l'avant)
# le pas d'une jambe, image par image : (angle de la jambe, angle du pied, levée en pixels) ; l'autre jambe a trois images d'écart
PAS = [(30, 4, 0), (12, 0, 0), (-6, 0, 0), (-26, -28, 0), (-8, -16, 4), (14, 6, 3)]
MARGE = 40


# le bas du haut du corps (le t-shirt, la guitare) : tout ce qui est dessous est une jambe ; les deux jambes séparées à l'entrejambe
BORD_HAUT = [(0, 79), (22, 81), (30, 89), (40, 88), (48, 81), (58, 73), (70, 71), (105, 71)]
ENTREJAMBE = 43


def _jambes(nat, o=0):
    """Les masques des deux jambes : tout ce qui est sous le haut du corps, coupé à l'entrejambe (le contour compris)."""
    plein = nat[..., 3] > 0
    h, w = plein.shape
    ys, xs = np.mgrid[0:h, 0:w]
    bx, by = zip(*BORD_HAUT)
    bord = np.interp(xs - o, bx, by) + o
    bas = plein & (ys >= bord)
    return bas & (xs >= ENTREJAMBE + o), bas & (xs < ENTREJAMBE + o)


def _tourne(piece, pivot, angle):
    """La pièce (RVBA) tournée de `angle` degrés (sens du jeu : vers l'avant quand positif) autour de `pivot`, façon RotSprite."""
    k = 8
    h, w = piece.shape[:2]
    grand = Image.fromarray(piece).resize((w * k, h * k), Image.NEAREST)
    # PIL tourne dans le sens inverse des aiguilles d'une montre à l'écran : une jambe qui pointe vers le bas part vers la droite
    t = grand.rotate(angle, resample=Image.NEAREST, center=(pivot[0] * k + k / 2, pivot[1] * k + k / 2))
    a = np.array(t)
    return a[k // 2 :: k, k // 2 :: k][:h, :w]


def _tourne_point(p, centre, angle):
    t = math.radians(angle)
    dx, dy = p[0] - centre[0], p[1] - centre[1]
    # même sens que _tourne : angle positif = vers l'avant (le bas part vers la droite)
    return (centre[0] + dx * math.cos(t) + dy * math.sin(t), centre[1] - dx * math.sin(t) + dy * math.cos(t))


def _colle(dest, piece, de, vers):
    """Colle la pièce (sur la même toile que `dest`) décalée pour que son point `de` tombe en `vers`."""
    dx, dy = round(vers[0] - de[0]), round(vers[1] - de[1])
    p = np.roll(np.roll(piece, dy, 0), dx, 1)
    m = p[..., 3] > 0
    dest[m] = p[m]


def nettoie(img, mini=12):
    """Retire les miettes des découpes : pixels isolés (moins de deux voisins) et îlots de moins de `mini` pixels."""
    from scipy import ndimage

    a = img.copy()
    plein = a[..., 3] > 0
    voisins = ndimage.convolve(plein.astype(int), np.ones((3, 3), int), mode='constant') - plein
    a[plein & (voisins < 2)] = 0
    etiquettes, n = ndimage.label(a[..., 3] > 0, structure=np.ones((3, 3)))
    tailles = ndimage.sum(np.ones_like(etiquettes), etiquettes, range(1, n + 1))
    for e, t in enumerate(tailles, 1):
        if t < mini:
            a[etiquettes == e] = 0
    return a


def _assombrie(piece, k=0.72):
    p = piece.copy()
    p[..., :3] = (p[..., :3].astype(float) * k).astype(np.uint8)
    return p


def marche(nat, poses=None):
    """Les six images de la marche, toutes sur la même toile (le haut du corps au même endroit) : une liste de tableaux RVBA.
    `poses` : d'autres images, chacune (pas de la jambe de devant, pas de celle de derrière)."""
    if poses is None:
        poses = [(PAS[i], PAS[(i + 3) % len(PAS)]) for i in range(len(PAS))]
    # une toile plus grande : les jambes peuvent sortir du cadre de la pose
    h, w = nat.shape[:2]
    toile = np.zeros((h + 2 * MARGE, w + 2 * MARGE, 4), np.uint8)
    toile[MARGE : MARGE + h, MARGE : MARGE + w] = nat
    decale = lambda p: (p[0] + MARGE, p[1] + MARGE)
    hanche, cheville, hanche_d = map(decale, (HANCHE, CHEVILLE, HANCHE_DERRIERE))
    devant, derriere = _jambes(toile, MARGE)
    corps = toile.copy()
    corps[devant | derriere] = 0
    corps = nettoie(corps)
    # deux morceaux : la jambe d'un bloc (elle tourne à la hanche, sans couture au genou) et le pied (il tourne à la cheville)
    hh, ww = toile.shape[:2]
    ys = np.mgrid[0:hh, 0:ww][0]
    pied_m = devant & (ys >= cheville[1] - 1)
    morceau = lambda m: np.where(m[..., None], toile, 0).astype(np.uint8)
    jambe_img, pied = morceau(devant & ~pied_m), morceau(pied_m)
    contour = np.array([24, 22, 30, 255], np.uint8)

    def jambe(dest, hanche_ici, pas, sombre):
        angle, pied_angle, levee = pas
        d = angle - JAMBE0
        couche = np.zeros_like(dest)
        ch = _tourne_point(cheville, hanche, d)
        dx, dy = hanche_ici[0] - hanche[0], hanche_ici[1] - hanche[1] - levee
        _colle(couche, _tourne(jambe_img, hanche, d), hanche, (hanche[0] + dx, hanche[1] + dy))
        _colle(couche, _tourne(pied, cheville, pied_angle), cheville, (ch[0] + dx, ch[1] + dy))
        couche = nettoie(couche, 6)
        if sombre:
            couche = _assombrie(couche)
        # un contour sombre tout autour : les deux jambes se détachent l'une de l'autre
        m = couche[..., 3] > 0
        bord = np.zeros_like(m)
        for oy, ox in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            bord |= np.roll(np.roll(m, oy, 0), ox, 1)
        dest[bord & ~m] = contour
        dest[m] = couche[m]

    images = []
    for avant, arriere in poses:
        img = np.zeros_like(toile)
        jambe(img, hanche_d, arriere, True)
        jambe(img, hanche, avant, False)
        m = corps[..., 3] > 0
        img[m] = corps[m]
        images.append(nettoie(img))
    # les pieds au sol : chaque image descend ou monte pour que son pixel le plus bas soit sur la même ligne (le corps balance)
    sol = max(np.nonzero(i[..., 3].any(1))[0].max() for i in images)
    return [np.roll(i, sol - np.nonzero(i[..., 3].any(1))[0].max(), 0) for i in images]


def saut(nat):
    """Le saut, tiré de la pose de marche : la jambe de devant lancée haut, celle de derrière repliée en arrière."""
    return marche(nat, [((48, 22, 7), (-38, -40, 12))])[0]


# la montée de l'échelle, de dos : la guitare (le manche et le corps) et les deux bras, sur l'image echelle-1 remise sur sa grille
GUITARE_MANCHE = (35, 0, 46, 70)  # x0, y0, x1, y1
GUITARE_CORPS = (24, 66, 57, 110)
BRAS_GAUCHE, BRAS_DROIT = (0, 21), (61, 82)  # leurs colonnes
EPAULE = 36  # la rangée sous laquelle les bras ne bougent plus
ALLONGE = 5  # de combien une main monte, l'autre descend


def _bras(img, colonnes, dy):
    """Le bras (ses colonnes, au-dessus de l'épaule) étiré vers le haut (dy > 0) ou tassé vers le bas (dy < 0), l'épaule fixe."""
    x0, x1 = colonnes
    src = img[: EPAULE + 1, x0:x1].copy()
    img[: EPAULE + 1, x0:x1] = 0
    # la rangée y de l'image finale prend la rangée y0 + (y - (y0 - dy)) * k de l'original : le haut monte de dy, l'épaule reste
    y0 = np.nonzero(src[..., 3].any(1))[0].min()
    haut = y0 - dy
    for y in range(max(0, haut), EPAULE + 1):
        ys = y0 + (y - haut) * (EPAULE - y0) / (EPAULE - haut)
        img[y, x0:x1] = np.where(src[int(round(ys)), :, 3:4] > 0, src[int(round(ys))], img[y, x0:x1])


def echelle(nat):
    """Les deux temps de la montée, tirés d'une seule image de dos : le premier, la main gauche haute et la droite basse ; le second,
    son miroir (les jambes et les bras s'inversent), mais la guitare recollée telle quelle : elle ne pivote pas d'un temps à l'autre."""
    marge = ALLONGE + 1
    a = np.zeros((nat.shape[0] + marge, nat.shape[1], 4), np.uint8)
    a[marge:] = nat
    guitare = np.zeros(a.shape[:2], bool)
    for x0, y0, x1, y1 in (GUITARE_MANCHE, GUITARE_CORPS):
        guitare[y0 + marge : y1 + marge, x0:x1] = True
    # seulement ce qui est guitare dans ces cadres : le bois du manche, le corps (sunburst, plaque blanche), pas le t-shirt ni le jean
    r, g, b = (a[..., k].astype(int) for k in range(3))
    jean = (b > r + 20) & (b > g)
    tshirt = (r + g + b < 110) & (abs(r - b) < 25)
    guitare &= (a[..., 3] > 0) & ~jean & ~tshirt
    global EPAULE
    epaule = EPAULE
    EPAULE = epaule + marge
    premier = a.copy()
    _bras(premier, BRAS_GAUCHE, ALLONGE)
    _bras(premier, BRAS_DROIT, -ALLONGE)
    EPAULE = epaule
    second = premier[:, ::-1].copy()
    second[guitare] = premier[guitare]
    return premier, second
