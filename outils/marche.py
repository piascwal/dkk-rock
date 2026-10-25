"""Une marche tirée d'une pose de face : seules les jambes bougent (décalées, l'une levée un peu), le haut du corps reste fixe."""
import numpy as np


def _colle(dest, part, x, y):
    h, w = part.shape[:2]
    zone = dest[y : y + h, x : x + w]
    dest[y : y + h, x : x + w] = np.where((part[..., 3] > 0)[..., None], part, zone)


def marche_jambes(nat, haut=100, coupe=66, pas=3):
    """Quatre images de la marche (pied avant, passage, pied arrière, passage), de la même taille que `nat`.

    `haut` : première ligne des jambes, `coupe` : colonne entre les deux jambes, `pas` : décalage des pieds (pixels natifs).
    """
    corps = nat.copy()
    corps[haut:] = 0
    gauche = nat[haut:, 20:coupe]
    droite = nat[haut:, coupe:100]

    def image(dg, lg, dd, ld):
        # la jambe levée d'abord : celle qui pose le pied se dessine par-dessus
        out = corps.copy()
        for part, x, dx, dy in sorted([(gauche, 20, dg, lg), (droite, coupe, dd, ld)], key=lambda j: -j[3]):
            _colle(out, part, x + dx, haut + dy)
        return out

    return [image(-pas, 0, pas, -1), nat.copy(), image(-pas + 1, -1, pas, 0), nat.copy()]
