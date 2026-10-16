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
            ('forteresse', 32, dict(etages=3, lettres='ac', cage=True)),
            ('gouffre', 18, dict(lettres='ac', nb=4)),
            ('parking', 42, dict(lettres='ac')),  # le parking à étages, propre au garage
            ('echafaudage', 22, dict(niveaux=3, lettres='ac')),
            ('traversee', 36, dict(lettres='ac', mode='pont')),
            ('barrage', 20, dict(haut=12, lettres='ac', butin='*')),
            ('forteresse', 40, dict(etages=4, lettres='ac', cage=True)),
            ('mur', 16, dict(haut=6, lettres='ac')),
            ('traversee', 36, dict(lettres='ac', mode='iles')),
            ('parking', 46, dict(lettres='ac')),
            ('gouffre', 22, dict(lettres='ac', nb=5)),
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
            ('forteresse', 36, dict(etages=3, lettres='ad', cage=True)),
            ('falaise', 26, dict(lettres='ad')),  # la falaise à corniches, propre aux alpages
            ('gouffre', 22, dict(lettres='ad', nb=4)),
            ('maison', 14, dict(lettres='ac')),
            ('traversee', 36, dict(lettres='ad', mode='pont')),
            ('tour', 22, dict(etages=3, lettres='adf', digit='2')),  # le chalet du DJ, là-haut
            ('mur', 18, dict(haut=6, lettres='ad')),
            ('forteresse', 30, dict(etages=4, lettres='adf', cage=True)),
            ('cheminee', 24, dict(haut=11, lettres='ad')),
            ('falaise', 30, dict(lettres='adf')),
            ('plat', 10, dict(lettres='adf', digit='4', drones=2)),  # le yodel
            ('traversee', 36, dict(lettres='adf', mode='iles')),
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
            ('forteresse', 34, dict(etages=3, lettres='y', mat='R', cage=True)),
            ('glacier', 52, dict(lettres='y', nb=3)),  # le glacier, propre aux cimes
            ('gouffre', 20, dict(lettres='y', nb=4)),
            ('barrage', 20, dict(haut=12, lettres='y', butin='*')),
            ('traversee', 36, dict(lettres='ya')),
            ('mur', 18, dict(haut=6, lettres='y')),
            ('echafaudage', 22, dict(niveaux=2, lettres='y')),
            ('forteresse', 30, dict(etages=4, lettres='ya', mat='R', cage=True)),
            ('traversee', 36, dict(lettres='ya', mode='iles')),
            ('glacier', 40, dict(lettres='ya', nb=2)),
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
            ('forteresse', 32, dict(etages=3, lettres='acd', mat='W', cage=True)),
            ('ponton', 42, dict(lettres='cd')),  # le ponton et son phare, propres à la plage
            ('echafaudage', 22, dict(niveaux=2, lettres='cd')),
            ('gouffre', 20, dict(lettres='cd', nb=4)),
            ('barrage', 20, dict(haut=12, lettres='cd', butin='*')),
            ('forteresse', 38, dict(etages=4, lettres='acdf', mat='W', cage=True)),
            ('mur', 18, dict(haut=6, lettres='cdf')),
            ('traversee', 36, dict(lettres='cdf', mode='pont')),
            ('plat', 10, dict(lettres='acdf', digit='3')),  # reggae, cumbia, raï...
            ('tour', 20, dict(etages=3, lettres='acdf')),
            ('ponton', 42, dict(lettres='cdf')),
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
            ('forteresse', 34, dict(etages=3, lettres='acr', mat='D', cage=True)),
            ('toits', 42, dict(lettres='acr')),  # les toits sur pilotis, propres à la ville
            ('gouffre', 20, dict(lettres='acr', nb=4)),
            ('traversee', 36, dict(lettres='adr', mode='pont')),
            ('plat', 10, dict(lettres='acdr', digit='3')),  # le vocodeur
            ('barrage', 20, dict(haut=12, lettres='adr', butin='*')),
            ('forteresse', 38, dict(etages=4, lettres='acdr', mat='D', cage=True)),
            ('echafaudage', 22, dict(niveaux=3, lettres='adr')),
            ('mur', 18, dict(haut=7, lettres='adr')),
            ('toits', 42, dict(lettres='adrf')),
            ('traversee', 36, dict(lettres='adrf')),
            ('plat', 10, dict(lettres='arrb', digit='4', drones=2)),  # la tour du Club Infini
            ('tour', 24, dict(etages=4, lettres='acdr', mat='D', vitre=True)),
            ('gouffre', 20, dict(lettres='arrf', nb=5)),
            ('barrage', 20, dict(haut=16, lettres='acdr', tyro=11, butin='+')),
            ('arene', 48, dict(lettres='acdrf')),
        ],
    ),
    'club': dict(
        nom='Le Club Infini', theme='club', textes='06-club.ts', fichier='06-club.ts',
        constante='CARTE_CLUB', graine=66, base=30, raccord='abc', caves='abc', van=False, interieur=True,
        lieux=[
            ('plat', 14, dict(lettres='ab', deco=3, digit='1')),  # les videurs de l'entrée
            ('forteresse', 34, dict(etages=3, lettres='abc', mat='M', cage=True)),  # le hall et ses mezzanines
            ('scene', 36, dict(lettres='acf')),  # la première scène, ses basses et ses projecteurs
            ('barrage', 20, dict(haut=12, lettres='bcf', butin='*')),
            ('plat', 10, dict(lettres='bc', digit='2')),  # la ligne de basse
            ('tour', 22, dict(etages=4, lettres='abdf', mat='M', vitre=True)),  # les loges
            ('traversee', 36, dict(lettres='cdf')),
            ('gouffre', 20, dict(lettres='cdf', nb=4)),  # la fosse
            ('echafaudage', 22, dict(niveaux=3, lettres='cdf')),  # les structures de la régie
            ('forteresse', 38, dict(etages=4, lettres='abcd', mat='M', cage=True)),  # l'espace VIP
            ('scene', 36, dict(lettres='bcdf')),  # la grande scène
            ('mur', 18, dict(haut=7, lettres='bcd')),
            ('plat', 12, dict(lettres='bcdr', digit='3', drones=1)),  # le DJ, juste derrière
            ('vide', 70, dict()),  # l'arène de DJ Boucle (outils/genere-niveaux.py : arene_du_dj)
        ],
    ),
}
