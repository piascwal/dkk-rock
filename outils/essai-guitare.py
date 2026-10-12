import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import numpy as np
from PIL import Image, ImageDraw
import squelette
squelette.K = 4
from squelette import Personnage
from gabarit_guitare import MEMBRES, CORPS
a = np.array(Image.open('assets-sources/heros/tom-guitare-base.png').convert('RGBA'))[1::2, 1::2]
nat = Image.fromarray(a)
p = Personnage(nat, MEMBRES, CORPS)
poses = [{}, {'arme': -35}, {'arme': -70, 'cuisse_avant': 20, 'tibia_avant': 30}, {'arme': 40, 'cuisse_arriere': -25, 'tibia_arriere': 40}]
x0, y0, x1, y1 = 120, 120, 380, 390
fr = Image.new('RGBA', ((x1 - x0) * len(poses), y1 - y0), (200, 200, 200, 255))
for i, po in enumerate(poses):
    fr.alpha_composite(p.pose(po).crop((x0, y0, x1, y1)), (i * (x1 - x0), 0))
fr.resize((fr.width * 2, fr.height * 2), Image.NEAREST).save(sys.argv[1])
