"""Les plans des niveaux : une suite de lieux, chacun avec son intérêt (une forteresse à explorer, un barrage à escalader, un
gouffre à franchir...), reliés par de très courts raccords. Pas de longue ligne droite : quand une rue plate dure, le niveau
est raté. Les chiffres (`digit`) déclenchent les dialogues de src/niveaux/textes/ quand le héros passe leur colonne.

Un lieu : (genre, largeur, options) ; les genres sont les méthodes `p_<genre>` de Recette (outils/genere-niveaux.py).
"""
import random

FIN = ('arene',)


def enchaine(lieux, graine, lettres):
    """Intercale entre deux lieux un raccord de 4 à 6 tuiles (jamais après une plate-forme déjà courte ni après l'arène)."""
    rng = random.Random(graine)
    plan = []
    for genre, largeur, options in lieux:
        options = dict(options)
        apres = options.pop('apres', None)  # largeur imposée du raccord (la tyrolienne d'une tour y atterrit)
        plan.append((genre, largeur, options))
        if genre not in ('plat', 'vide') + FIN:
            largeur_raccord = rng.randrange(4, 7)
            plan.append(('raccord', apres or largeur_raccord, dict(lettres=lettres)))
    if plan and plan[-1][0] == 'raccord':
        plan.pop()
    return plan


