import sys
sys.path.insert(0, 'outils')
import math
from PIL import Image
import numpy as np
from squelette import Personnage
from gabarits import GABARIT_COSTAUD

nom = sys.argv[1]
nat = Image.fromarray(np.array(Image.open(f'assets-sources/heros/{nom}-base.png').convert('RGBA'))[4::8, 4::8])
p = Personnage(nat, GABARIT_COSTAUD)
poses = [{}, {'cuisse_arriere': -25, 'cuisse_avant': 13, 'tibia_arriere': 0},
         {'cuisse_arriere': -50, 'tibia_arriere': 40, 'cuisse_avant': 25, 'bras_avant': 20, 'bras_arriere': -20},
         {'cuisse_arriere': -10, 'tibia_arriere': 30, 'cuisse_avant': 0}]
W = Image.new('RGBA', (128 * len(poses), 128), (60, 70, 90, 255))
for i, a in enumerate(poses):
    W.alpha_composite(p.pose(a), (128 * i, 0))
W.resize((W.width * 3, W.height * 3), Image.NEAREST).save(f'/tmp/claude-0/-home-user/a293ac0e-a356-5859-91e9-2f7c361d6d51/scratchpad/heros/essai_{nom}.png')
