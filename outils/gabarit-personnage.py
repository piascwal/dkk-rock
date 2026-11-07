#!/usr/bin/env python3
"""Le gabarit des poses d'un nouveau personnage jouable : une planche de mannequins (4 images au plus par animation) à donner
en référence à une IA d'image, avec docs/GABARIT-PERSONNAGE.md (la consigne).

Usage : python3 outils/gabarit-personnage.py        (Pillow requis)
Sortie : docs/gabarit-personnage.png

Le mannequin : membres du côté du spectateur en bleu foncé, ceux de derrière en bleu clair, l'instrument en orange.
Il regarde vers la droite, pieds sur la ligne de sol (sauf en l'air). Fond magenta : celui qu'on attend des images.
"""
import math
import pathlib

from PIL import Image, ImageDraw, ImageFont

RACINE = pathlib.Path(__file__).resolve().parent.parent
SORTIE = RACINE / 'docs' / 'gabarit-personnage.png'
POLICE = '/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf'
POLICE_GRASSE = '/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf'

CASE_L, CASE_H, MARGE_G, ENTETE = 190, 230, 300, 130
SOL = 205  # la ligne de sol dans une case
MAGENTA, GRILLE = (255, 0, 255), (40, 40, 48)
AVANT, ARRIERE, CORPS, INSTRUMENT = (22, 46, 92), (130, 170, 220), (45, 45, 52), (232, 132, 30)
# longueurs du mannequin (pixels de la case)
TRONC, BRAS, AVBRAS, CUISSE, TIBIA, TETE = 48, 26, 26, 36, 36, 13


def pt(o, angle, l):
    """Un point à `l` de `o`, `angle` en degrés : 0 = vers le bas, 90 = vers l'avant (la droite)."""
    a = math.radians(angle)
    return (o[0] + l * math.sin(a), o[1] + l * math.cos(a))


def mannequin(d, x, pose):
    """Un mannequin de profil. pose : tronc (penché en avant, degrés), ja / jb (jambe avant / arrière : cuisse, tibia),
    ba / bb (bras avant / arrière : bras, avant-bras), haut (pixels au-dessus du sol), instrument (angle du manche ou None),
    dos (instrument porté dans le dos), objet (point lancé : (dx, dy) depuis la main avant)."""
    tr = pose.get('tronc', 0)
    hanche = (0.0, 0.0)
    cou = pt(hanche, 180 - tr, TRONC)
    epaule = pt(hanche, 180 - tr, TRONC * 0.85)
    tete = pt(hanche, 180 - tr, TRONC + TETE + 2)
    jambes = {}
    for k in ('ja', 'jb'):
        c, t = pose.get(k, (0, 0))
        genou = pt(hanche, c, CUISSE)
        cheville = pt(genou, t, TIBIA)
        pied = pt(cheville, t + 90, 12)
        jambes[k] = (genou, cheville, pied)
    bras = {}
    for k in ('ba', 'bb'):
        b, a = pose.get(k, (20, 90))
        coude = pt(epaule, b, BRAS)
        main = pt(coude, a, AVBRAS)
        bras[k] = (coude, main)
    # posé sur le sol (le pied le plus bas), ou en l'air de `haut`
    bas = max(max(v[1][1], v[2][1]) for v in jambes.values())
    if pose.get('allonge'):
        bas = max(bas, tete[1] + TETE, cou[1])
    dy = SOL - bas - pose.get('haut', 0)
    if 'hanche' in pose:  # placé à la main (échelle, tyrolienne)
        dy = pose['hanche']
    T = lambda p: (x + p[0], p[1] + dy)
    largeur = 7

    def segs(points, couleur, l=largeur):
        pts = [T(p) for p in points]
        d.line(pts, fill=couleur, width=l, joint='curve')
        for p in pts:
            d.ellipse((p[0] - l / 2, p[1] - l / 2, p[0] + l / 2, p[1] + l / 2), fill=couleur)

    def instrument(main, angle):
        corps = T(main)
        fin = T(pt(main, angle, 62))
        d.line([corps, fin], fill=INSTRUMENT, width=6)
        d.ellipse((corps[0] - 13, corps[1] - 10, corps[0] + 13, corps[1] + 10), fill=INSTRUMENT, outline=(120, 60, 10), width=2)

    # derrière : bras et jambe du fond, puis l'instrument porté dans le dos
    segs([epaule, *bras['bb']], ARRIERE)
    segs([hanche, *jambes['jb']], ARRIERE)
    if pose.get('dos'):
        d.line([T(pt(epaule, 200 - tr, 6)), T(pt(hanche, 160 - tr, -18))], fill=INSTRUMENT, width=8)
    segs([hanche, cou], CORPS, 11)
    t = T(tete)
    d.ellipse((t[0] - TETE, t[1] - TETE, t[0] + TETE, t[1] + TETE), fill=CORPS)
    # le regard : un œil vers l'avant
    oeil = T(pt(tete, 90 + pose.get('regard', 0) - tr, TETE * 0.55))
    d.ellipse((oeil[0] - 2.5, oeil[1] - 2.5, oeil[0] + 2.5, oeil[1] + 2.5), fill=(255, 255, 255))
    segs([hanche, *jambes['ja']], AVANT)
    if pose.get('instrument') is not None:
        instrument(bras['bb'][1], pose['instrument'])
    segs([epaule, *bras['ba']], AVANT)
    if 'objet' in pose:
        o = T(bras['ba'][1])
        ox, oy = o[0] + pose['objet'][0], o[1] + pose['objet'][1]
        d.ellipse((ox - 8, oy - 8, ox + 8, oy + 8), fill=(250, 210, 60), outline=(120, 90, 0), width=2)


