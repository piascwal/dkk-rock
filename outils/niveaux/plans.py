"""Les plans des niveaux : une suite de lieux, chacun avec son intérêt (une forteresse à explorer, un barrage à escalader, un
gouffre à franchir...), reliés par de très courts raccords. Pas de longue ligne droite : quand une rue plate dure, le niveau
est raté. Les chiffres (`digit`) déclenchent les dialogues de src/niveaux/textes/ quand le héros passe leur colonne.

Un lieu : (genre, largeur, options) ; les genres sont les méthodes `p_<genre>` de Recette (outils/genere-niveaux.py).
"""
import random

FIN = ('arene', 'ferry')


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
    # Saint-Cézaire-sur-Siagne (voir niveaux/stc.py) : on part du Clos ; les dialogues 1 à 6 sont le tutoriel
    'stc': dict(
        nom='Saint-Cézaire', theme='stc', textes='01-stc.ts', fichier='01-stc.ts', constante='CARTE_STC',
        graine=11, base=30, raccord='a', caves='a',
        lieux=[
            ('clos', 34, dict(lettres='a', digit='1')),  # le Clos : la maison, le local de répétition, le pré
            ('plat', 10, dict(lettres='a', digit='2')),  # les fêtards autotunés
            ('restanques', 26, dict(lettres='a')),  # les oliviers en terrasses
            ('remparts', 16, dict(haut=5, digit='3')),  # sauter contre le mur
            ('plat', 10, dict(digit='4', cage=True)),  # la cage
            ('place', 38, dict(lettres='a', digit='5')),  # la place de la fontaine des Mulets, ses caissons, la mairie
            ('tour', 18, dict(etages=2, tyro=9, apres=13, digit='6')),  # la tour du château, et sa tyrolienne
            ('forteresse', 32, dict(etages=3, lettres='ac', cage=True)),  # le château
            ('calade', 34, dict(lettres='ac')),  # une ruelle en escalier sous un passage voûté
            ('gouffre', 18, dict(lettres='ac', nb=4)),
            ('chapelle', 22, dict(lettres='ac')),  # Notre-Dame de Sardaigne
            ('toits', 42, dict(lettres='ac')),  # les toits du village
            ('restanques', 34, dict(lettres='ac', marches=4)),
            ('traversee', 36, dict(lettres='ac', mode='pont')),
            ('grotte', 18, dict(monte=6, lettres='ac', butin='+')),  # la grotte de Saint-Cézaire
            ('forteresse', 40, dict(etages=4, lettres='ac', cage=True)),
            ('calade', 30, dict(lettres='ac', haut=4)),
            ('remparts', 18, dict(haut=6, lettres='ac')),
            ('traversee', 36, dict(lettres='acii', mode='iles')),
            ('gouffre', 22, dict(lettres='ac', nb=5)),
            ('barrage', 20, dict(haut=16, lettres='ac', tyro=11, butin='+')),  # le bord de la falaise, au belvédère
            ('arene', 40, dict(lettres='ac')),
        ],
    ),
    # le pont des Tuves (voir niveaux/tuves.py) : de Saint-Cézaire, on descend à pied jusqu'à la Siagne ; le sol baisse au fil
    # du niveau (il est plus profond que les autres), puis la rivière et les figuiers du Viet Cong glaireux (v)
    'tuves': dict(
        nom='Le Pont des Tuves', theme='tuves', textes='13-tuves.ts', fichier='13-tuves.ts', constante='CARTE_TUVES',
        graine=13, base=30, profondeur=64, raccord='a', caves='a', sans_caves=True, drapeaux=30,
        lieux=[
            ('sentier', 22, dict(lettres='a', digit='1')),  # le départ du sentier, sa balise
            ('lacets', 30, dict(chute=6, lettres='a')),
            ('forteresse', 32, dict(etages=3, lettres='ac', cage=True)),  # un fort, sur le chemin
            ('lacets', 26, dict(chute=6, lettres='ac', digit='2')),
            ('canal', 34, dict(lettres='ac', digit='3')),  # le canal de la Siagne
            ('pont_singe', 18, dict(lettres='ac')),
            ('lacets', 28, dict(chute=6, lettres='ac')),
            ('forteresse', 36, dict(etages=3, lettres='ac', cage=True)),
            ('descente', 24, dict(chute=6, lettres='ac')),  # une tyrolienne jusqu'au fond des gorges
            ('pont_des_tuves', 62, dict(lettres='ac', digit='4')),  # le pont de 1802, la rivière dessous
            ('riviere', 40, dict(lettres='av')),
            ('figuiers', 56, dict(lettres='v', digit='5')),  # le Viet Cong glaireux
            ('gouffre', 18, dict(lettres='v', nb=4)),
            ('figuiers', 60, dict(lettres='vv', digit='6')),
            ('riviere', 30, dict(lettres='v', chute=0)),
            ('arene', 40, dict(lettres='av')),
        ],
    ),
    'alpages': dict(
        nom='Les Alpages Lounge', theme='alpages', textes='02-alpages.ts', fichier='02-alpages.ts',
        constante='CARTE_ALPAGES', graine=22, base=34, raccord='ad', caves='ad',
        lieux=[
            ('plat', 12, dict(lettres='a', deco=3, digit='1')),  # la radio : « Radio Sommet »
            ('colline', 18, dict(haut=3, lettres='ac')),
            ('plat', 10, dict(lettres='a', digit='3', drones=1)),  # les vaches
            ('forteresse', 36, dict(etages=3, lettres='ad', cage=True)),
            ('falaise', 26, dict(lettres='ad')),  # la falaise à corniches, propre aux alpages
            ('pont_singe', 16, dict(lettres='ad')),  # un ravin, et son pont de singe
            ('gouffre', 22, dict(lettres='ad', nb=4)),
            ('maison', 14, dict(lettres='ac')),
            ('traversee', 36, dict(lettres='ad', mode='pont')),
            ('tour', 22, dict(etages=3, lettres='adf', digit='2')),  # le chalet du DJ, là-haut
            ('mur', 18, dict(haut=6, lettres='ad')),
            ('forteresse', 30, dict(etages=4, lettres='adf', cage=True)),
            ('cheminee', 24, dict(haut=11, lettres='ad')),
            ('grotte', 18, dict(monte=8, lettres='adf', butin='*')),  # on monte par l'intérieur de la montagne
            ('pont_singe', 16, dict(lettres='adf')),
            ('descente', 20, dict(chute=8, lettres='adf')),  # et on redescend en tyrolienne vers la vallée
            ('plat', 10, dict(lettres='adf', digit='4', drones=2)),  # le yodel
            ('traversee', 36, dict(lettres='adf', mode='iles')),
            ('barrage', 20, dict(haut=16, lettres='adf', tyro=11, butin='+')),
            ('arene', 44, dict(lettres='adf')),
        ],
    ),
    'cimes': dict(
        nom='Gréau', theme='cimes', textes='03-cimes.ts', fichier='03-cimes.ts',
        constante='CARTE_CIMES', graine=33, base=86, raccord='y', caves='y', altitude=True, sans_caves=True,
        # un niveau en hauteur (voir niveaux/hauteurs.py) : on ne fait que monter, de massif en massif, au-dessus du vide,
        # par des corniches, des grottes et des forteresses, jusqu'à l'arène du Yéti Alpha au sommet ; le van s'envole de là-haut
        lieux=[
            ('plat', 12, dict(lettres='y', deco=2, digit='1')),  # le premier yéti
            ('colline', 16, dict(haut=2, lettres='y')),
            ('corniches', 14, dict(monte=9, lettres='y')),
            ('pont_singe', 16, dict(lettres='y')),
            ('tours', 46, dict(etages=3, mode='pont', lettres='y', mat='R')),  # deux tours reliées par une passerelle
            ('plat', 10, dict(lettres='y', digit='2')),  # la glace et la neige qui tombe
            ('glacier', 44, dict(lettres='y', nb=2)),
            ('pont_singe', 18, dict(lettres='ya', butin='*')),
            ('barrage', 20, dict(haut=12, lettres='y', butin='*')),  # l'à-pic
            ('descente', 22, dict(chute=12, lettres='ya')),  # d'une montagne à l'autre, bien plus bas : le vide se voit
            ('grotte', 18, dict(monte=12, lettres='ya', butin='K')),
            ('tours', 46, dict(etages=3, mode='tyro', lettres='ya', mat='R')),  # une tyrolienne de toit en toit
            ('pont_singe', 16, dict(lettres='ya')),
            ('cheminee', 24, dict(haut=11, lettres='ya')),
            ('corniches', 14, dict(monte=9, lettres='ya')),
            ('plat', 10, dict(lettres='yy', digit='3')),  # flash spécial : Detroit
            ('pont_singe', 16, dict(lettres='ya')),
            ('vide', 64, dict()),  # l'arène du Yéti Alpha, au sommet, peinte après coup
        ],
    ),
    'plage': dict(
        nom='Les Plages Électroniques', theme='plage', textes='04-plage.ts', fichier='04-plage.ts',
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
            ('plat', 10, dict(lettres='acdf', digit='3')),  # le soleil se couche
            ('tour', 20, dict(etages=3, lettres='acdf')),
            ('ponton', 42, dict(lettres='cdf')),
            ('barrage', 20, dict(haut=16, lettres='cdf', tyro=11, butin='+')),
            ('festival', 60, dict(lettres='acdf', digit='4')),  # la nuit : le festival, la foule, la grande scène
            ('gouffre', 20, dict(lettres='cdb', nb=5)),
            ('festival', 48, dict(lettres='acdfb')),
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
    # ---- l'arc breton (docs/ARC-BRETAGNE.md) : les ennemis de la tournée en attendant bigoudens, marins et goélands
    'foret': dict(
        nom='La Forêt des Murmures', theme='foret', textes='07-foret.ts', fichier='07-foret.ts',
        constante='CARTE_FORET', graine=77, base=32, raccord='adh', caves='adh',
        lieux=[
            ('plat', 12, dict(lettres='a', deco=3)),
            ('colline', 18, dict(haut=3, lettres='a', digit='1')),  # la brume, les pierres levées
            ('falaise', 26, dict(lettres='adh')),  # les rochers moussus
            ('pont_singe', 16, dict(lettres='adh')),  # un ravin dans la forêt
            ('plat', 10, dict(lettres='ach', digit='2', drones=1)),  # la fontaine qui rend les guitares neuves
            ('forteresse', 34, dict(etages=3, lettres='adh', mat='R', cage=True)),  # le vieux manoir en ruine
            ('gouffre', 20, dict(lettres='adh', nb=4)),
            ('cheminee', 24, dict(haut=10, lettres='adh')),
            ('traversee', 36, dict(lettres='acdh', mode='iles')),
            ('tour', 22, dict(etages=3, lettres='adfh', mat='R', tyro=10, apres=14, digit='3')),  # la tour de l'enchanteur
            ('barrage', 20, dict(haut=12, lettres='acdh', butin='*')),
            ('grotte', 18, dict(monte=6, lettres='acdfh', butin='+')),  # une grotte sous les racines, qui remonte
            ('descente', 20, dict(chute=6, lettres='acdfh')),
            ('forteresse', 36, dict(etages=4, lettres='acdfh', mat='R', cage=True)),
            ('traversee', 36, dict(lettres='acdfh', mode='pont')),
            ('plat', 10, dict(lettres='acdfh', digit='4', drones=2)),  # le lac et l'épée
            ('barrage', 20, dict(haut=16, lettres='acdfh', tyro=11, butin='+')),
            ('arene', 44, dict(lettres='acdfh')),
        ],
    ),
    'port': dict(
        nom='Le Port de Lorient', theme='port', textes='08-port.ts', fichier='08-port.ts',
        constante='CARTE_PORT', graine=88, base=30, raccord='acdh', caves='acdh',
        lieux=[
            ('plat', 12, dict(lettres='a', deco=3)),
            ('plat', 10, dict(lettres='achm', digit='1')),  # le festival
            ('maison', 14, dict(lettres='achm')),
            ('toits', 42, dict(lettres='acdhm')),  # les toits d'ardoise de la ville close
            ('forteresse', 34, dict(etages=3, lettres='acdhm', mat='B', cage=True)),  # la citadelle
            ('ponton', 42, dict(lettres='cdhm', digit='2')),  # les pontons du port de pêche
            ('echafaudage', 22, dict(niveaux=3, lettres='acdhm')),  # les grues du port
            ('gouffre', 20, dict(lettres='acdhm', nb=4)),
            ('barrage', 20, dict(haut=12, lettres='acdhm', butin='*')),
            ('forteresse', 38, dict(etages=4, lettres='acdfhm', mat='B', cage=True)),
            ('traversee', 36, dict(lettres='acdfhm', mode='pont')),
            ('toits', 42, dict(lettres='acdfhm')),
            ('plat', 10, dict(lettres='acdfhm', digit='3', drones=2)),  # le ferry est à quai
            ('ponton', 42, dict(lettres='cdfhm')),
            ('barrage', 20, dict(haut=16, lettres='acdfhm', tyro=11, butin='+')),
            ('plat', 16, dict(lettres='acdfhm')),  # le quai, et le van : le ferry est un niveau à part (La Traversée)
        ],
    ),
    'groix': dict(
        nom='L’Île de Groix', theme='groix', textes='09-groix.ts', fichier='09-groix.ts',
        constante='CARTE_GROIX', graine=99, base=32, raccord='acdh', caves='acdh',
        lieux=[
            ('plat', 12, dict(lettres='a', deco=3)),
            ('ponton', 42, dict(lettres='cdhm', digit='1')),  # Port-Tudy, l'arrivée du ferry
            ('colline', 18, dict(haut=3, lettres='achm')),
            ('falaise', 28, dict(lettres='acdhm', digit='2')),  # les falaises de la côte sauvage
            ('forteresse', 34, dict(etages=3, lettres='acdhm', mat='R', cage=True)),  # le fort
            ('gouffre', 22, dict(lettres='acdhm', nb=4)),  # le Trou de l'Enfer
            ('traversee', 36, dict(lettres='acdhm', mode='iles')),
            ('tour', 22, dict(etages=3, lettres='acdfhm', mat='R', digit='3')),  # le phare de Pen-Men
            ('barrage', 20, dict(haut=12, lettres='acdhm', butin='*')),
            ('corniches', 14, dict(monte=6, lettres='acdfhm')),  # la côte sauvage : on grimpe la falaise
            ('pont_singe', 18, dict(lettres='acdfhm', butin='*')),  # une faille au-dessus de la mer
            ('descente', 20, dict(chute=6, lettres='acdfhm')),
            ('forteresse', 38, dict(etages=4, lettres='acdfhm', mat='R', cage=True)),
            ('cheminee', 24, dict(haut=11, lettres='acdfhm')),
            ('plat', 10, dict(lettres='acdfhm', digit='4', drones=2)),  # la plage des Grands Sables
            ('traversee', 36, dict(lettres='acdfhm', mode='pont')),
            ('barrage', 20, dict(haut=16, lettres='acdfhm', tyro=11, butin='+')),
            ('arene', 46, dict(lettres='acdfhm')),
        ],
    ),
    # le ferry : un niveau à part entre le port et Groix, rejouable depuis la carte (voir outils/niveaux/ferry.py)
    'ferry': dict(
        nom='La Traversée', theme='mer', textes='10-ferry.ts', fichier='10-ferry.ts',
        constante='CARTE_FERRY', graine=89, base=30, raccord='h', caves='h', van=False, sans_caves=True,
        # le niveau n'est que le navire : les vagues d'ennemis viennent du jeu (src/jeu/traversee.ts), pas de la carte
        lieux=[('ferry', 58, dict())],
    ),
    # le FISE de Montpellier, après Groix : les berges du Lez, de l'Hôtel de Ville à l'Hôtel de Région, une zone du festival
    # après l'autre (voir outils/niveaux/fise.py) ; le décor y est placé à la main, rien au hasard ; pas de caves sous le quai
    'fise': dict(
        nom='Le FISE', theme='fise', textes='11-fise.ts', fichier='11-fise.ts',
        constante='CARTE_FISE', graine=111, base=30, raccord='sot', caves='sot', sans_caves=True,
        lieux=[
            ('plat', 10, dict(lettres='s', deco=0)),
            ('entree', 18, dict(lettres='s', digit='1')),  # l'arche du festival, devant l'Hôtel de Ville
            ('parc_street', 48, dict(lettres='sot')),  # le grand parc noir à plateaux roses
            ('food_court', 44, dict(lettres='fs', digit='2')),  # l'ombre des platanes, les food trucks, les pissotières
            ('halfpipe_bois', 36, dict(haut=5, lettres='sotx', digit='3')),  # le Freestyle Park de bois
            ('spine', 18, dict(haut=3, lettres='so')),
            ('breakdance', 96, dict(lettres='k', digit='4')),  # une seule plateforme : BREAK, le jury, DANCE
            ('flat_bmx', 40, dict(lettres='px', digit='5')),  # le flat BMX, son panneau FLAT
            ('gradins', 26, dict(haut=6, lettres='sotx', cage=True, mat='M')),  # les tribunes du parc
            ('parc_street', 48, dict(lettres='sot')),  # un second grand parc, pour les figures
            ('bigair', 30, dict(lettres='sotxp', digit='6')),  # le big air
            ('village', 56, dict(lettres='fs', digit='7')),  # le village des marques, devant l'Arbre Blanc
            ('halfpipe_bois', 40, dict(haut=6, lettres='sotxp')),
            ('plat', 8, dict(lettres='sotxp', deco=0, digit='8')),  # la finale
            ('vide', 64, dict()),  # la piste du Champion, devant l'Hôtel de Région (outils/genere-niveaux.py : arene_du_champion)
        ],
    ),
    # l'International Tour, après le FISE (voir niveaux/international.py) : une ville par membre du groupe. Dans ces villes,
    # « a » et « c » sont les ennemis du coin (voir entites/ennemis/locaux.ts) ; chacune a en plus son spécial
    'beauvais': dict(
        nom='Beauvais', theme='beauvais', textes='17-beauvais.ts', fichier='17-beauvais.ts', constante='CARTE_BEAUVAIS',
        graine=171, base=36, raccord='ac', caves='ac',
        lieux=[
            ('plat', 12, dict(lettres='a', digit='1')),  # le centre-ville, ses voyageurs perdus
            ('maison', 14, dict(lettres='ac')),
            ('calade', 30, dict(lettres='ac')),  # les rues pavées
            ('toits', 42, dict(lettres='ac')),
            ('cathedrale_beauvais', 40, dict(lettres='ac', digit='2')),  # le chœur le plus haut du monde, sans nef
            ('plat', 10, dict(lettres='ac', digit='3', drones=2)),  # l'horloge astronomique ; les gargouilles s'envolent
            ('corniches', 24, dict(monte=6, lettres='ac')),  # on monte sur les remparts de la cité
            ('remparts', 18, dict(haut=6, lettres='ac', digit='4')),  # la place Jeanne-Hachette
            ('forteresse', 34, dict(etages=3, lettres='ac', mat='{', cage=True)),
            ('descente', 24, dict(chute=6, lettres='ac')),  # on redescend des remparts en tyrolienne
            ('gymnase', 46, dict(lettres='ac')),  # le gymnase de JBT : le mur d'escalade, la corde, la poutre
            ('plat', 12, dict(lettres='ac', plus=2, drones=1)),  # une classe entière
            ('barrage', 20, dict(haut=12, lettres='ac', tyro=11, butin='+')),  # le chantier : l'échafaudage, la tyrolienne
            ('gouffre', 20, dict(lettres='ac', nb=4)),
            ('pont_singe', 22, dict(lettres='ac', butin='+')),
            ('tour', 18, dict(etages=3, tyro=9, apres=13, lettres='ac')),
            ('grotte', 20, dict(monte=6, lettres='acl', butin='+')),
            ('traversee', 36, dict(lettres='ac', mode='pont')),
            ('descente', 24, dict(chute=6, lettres='ac')),
            ('plat', 10, dict(lettres='ac', digit='5', drones=1)),  # le dernier appel
            ('avion', 52, dict(lettres='c')),  # l'avion low-cost sur le tarmac de Beauvais-Tillé
            ('arene', 40, dict(lettres='acz')),
        ],
    ),
    'limerick': dict(
        nom='Limerick', theme='limerick', textes='18-limerick.ts', fichier='18-limerick.ts', constante='CARTE_LIMERICK',
        graine=181, base=30, raccord='ac', caves='ac',
        lieux=[
            ('plat', 12, dict(lettres='c', deco=3)),
            ('pres', 30, dict(lettres='c', digit='1')),  # les prés à murets, leurs moutons
            ('colline', 18, dict(haut=3, lettres='c')),
            ('bastion', 26, dict(haut=8, lettres='acli')),  # une vieille tour de garde en pierre de taille
            ('pres', 26, dict(lettres='cc')),
            ('corniches', 22, dict(monte=6, lettres='ac')),  # on monte au château
            ('chateau_roi_jean', 44, dict(lettres='ac', digit='2')),  # le château du roi Jean
            ('descente', 24, dict(chute=6, lettres='ac')),  # on redescend vers la ville
            ('plat', 8, dict(lettres='ac')),
            ('universite', 40, dict(lettres='ac', digit='3')),  # l'Université de Limerick, le stage de Mat
            ('shannon', 30, dict(lettres='ac')),  # la Shannon, le pont de Thomond
            ('passe_haute', 22, dict(haut=10, lettres='acl')),
            ('pub', 26, dict(lettres='a', digit='4')),  # la session au pub
            ('toits', 42, dict(lettres='ac')),
            ('grotte', 20, dict(monte=6, lettres='ac', butin='+')),
            ('pont_singe', 22, dict(lettres='ac', butin='+')),
            ('descente', 24, dict(chute=6, lettres='ac')),
            ('gouffre', 20, dict(lettres='ac', nb=4)),
            ('puits', 24, dict(lettres='ac')),
            ('plat', 10, dict(lettres='au', digit='5')),  # Thomond Park : les supporters du Munster
            ('gradins', 30, dict(haut=6, lettres='au', cage=True, mat='R')),  # les tribunes du stade
            ('barrage', 20, dict(haut=12, lettres='acu', butin='+')),
            ('arene', 40, dict(lettres='acu')),
        ],
    ),
    'lund': dict(
        nom='Lund', theme='lund', textes='19-lund.ts', fichier='19-lund.ts', constante='CARTE_LUND',
        graine=191, base=36, raccord='ac', caves='ac',
        lieux=[
            ('plat', 12, dict(lettres='a', digit='1')),  # les étudiants en salopette
            ('maisons_rouges', 36, dict(lettres='ac')),
            ('lac_gele', 44, dict(lettres='ac')),  # le lac gelé du parc : la glace glisse, les trous mènent à l'eau
            ('toits', 42, dict(lettres='ac')),
            ('cathedrale_lund', 48, dict(lettres='ac', digit='2')),  # la cathédrale romane, la crypte du géant Finn
            ('plat', 10, dict(lettres='ac', digit='3', plus=1)),  # l'horloge astronomique
            ('corniches', 22, dict(monte=6, lettres='ac')),  # on monte sur la colline de l'université
            ('forteresse', 34, dict(etages=3, lettres='ac', mat='B', cage=True)),  # l'université
            ('descente', 24, dict(chute=6, lettres='ac')),
            ('luge', 44, dict(lettres='ac')),  # la butte de luge : on monte, on dévale sur la glace
            ('maisons_rouges', 36, dict(lettres='ac', digit='4')),  # Kulturen
            ('traversee', 36, dict(lettres='ac', mode='iles')),
            ('grotte', 20, dict(monte=6, lettres='ac', butin='+')),
            ('plat', 12, dict(lettres='cj', digit='5', plus=1)),  # un élan sur la piste cyclable
            ('lac_gele', 36, dict(lettres='cj')),  # les élans sur la glace
            ('descente', 24, dict(chute=6, lettres='acj')),
            ('barrage', 20, dict(haut=12, lettres='acj', tyro=11, butin='+')),
            ('gouffre', 20, dict(lettres='acj', nb=4)),
            ('tour', 18, dict(etages=3, tyro=9, apres=13, lettres='ac', mat='B')),
            ('arene', 40, dict(lettres='acj')),
        ],
    ),
    'newyork': dict(
        nom='New York', theme='newyork', textes='20-new-york.ts', fichier='20-new-york.ts', constante='CARTE_NEW_YORK',
        graine=201, base=40, raccord='ac', caves='ac',
        lieux=[
            ('plat', 12, dict(lettres='c', digit='1')),  # les rats, leur part de pizza
            ('gratte_ciel', 24, dict(lettres='ac', digit='2', etages=4)),  # les escaliers de secours, les châteaux d'eau
            ('toits', 42, dict(lettres='ac')),
            ('gratte_ciel', 26, dict(lettres='ac', etages=5)),
            ('bastion', 26, dict(haut=8, lettres='ac')),  # le socle de granit d'une banque
            ('plat', 10, dict(lettres='aa', digit='3', drones=2)),  # Wall Street ; les pigeons
            ('echafaudage', 22, dict(niveaux=3, lettres='ac')),
            ('corniches', 22, dict(monte=6, lettres='ac')),  # on grimpe aux escaliers de secours...
            ('toits', 36, dict(lettres='ac')),
            ('descente', 24, dict(chute=6, lettres='ac')),  # ... et on redescend en tyrolienne
            ('metro', 44, dict(lettres='c', digit='4')),  # le métro sous la rue
            ('passe_haute', 22, dict(haut=10, lettres='ac')),
            ('gratte_ciel', 28, dict(lettres='ac', etages=5)),
            ('grotte', 20, dict(monte=6, lettres='ac', butin='+')),
            ('pont_singe', 22, dict(lettres='ac', butin='+')),
            ('descente', 24, dict(chute=6, lettres='ac')),
            ('puits', 24, dict(lettres='ac')),
            ('gouffre', 20, dict(lettres='ac', nb=4)),
            ('pont_brooklyn', 56, dict(lettres='ac', digit='5')),  # le pont de Brooklyn
            ('arene', 40, dict(lettres='acn')),
        ],
    ),
    'marseille': dict(
        nom='Marseille', theme='marseille', textes='21-marseille.ts', fichier='21-marseille.ts', constante='CARTE_MARSEILLE',
        graine=211, base=36, raccord='ac', caves='ac',
        lieux=[
            ('plat', 12, dict(lettres='a', deco=3)),
            ('ponton', 42, dict(lettres='ac', digit='1')),  # le Vieux-Port, ses pointus ; les gabians
            ('calade', 34, dict(lettres='ac', digit='2')),  # le Panier
            ('toits', 42, dict(lettres='ac')),
            ('bastion', 26, dict(haut=8, lettres='ac')),  # un bastion du fort Saint-Nicolas
            ('plat', 14, dict(lettres='qq', digit='3')),  # la pétanque
            ('corniches', 22, dict(monte=6, lettres='ac')),  # on monte au fort
            ('forteresse', 34, dict(etages=3, lettres='ac', mat='{', cage=True)),  # le fort Saint-Jean
            ('descente', 24, dict(chute=6, lettres='ac')),
            ('plat', 10, dict(lettres='aa', digit='4', drones=2)),  # les supporters de l'OM ; les gabians
            ('traversee', 36, dict(lettres='ac', mode='pont')),
            ('passe_haute', 22, dict(haut=10, lettres='ac')),
            ('calanques', 36, dict(lettres='ac', digit='5')),  # les calanques
            ('grotte', 20, dict(monte=6, lettres='ac', butin='+')),
            ('pont_singe', 22, dict(lettres='ac', butin='+')),
            ('descente', 24, dict(chute=6, lettres='ac')),
            ('puits', 24, dict(lettres='acq')),
            ('bonne_mere', 44, dict(lettres='acq')),  # Notre-Dame de la Garde
            ('barrage', 20, dict(haut=12, lettres='acq', butin='+')),
            ('arene', 40, dict(lettres='acqg')),
        ],
    ),
    # Marseille refait (le chantier du level design, voir src/niveaux/refontes.ts) : à la manière de Broforce, la ville se gravit.
    # On part au ras de l'eau (le Vieux-Port), on monte au Panier, on redescend au fort, on remonte au fort Saint-Jean, on plonge
    # vers la mer (les Catalans, les calanques) puis on grimpe jusqu'à la Bonne Mère, tout en haut. Des parois et des vides sans
    # fond entre les massifs : casser les murs ne dispense plus de grimper ; des routes hautes et basses (passe haute, grotte,
    # puits) au choix
    'marseille_refonte': dict(
        nom='Marseille', theme='marseille', textes='21-marseille.ts', fichier='../refontes/21-marseille.ts',
        constante='CARTE_MARSEILLE_REFONTE', graine=212, base=58, raccord='ac', caves='ac',
        lieux=[
            ('plat', 12, dict(lettres='a', deco=3)),
            ('ponton', 42, dict(lettres='ac', digit='1')),  # le Vieux-Port, au ras de l'eau ; les gabians
            ('corniches', 22, dict(monte=10, lettres='ac')),  # on monte au Panier
            ('calade', 34, dict(lettres='ac', digit='2')),  # le Panier
            ('toits', 42, dict(lettres='ac')),
            ('descente', 24, dict(chute=8, lettres='ac')),  # on redescend vers le fort, en tyrolienne
            ('bastion', 26, dict(haut=8, lettres='ac')),  # un bastion du fort Saint-Nicolas
            ('plat', 14, dict(lettres='qq', digit='3')),  # la pétanque
            ('gouffre', 20, dict(lettres='ac', nb=4)),
            ('corniches', 22, dict(monte=12, lettres='ac')),  # la paroi du fort Saint-Jean
            ('forteresse', 34, dict(etages=3, lettres='ac', mat='{', cage=True)),  # le fort Saint-Jean
            ('pont_singe', 22, dict(lettres='ac', butin='+')),
            ('descente', 24, dict(chute=10, lettres='ac')),  # on plonge vers la mer
            ('plat', 10, dict(lettres='aa', digit='4', drones=2)),  # les supporters de l'OM aux Catalans ; les gabians
            ('traversee', 36, dict(lettres='ac', mode='iles')),
            ('calanques', 36, dict(lettres='ac', digit='5')),  # les calanques
            ('grotte', 20, dict(monte=8, lettres='ac', butin='+')),  # et la longue montée vers la Bonne Mère
            ('passe_haute', 22, dict(haut=10, lettres='ac')),
            ('corniches', 22, dict(monte=10, lettres='ac')),
            ('puits', 24, dict(lettres='acq')),
            ('corniches', 22, dict(monte=8, lettres='ac')),
            ('bonne_mere', 44, dict(lettres='acq')),  # Notre-Dame de la Garde, tout en haut
            ('barrage', 20, dict(haut=12, lettres='acq', butin='+')),
            ('arene', 40, dict(lettres='acqg')),
        ],
    ),
    # Ottawa (voir niveaux/ottawa.py), entre New York et Lund : les trois mois de Mat au Canada. On y descend (le Glebe, la
    # tyrolienne), on y monte (la colline du Parlement, la tour de la Paix, la grotte, la tour) ; la pierre de taille (niveaux/detours.py)
    # se contourne plutôt que de se casser
    'ottawa': dict(
        nom='Ottawa', theme='ottawa', textes='23-ottawa.ts', fichier='23-ottawa.ts', constante='CARTE_OTTAWA',
        graine=231, base=40, profondeur=36, raccord='ac', caves='ac',
        lieux=[
            ('plat', 12, dict(lettres='cl', deco=3, digit='1')),  # la neige, les castors et un caribou
            ('maison', 14, dict(lettres='ac')),
            ('toits', 42, dict(lettres='acl')),  # les toits du Glebe
            ('corniches', 22, dict(monte=6, lettres='ac')),  # on monte la rue en pente...
            ('glebe', 34, dict(lettres='acii', chute=6, digit='2')),  # ... le Glebe Collegiate : on n'en sort qu'en bas
            ('plat', 10, dict(lettres='ac', drones=2)),  # les bernaches
            ('bastion', 26, dict(haut=8, lettres='ac')),
            ('gouffre', 20, dict(lettres='acii', nb=4)),
            ('patinoire', 64, dict(lettres='a', digit='3')),  # la patinoire sur la rivière gelée
            ('corniches', 22, dict(monte=6, lettres='ac')),  # on monte sur la colline du Parlement
            ('parlement', 46, dict(lettres='acii', digit='4')),  # la tour de la Paix
            ('descente', 24, dict(chute=6, lettres='acl')),
            ('passe_haute', 22, dict(haut=10, lettres='ac')),
            ('plat', 12, dict(lettres='cwl', digit='5', drones=2)),  # le marché By
            ('grotte', 20, dict(monte=6, lettres='ac', butin='+')),
            ('pont_singe', 22, dict(lettres='ac', butin='+')),
            ('puits', 24, dict(lettres='ac')),
            ('descente', 24, dict(chute=6, lettres='ac')),
            ('traversee', 36, dict(lettres='ac', mode='iles')),
            ('lac_gele', 36, dict(lettres='aw')),  # le canal gelé
            ('barrage', 20, dict(haut=12, lettres='acw', butin='+')),
            ('tour', 18, dict(etages=3, tyro=9, apres=13, lettres='ac', mat='B')),
            ('arene', 40, dict(lettres='acwi')),
        ],
    ),
}
