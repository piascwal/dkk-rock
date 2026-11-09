#!/usr/bin/env python3
"""La batterie de l'écran titre (et JBT qui en joue, puis la casse) : les images fournies (fond magenta) → une planche du jeu.

Usage : python3 outils/prepare-batterie.py        (Pillow, numpy et scipy requis)

Entrées : assets-sources/decor/batterie/ : 1 la batterie seule ; 2, 3, 5 JBT en joue ; 4 il s'emballe (image plus large, à une
          autre échelle) ; 7 la grosse caisse fendue ; 6 la grosse caisse crevée, une cymbale à la main ; 8 il soulève la grosse
          caisse ; 9 il arrache le charleston.
Sortie : public/sprites/batterie.png, une image par ligne, dans l'ordre du spectacle : la batterie seule, les trois temps du jeu
         tranquille, l'emballement, puis la casse (fendue, crevée, soulevée, arrachée). Les tailles s'affichent : à reporter dans
         src/rendu/feuilles-objets.ts (« batterie ») et src/ui/titre-batterie.ts (BASE).

Toutes les images sont calées sur la première (la grosse caisse et les pieds ne bougent pas d'une image à l'autre) : l'image large
est mise à l'échelle et décalée pour s'y superposer au mieux. Puis, comme pour les héros : réduites sur leur grain (des blocs de
4 × 4), détourées, les traînées roses des effets retirées, une palette commune réduite.
"""
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / 'assets-sources' / 'decor' / 'batterie'
SPRITES = RACINE / 'public' / 'sprites'
ORDRE = ['1.jpg', '2.jpg', '3.png', '5.png', '4.png', '7.png', '6.png', '8.jpg', '9.jpg']
R = 4  # le grain des images carrées (4,3 pixels) : un bloc de 4 × 4 par pixel
COTE = 1024
CONTOUR = (28, 22, 30)
COULEURS = 160


def fond_de(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 120) & (b > 110) & (g < 140) & ((r + b) / 2 - g > 80)