def de_dos(d, x, pose):
    """Un mannequin vu de dos, sur une échelle : mains (gauche, droite) et pieds (gauche, droite), hauteurs relatives."""
    cx, haut = x, pose['y']
    for bx in (-26, 26):
        d.line([(cx + bx, 20), (cx + bx, SOL)], fill=(150, 100, 50), width=5)
    for y in range(30, SOL, 26):
        d.line([(cx - 26, y), (cx + 26, y)], fill=(150, 100, 50), width=4)
    epG, epD, hG, hD = (cx - 16, haut), (cx + 16, haut), (cx - 9, haut + 52), (cx + 9, haut + 52)
    mg, md = pose['mains']
    pg, pdr = pose['pieds']
    d.line([(cx, haut - 4), (cx, haut + 52)], fill=CORPS, width=22)
    d.line([(cx - 16, haut + 6), (cx + 12, haut + 46)], fill=INSTRUMENT, width=8)  # l'instrument en bandoulière, dans le dos
    d.ellipse((cx - 13, haut - 30, cx + 13, haut - 4), fill=CORPS)
    for ep, m, cote in ((epG, mg, -1), (epD, md, 1)):
        main = (cx + cote * 26, haut - 20 - m)
        coude = (ep[0] + cote * 12, (ep[1] + main[1]) / 2 + 6)
        d.line([ep, coude, main], fill=AVANT if cote > 0 else ARRIERE, width=7, joint='curve')
    for h, p, cote in ((hG, pg, -1), (hD, pdr, 1)):
        pied = (cx + cote * 22, haut + 52 + 70 - p)
        genou = (h[0] + cote * 14, (h[1] + pied[1]) / 2 - p * 0.3)
        d.line([h, genou, pied], fill=AVANT if cote > 0 else ARRIERE, width=7, joint='curve')


TENU = dict(ba=(35, 115), bb=(-5, 75), instrument=110)  # l'instrument en main, manche vers l'avant
DROIT = dict(ja=(4, 0), jb=(-4, 0))

