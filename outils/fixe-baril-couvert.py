#!/usr/bin/env python3
"""Le baril explosif empilé : quand un autre baril est posé dessus, on ne doit plus voir son dessus (le couvercle en flammes).
On en tire l'image « couvert » de celle de l'artiste : tout ce qui dépasse au-dessus du cerclage de métal est rogné d'un trait
droit, il reste les douelles du devant, que le baril du dessus recouvre. À relancer avant outils/fixe-objets.py si l'image change."""
import pathlib
import numpy as np
from PIL import Image

DECOR = pathlib.Path(__file__).resolve().parent.parent / 'assets-sources' / 'decor'
COUPE = 168  # rangée de l'image de l'artiste (512 × 512) où l'on coupe : juste au-dessus du bord haut du cerclage

a = np.array(Image.open(DECOR / 'baril-explosif-base.png').convert('RGBA'))
a[:COUPE] = 0
Image.fromarray(a).save(DECOR / 'baril-explosif-couvert-base.png')
print('baril-explosif-couvert-base.png')
