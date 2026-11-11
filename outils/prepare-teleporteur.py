#!/usr/bin/env python3
"""Le téléporteur (la porte vers les caves) : les trois images fournies (fond magenta) → une planche du jeu.

Usage : python3 outils/prepare-teleporteur.py        (Pillow, numpy et scipy requis)

Entrées : assets-sources/decor/attractions/ : teleporteur-ferme.jpg (éteint, « sealed unit »), teleporteur-actif.jpg (le
          tourbillon), teleporteur-vide.jpg (le cadre seul, le rond du milieu vide).
Sortie : public/sprites/teleporteur.png, trois images l'une sous l'autre, toutes de la même taille : 0 le téléporteur éteint ;
         1 le cadre, le rond transparent ; 2 le tourbillon, seul, à sa place dans le rond (le jeu le fait tourner derrière le
         cadre). Les tailles et le centre du rond s'affichent : à reporter dans src/rendu/feuilles-attractions.ts.

Les images ont un grain de 3 pixels (469 × 256 pixels « natifs ») : réduites sur ce grain, au même décalage pour les trois.
"""
import importlib.util
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

RACINE = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('prepare_casse', RACINE / 'outils' / 'prepare-casse.py')
pc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pc)
SRC = RACINE / 'assets-sources' / 'decor' / 'attractions'
G = 3


def lit(nom):
    return np.array(Image.open(SRC / f'teleporteur-{nom}.jpg').convert('RGB')).astype(float)


def decalage(a):
    """Le décalage de grille où les cases de `a` sont les plus unies."""
    meilleur = None
    for oy in range(G):
        for ox in range(G):
            ys = oy + G // 2 + np.arange((a.shape[0] - oy) // G) * G
            xs = ox + G // 2 + np.arange((a.shape[1] - ox) // G) * G
            ys, xs = ys[ys + 1 < a.shape[0]], xs[xs + 1 < a.shape[1]]
            p = np.stack([a[ys + dy][:, xs + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1)])
            e = p.std(0).mean()
            if meilleur is None or e < meilleur[0]:
                meilleur = (e, oy, ox)
    return meilleur[1:]


def natif(a, oy, ox):
    ys = oy + G // 2 + np.arange((a.shape[0] - oy) // G) * G
    xs = ox + G // 2 + np.arange((a.shape[1] - ox) // G) * G
    ys, xs = ys[ys + 1 < a.shape[0]], xs[xs + 1 < a.shape[1]]
    p = np.stack([a[ys + dy][:, xs + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1)])
    return np.median(p, 0)


def main():
    ferme, actif, vide = lit('ferme'), lit('actif'), lit('vide')
    oy, ox = decalage(ferme)
    f, a, v = (natif(x, oy, ox) for x in (ferme, actif, vide))
    im_f, im_v = pc.detoure(f), pc.detoure(v)
    # le rond : la partie transparente du cadre qui ne touche pas le bord de l'image
    trans = im_v[..., 3] == 0
    et, n = ndimage.label(trans)
    dehors = set(np.unique(np.concatenate([et[0], et[-1], et[:, 0], et[:, -1]]))) - {0}
    rond = trans & ~np.isin(et, list(dehors))
    # le tourbillon : le rond du tourbillon, élargi de 2 pixels (il tourne caché sous le cadre)
    large = ndimage.binary_dilation(rond, iterations=2)
    ys, xs = np.nonzero(rond)
    cy, cx = ys.mean(), xs.mean()
    disque = ((np.arange(rond.shape[0])[:, None] - cy) ** 2 + (np.arange(rond.shape[1])[None] - cx) ** 2) <= (
        np.sqrt(rond.sum() / np.pi) + 2
    ) ** 2
    large &= disque
    im_a = np.zeros_like(im_f)
    im_a[..., :3] = np.clip(a, 0, 255)
    im_a[..., 3] = np.where(large, 255, 0)
    images = [Image.fromarray(x) for x in (im_f, im_v, im_a)]
    x0, y0, x1, y1 = images[0].getbbox()
    # les câbles qui pendent sous la base sont rognés : la dernière ligne large pose sur le sol
    largeur = np.array(images[0].crop((x0, y0, x1, y1)))[..., 3].astype(bool).sum(1)
    h = int(np.nonzero(largeur > 0.75 * largeur.max())[0].max()) + 1
    w = x1 - x0
    planche = Image.new('RGBA', (w, h * 3), (0, 0, 0, 0))
    for i, im in enumerate(images):
        planche.alpha_composite(im.crop((x0, y0, x1, y0 + h)), (0, i * h))
    q = planche.quantize(96, method=Image.FASTOCTREE, dither=Image.NONE)
    sortie = pc.SPRITES / 'teleporteur.png'
    q.save(sortie, optimize=True)
    print(f'teleporteur.png : {w} x {h} par image, 3 images, {sortie.stat().st_size // 1024} Ko')
    print(f'  centre du rond ({cx - x0:.1f}, {cy - y0:.1f}), sol à {h}, rayon {np.sqrt(rond.sum() / np.pi):.1f}')


if __name__ == '__main__':
    main()