ANIMATIONS = [
    ('1. Repos', 'debout, à l\'arrêt : il respire\n(la poitrine monte, les genoux\nplient à peine), boucle', [
        {**TENU, **DROIT},
        {**TENU, 'ja': (10, -6), 'jb': (2, -10), 'tronc': 2},
        {**TENU, **DROIT, 'tronc': 3, 'regard': 8},
        {**TENU, 'ja': (10, -6), 'jb': (2, -10), 'tronc': 2},
    ]),
    ('2. Course', 'cycle de course, instrument\nen main : contact, passage,\ncontact (autre jambe), passage', [
        {**TENU, 'tronc': 10, 'ja': (32, 12), 'jb': (-30, -75)},
        {**TENU, 'tronc': 8, 'ja': (0, -2), 'jb': (28, -55), 'haut': 5},
        {**TENU, 'tronc': 10, 'ja': (-30, -75), 'jb': (32, 12)},
        {**TENU, 'tronc': 8, 'ja': (28, -55), 'jb': (0, -2), 'haut': 5},
    ]),
    ('3. Saut', 'impulsion (accroupi), montée\n(jambes tendues), sommet\n(genoux repliés), descente', [
        {**TENU, 'tronc': 22, 'ja': (65, -25), 'jb': (55, -35)},
        {**TENU, 'tronc': 5, 'ja': (12, -5), 'jb': (-15, -30), 'haut': 45},
        {**TENU, 'tronc': 10, 'ja': (80, -15), 'jb': (65, -40), 'haut': 70},
        {**TENU, 'tronc': 4, 'ja': (25, 8), 'jb': (-5, -20), 'haut': 35},
    ]),
    ('4. Échelle (de dos)', 'vu de dos, instrument dans\nle dos : mains et pieds\nalternent, barreau après barreau', [
        {'y': 70, 'mains': (30, 0), 'pieds': (0, 26)},
        {'y': 64, 'mains': (14, 14), 'pieds': (13, 13)},
        {'y': 70, 'mains': (0, 30), 'pieds': (26, 0)},
        {'y': 64, 'mains': (14, 14), 'pieds': (13, 13)},
    ]),
    ('5. Mur', 'accroché à une paroi (à droite),\ninstrument dans le dos :\nil grimpe / glisse le long du mur', [
        {'dos': True, 'tronc': 12, 'ba': (150, 160), 'bb': (110, 140), 'ja': (70, -10), 'jb': (10, 20), 'haut': 30, 'mur': 1},
        {'dos': True, 'tronc': 12, 'ba': (120, 140), 'bb': (150, 165), 'ja': (20, 25), 'jb': (75, -5), 'haut': 38, 'mur': 1},
        {'dos': True, 'tronc': 12, 'ba': (150, 160), 'bb': (110, 140), 'ja': (70, -10), 'jb': (10, 20), 'haut': 46, 'mur': 1},
        {'dos': True, 'tronc': 12, 'ba': (120, 140), 'bb': (150, 165), 'ja': (20, 25), 'jb': (75, -5), 'haut': 54, 'mur': 1},
    ]),
    ('6. Tyrolienne', 'suspendu au câble par les deux\nmains, instrument dans le dos,\njambes qui se balancent', [
        {'dos': True, 'ba': (170, 175), 'bb': (178, 180), 'ja': (10, 0), 'jb': (-5, -10), 'hanche': 108, 'cable': 1},
        {'dos': True, 'ba': (170, 175), 'bb': (178, 180), 'ja': (35, 25), 'jb': (22, 10), 'hanche': 108, 'cable': 1},
        {'dos': True, 'ba': (170, 175), 'bb': (178, 180), 'ja': (10, 0), 'jb': (-5, -10), 'hanche': 108, 'cable': 1},
        {'dos': True, 'ba': (170, 175), 'bb': (178, 180), 'ja': (-20, -30), 'jb': (-32, -40), 'hanche': 108, 'cable': 1},
    ]),
    ('7. Tir', 'il joue (son arme de base) :\nla main qui gratte / frappe\nmonte, descend, recul, retour', [
        {**TENU, **DROIT, 'bb': (-30, 30), 'tronc': 0},
        {**TENU, **DROIT, 'bb': (10, 110), 'tronc': 6},
        {**TENU, 'ja': (8, 0), 'jb': (-14, -6), 'bb': (5, 90), 'tronc': -6},
        {**TENU, **DROIT},
    ]),
    ('8. Visée', 'debout, l\'instrument pointé :\nen haut, en diagonale haute,\nen diagonale basse, en bas', [
        {**DROIT, 'instrument': 175, 'bb': (-5, 60), 'ba': (90, 170)},
        {**DROIT, 'instrument': 140, 'bb': (-5, 70), 'ba': (60, 140)},
        {**DROIT, 'instrument': 60, 'bb': (-10, 80), 'ba': (30, 60)},
        {**DROIT, 'instrument': 15, 'bb': (-5, 70), 'ba': (10, 20), 'tronc': 10},
    ]),
    ('9. Touché / mort', 'touché (recul), il décolle,\nil tombe, à terre (couché\nsur le dos)', [
        {**TENU, 'tronc': -20, 'ja': (12, 0), 'jb': (-10, 0), 'regard': -20},
        {'tronc': -45, 'ba': (-60, -20), 'bb': (-90, -40), 'ja': (40, 10), 'jb': (20, -10), 'haut': 30, 'instrument': 160},
        {'tronc': -75, 'ba': (-120, -90), 'bb': (-140, -110), 'ja': (70, 40), 'jb': (55, 20), 'haut': 15, 'instrument': 200},
        {'tronc': -90, 'ba': (-150, -170), 'bb': (-30, -60), 'ja': (85, 95), 'jb': (95, 85), 'allonge': True},
    ]),
    ('10. Spécial', 'son coup spécial : armer, lancer\n(ou déclencher), accompagner,\nrevenir en garde', [
        {**DROIT, 'dos': True, 'tronc': -10, 'ba': (-120, -170), 'bb': (30, 80), 'ja': (25, 5), 'jb': (-20, 0), 'objet': (0, -6)},
        {**DROIT, 'dos': True, 'tronc': 10, 'ba': (150, 140), 'bb': (-30, 0), 'ja': (25, 5), 'jb': (-20, 0), 'objet': (14, -8)},
        {**DROIT, 'dos': True, 'tronc': 22, 'ba': (90, 70), 'bb': (-40, -10), 'ja': (35, 15), 'jb': (-30, -20), 'objet': (38, -26)},
        {**TENU, **DROIT},
    ]),
]