def masque_reduit(fond, k=4):
    h, w = (fond.shape[0] // k) * k, (fond.shape[1] // k) * k
    return (~fond[:h, :w]).reshape(h // k, k, w // k, k).mean((1, 3))


def correle(a, b):
    """Le décalage (dy, dx) qui superpose au mieux `b` sur `a` (même taille), et son score."""
    fa, fb = np.fft.rfft2(a - a.mean()), np.fft.rfft2(b - b.mean())
    c = np.fft.irfft2(fa * np.conj(fb), a.shape)
    i = np.unravel_index(np.argmax(c), c.shape)
    dy, dx = (v if v < s // 2 else v - s for v, s in zip(i, a.shape))
    return (dy, dx), c[i] / (np.linalg.norm(a - a.mean()) * np.linalg.norm(b - b.mean()) + 1e-9)


def recale(a, ref, echelles):
    """L'image `a` (RGB, n'importe quelle taille) remise dans le repère de la référence (COTE × COTE) : la meilleure échelle et
    le meilleur décalage, cherchés sur les silhouettes réduites au quart."""
    mref = masque_reduit(fond_de(ref))
    meilleur = None
    for e in echelles:
        im = Image.fromarray(a.astype(np.uint8)).resize((round(a.shape[1] * e), round(a.shape[0] * e)), Image.BILINEAR)
        toile = Image.new('RGB', (2048, 2048), (255, 0, 255))
        toile.paste(im, (0, 0))
        m = masque_reduit(fond_de(np.array(toile).astype(float)))[: mref.shape[0] * 2, : mref.shape[1] * 2]
        grand = np.zeros_like(m)
        grand[: mref.shape[0], : mref.shape[1]] = mref
        (dy, dx), score = correle(grand, m)
        if meilleur is None or score > meilleur[0]:
            meilleur = (score, e, dy * 4, dx * 4)
    score, e, dy, dx = meilleur
    print(f'  recalée : échelle {e:.3f}, décalage ({dx}, {dy}), score {score:.3f}')
    im = Image.fromarray(a.astype(np.uint8)).resize((round(a.shape[1] * e), round(a.shape[0] * e)), Image.LANCZOS)
    toile = Image.new('RGB', (COTE, COTE), (255, 0, 255))
    toile.paste(im, (dx, dy))
    return np.array(toile).astype(float)


def reduit(a):
    """Une image (COTE × COTE, RGB) réduite sur son grain et détourée (RGBA)."""
    fond = fond_de(a)
    etiquettes, nb = ndimage.label(~fond)
    tailles = ndimage.sum(np.ones_like(etiquettes), etiquettes, range(1, nb + 1))
    plein = np.isin(etiquettes, 1 + np.nonzero(tailles > 60)[0]).astype(float)
    h, w = (a.shape[0] // R) * R, (a.shape[1] // R) * R
    bloc = lambda x: x[:h, :w].reshape(h // R, R, w // R, R, *x.shape[2:]).mean((1, 3))
    poids = bloc(plein)
    couleur = bloc(a * plein[..., None]) / np.maximum(poids, 1e-6)[..., None]
    im = np.zeros(poids.shape + (4,), np.uint8)
    im[..., :3] = np.clip(couleur, 0, 255)
    im[..., 3] = np.where(poids >= 0.5, 255, 0)
    op = im[..., 3] > 0
    rr, gg, bb = (im[..., i].astype(int) for i in range(3))
    # les traînées roses des effets (des coups de cymbale) : retirées ; le liseré violet du fond, au bord : le contour sombre
    rose = (rr - gg > 45) & (bb - gg > 45)
    im[rose & op] = 0
    op = im[..., 3] > 0
    bord = op & ~ndimage.binary_erosion(op)
    violet = (rr - gg > 20) & (bb - gg > 20)
    im[bord & violet & op, :3] = CONTOUR
    # les miettes (moins de 5 pixels) ; les éclats de la casse, plus gros, restent
    et, n = ndimage.label(op)
    if n > 1:
        t = ndimage.sum(np.ones_like(et), et, range(1, n + 1))
        im[~np.isin(et, 1 + np.nonzero(t >= 5)[0])] = 0
    return Image.fromarray(im)


def main():
    lu = {n: np.array(Image.open(SRC / n).convert('RGB')).astype(float) for n in ORDRE}
    ref = lu['1.jpg']
    images = []
    for n in ORDRE:
        a = lu[n]
        print(n)
        if a.shape[:2] != (COTE, COTE):
            a = recale(a, ref, np.arange(1.20, 1.40, 0.005))
        elif n != '1.jpg':
            (dy, dx), score = correle(masque_reduit(fond_de(ref)), masque_reduit(fond_de(a)))
            print(f'  décalage ({dx * 4}, {dy * 4}), score {score:.3f}')
        images.append(reduit(a))
    # le cadre commun (toutes les images gardent le même repère), et le pied de la batterie seule : le sol
    boites = [im.getbbox() for im in images]
    x0, y0 = min(b[0] for b in boites), min(b[1] for b in boites)
    x1, y1 = max(b[2] for b in boites), max(b[3] for b in boites)
    w, h = x1 - x0, y1 - y0
    planche = Image.new('RGBA', (w, h * len(images)), (0, 0, 0, 0))
    for i, im in enumerate(images):
        planche.alpha_composite(im.crop((x0, y0, x1, y1)), (0, i * h))
    q = planche.quantize(COULEURS, method=Image.FASTOCTREE, dither=Image.NONE)
    q.save(SPRITES / 'batterie.png', optimize=True)
    base = boites[0][3] - y0
    print(f'batterie.png : {w} x {h} par image, {len(images)} images, {(SPRITES / "batterie.png").stat().st_size // 1024} Ko')
    print(f'  pied {w // 2}, la batterie seule touche le sol à {base} (sur {h})')


if __name__ == '__main__':
    main()