NIVEAUX = {
    'garage': dict(
        nom='Le Garage', theme='garage', textes='01-garage.ts', fichier='01-garage.ts', constante='CARTE_GARAGE',
        graine=11, base=30, raccord='a', caves='a',
        lieux=[
            ('plat', 14, dict(lettres='a', deco=2)),
            ('plat', 10, dict(lettres='a', digit='2')),  # les fêtards autotunés
            ('colline', 18, dict(haut=3)),
            ('mur', 16, dict(haut=5, digit='3')),  # sauter contre le mur
            ('plat', 10, dict(digit='4', cage=True)),  # la cage
            ('plat', 10, dict(digit='5', deco=0, caissons=True)),  # les caissons de basses
            ('tour', 18, dict(etages=2, tyro=9, apres=13, digit='6')),  # la tyrolienne
            ('forteresse', 34, dict(etages=3, lettres='ac')),
            ('gouffre', 20, dict(lettres='ac', nb=4)),
            ('echafaudage', 22, dict(niveaux=2, lettres='ac')),
            ('traversee', 36, dict(lettres='ac')),
            ('barrage', 20, dict(haut=12, lettres='ac', butin='*')),
            ('forteresse', 34, dict(etages=4, lettres='ac', cage=True)),
            ('mur', 16, dict(haut=6, lettres='ac')),
            ('traversee', 36, dict(lettres='ac')),
            ('gouffre', 20, dict(lettres='ac', nb=5)),
            ('barrage', 20, dict(haut=16, lettres='ac', tyro=11, butin='+')),
            ('arene', 40, dict(lettres='ac')),
        ],
    ),
    'alpages': dict(
        nom='Les Alpages Lounge', theme='alpages', textes='02-alpages.ts', fichier='02-alpages.ts',
        constante='CARTE_ALPAGES', graine=22, base=34, raccord='ad', caves='ad',
        lieux=[
            ('plat', 12, dict(lettres='a', deco=3)),  # la radio : « Radio Sommet »
            ('colline', 18, dict(haut=3, lettres='ac')),
            ('plat', 10, dict(lettres='a', digit='3', drones=1)),  # les vaches
            ('forteresse', 34, dict(etages=3, lettres='ad')),
            ('barrage', 20, dict(haut=12, lettres='ad', butin='*')),
            ('gouffre', 20, dict(lettres='ad', nb=4)),
            ('maison', 14, dict(lettres='ac')),
            ('traversee', 36, dict(lettres='ad')),
            ('tour', 22, dict(etages=3, lettres='adf', digit='2')),  # le chalet du DJ, là-haut
            ('mur', 18, dict(haut=6, lettres='ad')),
            ('forteresse', 34, dict(etages=4, lettres='adf', cage=True)),
            ('cheminee', 24, dict(haut=11, lettres='ad')),
            ('traversee', 36, dict(lettres='adf')),
            ('plat', 10, dict(lettres='adf', digit='4', drones=2)),  # le yodel
            ('gouffre', 20, dict(lettres='adf', nb=5)),
            ('barrage', 20, dict(haut=16, lettres='adf', tyro=11, butin='+')),
            ('arene', 44, dict(lettres='adf')),
        ],
    ),
    'cimes': dict(
        nom='Les Cimes Minimales', theme='cimes', textes='03-cimes.ts', fichier='03-cimes.ts',
        constante='CARTE_CIMES', graine=33, base=34, raccord='y', caves='y',
        lieux=[
            ('plat', 12, dict(lettres='y', deco=2)),
            ('colline', 18, dict(haut=3, lettres='y')),
            ('plat', 10, dict(lettres='y', digit='2')),  # la glace et la neige qui tombe
            ('forteresse', 34, dict(etages=3, lettres='y', mat='R')),
            ('gouffre', 20, dict(lettres='y', nb=4)),
            ('barrage', 20, dict(haut=12, lettres='y', butin='*')),
            ('traversee', 36, dict(lettres='ya')),
            ('mur', 18, dict(haut=6, lettres='y')),
            ('echafaudage', 22, dict(niveaux=2, lettres='y')),
            ('forteresse', 34, dict(etages=4, lettres='ya', mat='R', cage=True)),
            ('traversee', 36, dict(lettres='ya')),
            ('barrage', 20, dict(haut=16, lettres='ya', tyro=11, butin='+')),
            ('plat', 10, dict(lettres='yy', digit='3')),  # flash spécial : Detroit
            ('gouffre', 20, dict(lettres='ya', nb=5)),
            ('vide', 64, dict()),  # l'arène du Yéti Alpha, peinte après coup
        ],
    ),
    'plage': dict(
        nom='La Plage du Tube de l’Été', theme='plage', textes='04-plage.ts', fichier='04-plage.ts',
        constante='CARTE_PLAGE', graine=44, base=30, raccord='acd', caves='acd',
        lieux=[
            ('plat', 12, dict(lettres='c', deco=3)),
            ('plat', 10, dict(lettres='ac', digit='1')),  # les danseurs du tube de l'été
            ('colline', 18, dict(haut=3, lettres='cc')),
            ('plat', 10, dict(lettres='ac', digit='2')),  # le sable qui s'effondre
            ('maison', 14, dict(lettres='ac')),
            ('forteresse', 34, dict(etages=3, lettres='acd', mat='W')),
            ('traversee', 36, dict(lettres='cd')),
            ('echafaudage', 22, dict(niveaux=2, lettres='cd')),
            ('gouffre', 20, dict(lettres='cd', nb=4)),
            ('barrage', 20, dict(haut=12, lettres='cd', butin='*')),
            ('forteresse', 34, dict(etages=4, lettres='acdf', mat='W', cage=True)),
            ('mur', 18, dict(haut=6, lettres='cdf')),
            ('traversee', 36, dict(lettres='cdf')),
            ('plat', 10, dict(lettres='acdf', digit='3')),  # reggae, cumbia, raï...
            ('tour', 20, dict(etages=3, lettres='acdf')),
            ('barrage', 20, dict(haut=16, lettres='cdf', tyro=11, butin='+')),
            ('gouffre', 20, dict(lettres='cdb', nb=5)),
            ('arene', 44, dict(lettres='acdbf')),
        ],
    ),
    'ville': dict(
        nom='La Ville Autotunée', theme='ville', textes='05-ville.ts', fichier='05-ville.ts',
        constante='CARTE_VILLE', graine=55, base=30, raccord='acr', caves='acr',
        lieux=[
            ('plat', 12, dict(lettres='a', deco=3)),
            ('plat', 10, dict(lettres='ar', digit='1')),  # les robots vocodeurs
            ('tour', 20, dict(etages=3, lettres='acr', mat='D', vitre=True, tyro=10, apres=14, digit='2')),  # la tyrolienne entre les toits
            ('forteresse', 34, dict(etages=3, lettres='acr', mat='D')),
            ('gouffre', 20, dict(lettres='acr', nb=4)),
            ('traversee', 36, dict(lettres='adr')),
            ('plat', 10, dict(lettres='acdr', digit='3')),  # le vocodeur
            ('barrage', 20, dict(haut=12, lettres='adr', butin='*')),
            ('forteresse', 34, dict(etages=4, lettres='acdr', mat='D', cage=True)),
            ('echafaudage', 22, dict(niveaux=3, lettres='adr')),
            ('mur', 18, dict(haut=7, lettres='adr')),
            ('traversee', 36, dict(lettres='adrf')),
            ('plat', 10, dict(lettres='arrb', digit='4', drones=2)),  # la tour du Club Infini
            ('tour', 24, dict(etages=4, lettres='acdr', mat='D', vitre=True)),
            ('gouffre', 20, dict(lettres='arrf', nb=5)),
            ('barrage', 20, dict(haut=16, lettres='acdr', tyro=11, butin='+')),
            ('arene', 48, dict(lettres='acdrf')),
        ],
    ),
}