def case(d, x0, y0, contenu):
    d.rectangle((x0, y0, x0 + CASE_L, y0 + CASE_H), fill=MAGENTA, outline=GRILLE, width=2)


def main():
    lignes = len(ANIMATIONS) + 1
    W, H = MARGE_G + 4 * CASE_L + 20, ENTETE + lignes * CASE_H + 20
    im = Image.new('RGB', (W, H), (245, 242, 235))
    d = ImageDraw.Draw(im)
    f, fg, fp = ImageFont.truetype(POLICE, 17), ImageFont.truetype(POLICE_GRASSE, 22), ImageFont.truetype(POLICE, 15)
    d.text((20, 18), 'DKK : Rock Never Dies : gabarit d\'un personnage jouable', font=ImageFont.truetype(POLICE_GRASSE, 30), fill=(20, 20, 20))
    d.text((20, 60), 'Une ligne par animation, 4 images au plus, de gauche à droite (elles bouclent). Le personnage regarde vers la DROITE,\n'
           'même taille dans toutes les images, pieds sur la ligne de sol, fond magenta uni #FF00FF. Mannequin : bleu foncé = membres\n'
           'du côté du spectateur, bleu clair = ceux de derrière, orange = l\'instrument (ou l\'arme tenue).', font=fp, fill=(40, 40, 40))
    for i, (nom, texte, poses) in enumerate(ANIMATIONS):
        y0 = ENTETE + i * CASE_H
        d.text((20, y0 + 20), nom, font=fg, fill=(20, 20, 20))
        d.multiline_text((20, y0 + 56), texte, font=f, fill=(60, 60, 60), spacing=4)
        for j, pose in enumerate(poses):
            x0 = MARGE_G + j * CASE_L
            sous = Image.new('RGB', (CASE_L, CASE_H), MAGENTA)
            ds = ImageDraw.Draw(sous)
            if 'mains' not in pose:
                ds.line([(0, SOL + 4), (CASE_L, SOL + 4)], fill=(120, 0, 120), width=2)
            if pose.get('mur'):
                ds.rectangle((CASE_L - 40, 0, CASE_L, CASE_H), fill=(110, 90, 80))
            if pose.get('cable'):
                ds.line([(0, 18), (CASE_L, 34)], fill=(30, 30, 30), width=3)
            if 'mains' in pose:
                de_dos(ds, CASE_L // 2, pose)
            else:
                mannequin(ds, CASE_L // 2 + (22 if pose.get('mur') else 0), pose)
            ds.text((6, 4), str(j + 1), font=fp, fill=(90, 0, 90))
            im.paste(sous, (x0, y0))
            d.rectangle((x0, y0, x0 + CASE_L, y0 + CASE_H), outline=GRILLE, width=2)
    # les images à part : le portrait et la présentation
    y0 = ENTETE + len(ANIMATIONS) * CASE_H
    d.text((20, y0 + 20), '11. Images à part', font=fg, fill=(20, 20, 20))
    d.multiline_text((20, y0 + 56), 'portrait (tête et épaules, de\nface, pour les dialogues) ;\npose de présentation (en pied,\nde face ou 3/4, pour l\'intro)', font=f, fill=(60, 60, 60), spacing=4)
    for j, titre in enumerate(['Portrait', 'Présentation']):
        x0 = MARGE_G + j * CASE_L
        d.rectangle((x0, y0, x0 + CASE_L, y0 + CASE_H), fill=MAGENTA, outline=GRILLE, width=2)
        cx = x0 + CASE_L // 2
        if j == 0:
            d.ellipse((cx - 40, y0 + 40, cx + 40, y0 + 130), fill=CORPS)
            d.pieslice((cx - 85, y0 + 130, cx + 85, y0 + 300), 180, 360, fill=CORPS)
        else:
            d.ellipse((cx - 14, y0 + 28, cx + 14, y0 + 56), fill=CORPS)
            d.line([(cx, y0 + 56), (cx, y0 + 120)], fill=CORPS, width=22)
            for s in (-1, 1):
                d.line([(cx + s * 12, y0 + 64), (cx + s * 26, y0 + 112)], fill=AVANT, width=7)
                d.line([(cx + s * 7, y0 + 120), (cx + s * 12, y0 + SOL)], fill=AVANT, width=8)
            d.line([(cx - 34, y0 + 118), (cx + 38, y0 + 62)], fill=INSTRUMENT, width=6)
            d.ellipse((cx - 44, y0 + 104, cx - 16, y0 + 128), fill=INSTRUMENT)
        d.text((x0 + 6, y0 + 4), titre, font=fp, fill=(90, 0, 90))
    im.save(SORTIE, optimize=True)
    print(SORTIE, im.size)


if __name__ == '__main__':
    main()
