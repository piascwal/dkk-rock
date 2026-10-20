#!/usr/bin/env python3
"""Planches des objets fournis en sprite (van, cage, boss, décor), une image par état, sans animation.

Usage : python3 outils/fixe-objets.py      (Pillow et numpy requis)

Entrées : assets-sources/<objet>-base.png     Sorties : public/sprites/<objet>.png + src/rendu/feuilles-objets.ts (généré)
Le sprite est remis sur sa grille de pixels (prepare_instrument.py), recadré sur sa silhouette et agrandi sans lissage à la
largeur voulue en jeu (6 pixels de planche par pixel du jeu).
"""
import pathlib
import subprocess
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from prepare_instrument import natif_et_case

RACINE = pathlib.Path(__file__).resolve().parent.parent
DENSITE = 6
# les héros dont les images de dos sur l'échelle sont fournies (planches du décor « <héros>-echelle », à la densité des héros : 6)
ECHELLES = ('tom', 'mat', 'jbt', 'jbm', 'jbg')
# et celles du saut (en l'air), une image par héros, de profil
SAUTS = tuple(f'{h}-saut' for h in ECHELLES)
# des planches plus fines que 6 pixels par pixel du jeu, et réduites avec lissage (au lieu d'un agrandissement entier, qui donne des
# pixels inégaux quand l'écran n'est pas un multiple de la planche) : le DJ, très détaillé, plus grand que le reste
DENSITES = {'dj': 8, 'robot': 8, 'borne': 8, 'pneus': 8, 'baril': 8, 'fougere': 8, 'menhir': 8, **{f'{h}-echelle': 6 for h in ECHELLES}, **{n: 6 for n in SAUTS}}
LISSES = {'barriere', 'archeFise', 'portiqueBreak', 'portiqueFlat', 'portiqueDance', 'juryBreak', 'foodDuke', 'foodRougail', 'foodCroque', 'foodGlace', 'pissotiere', 'toilettes', 'platane', 'platane2', 'tablePique', 'tableSkate', 'tableBmx', 'tableFamille', 'dj', 'voiture', 'rocker', 'robot', 'borne', 'pneus', 'baril', 'fougere', 'menhir', *(f'{h}-echelle' for h in ECHELLES), *SAUTS}
# celles de ces planches qu'on réduit à 256 couleurs (le DJ, les voitures) ; les rockers en ont trop : douze personnages différents sur une planche
QUANTIFIEES = {'dj', 'voiture'}
# objet : (fichiers sources, un par état (une ligne de la planche chacun), genre dans jeu/vue.ts, largeur en jeu en pixels)
OBJETS = {
    'van': (['van-base.png'], 'VAN', 56),
    # le van à réacteur, des niveaux qui finissent au sommet (il décolle à la propulsion) : la carrosserie a la taille du van d'origine
    'van-reacteur': (['van-reacteur-base.png'], 'VAN_REACTEUR', 56),
    'cage': (['cage-1-base.png', 'cage-2-base.png'], 'CAGE', 22),  # fermée, puis ouverte
    # le Yéti Alpha : repos, bras levés (deux), touché (trois) ; les poses gardent leur place (cadre commun)
    'yeti-alpha': ([f'boss/yeti-alpha-{k}-base.png' for k in range(1, 7)], 'YETI_ALPHA', 46, True),
    # DJ Boucle derrière ses platines (les images d'origine : 1 à 4, au repos, les deux mains sur les platines ; 5 bras écartés
    # (les lasers) ; 6 penché en avant (l'anneau d'hypnose) ; 7 le poing levé (le Drop) ; cadre commun : le décor derrière lui ne bouge pas)
    'dj': ([f'boss/dj-{k}-base.png' for k in range(1, 8)], 'DJ', 65, True),
    # les enceintes du DJ, de face : membrane au repos, puis de plus en plus gonflée
    'enceinte': ([f'boss/enceinte-{k}-base.png' for k in range(1, 5)], 'ENCEINTE', 22, True),
    # décor sans genre (FEUILLES_DECOR) : enceintes de 3/4, grise puis en bois, posées au fond
    # les vaches du décor (apparences tirées au sort ; même échelle pour toutes : les assises sont plus grandes) et le lampadaire
    'vache': ([f'decor/vache-{k}-base.png' for k in range(1, 7)], None, 19),
    # la végétation du décor : trois buissons (rond, à baies, à mûres), trois sapins (vert, givré, enneigé), même échelle
    'buisson': ([f'decor/buisson-{k}-base.png' for k in range(1, 4)], None, 22),
    'sapin': ([f'decor/sapin-{k}-base.png' for k in range(1, 4)], None, 34),
    'lampadaire': (['decor/lampadaire-base.png'], None, 15),
    # lot 7 : panneaux de bois (jamais retournés : on doit pouvoir lire l'inscription), voitures, bûches, plantes en pot
    # (cactus, pousse, retombante, grosse jardinière), feu de camp et poubelles (verte, kaki)
    'panneau': ([f'decor/panneau-{k}-base.png' for k in (1, 2, 3, 4)], None, 26),
    # la voiture 2 (la Mégane) est vue de trois quarts : le générateur la redresse (voir `redresse`) pour que ses roues touchent le sol
    'voiture': ([f'decor/voiture-{k}-base.png' for k in (1, 2, 3, 4, 5)], None, 59),
    'tronc': ([f'decor/tronc-{k}-base.png' for k in (1, 2)], None, 19),
    'plante': ([f'decor/plante-{k}-base.png' for k in (1, 2, 3, 4)], None, 9),
    'feu': (['decor/feu-1-base.png'], None, 14),
    # lot 8 : flambeaux de bambou (grande flamme, petite flamme, perche longue) et parasols (rouge et bleu, jaune et vert, rayé)
    'torche': ([f'decor/torche-{k}-base.png' for k in (1, 2, 3)], None, 6),
    # le flambeau sur pied des forteresses et des caves
    'flambeau': (['decor/flambeau-base.png'], None, 8),
    # lot 9 : les cinq armes à ramasser (icône du bonus, en jeu et sur le bouton de tir) et le tir qui en sort (genre P_...)
    'arme-minidisc': (['armes/minidisc-base.png'], None, 15),
    'arme-pile': (['armes/pile-base.png'], None, 14),
    'arme-flipper': (['armes/flipper-base.png'], None, 16),
    'arme-frisbee': (['armes/frisbee-base.png'], None, 16),
    'arme-donuts': (['armes/donuts-base.png'], None, 15),
    'arme-boitier': (['armes/boitier-cd-base.png'], None, 20),
    'tir-boitier': (['armes/boitier-cd-base.png'], 'P_BOITIER', 14),
    'tir-pile': (['armes/pile-base.png'], 'P_PILE', 9),
    'tir-flipper': (['armes/flipper-base.png'], 'P_FLIPPER', 14),
    'tir-frisbee': (['armes/frisbee-base.png'], 'P_FRISBEE', 12),
    # lot 10 : trois étagères de livres (une garnie de bibelots et d'un casque audio), pour les pièces intérieures
    'etagere': ([f'decor/etagere-{k}-base.png' for k in (1, 2, 3)], None, 34),
    # lot 11-12 : des tas de rochers (gris, et sous la neige), en sprites fournis
    'rocher': ([f'decor/rocher-{k}-base.png' for k in (1, 2, 3, 4)], None, 30),
    'rocherNeige': ([f'decor/rocher-neige-{k}-base.png' for k in (1, 2, 3, 4)], None, 30),
    # le robot vocodeur des boîtes de nuit (le videur de la ville et du club), en sprite fourni : debout, un seul état
    'robot': (['ennemis/robot-base.png'], 'ROBOT', 26),
    # lot 18 : douze rockers (un par fan converti au rock), debout, que le jeu tire au sort pour remplacer l'ennemi vaincu
    'rocker': ([f'ennemis/rocker-{k}-base.png' for k in range(1, 13)], None, 13),
    'parasol': ([f'decor/parasol-{k}-base.png' for k in (1, 2, 3)], None, 28),
    # le transat de la plage (bois et toile bleue et blanche), en sprite fourni
    'transat': (['decor/transat-base.png'], None, 24),
    # lot 23 : le FISE de Montpellier, posé au sol comme le reste du décor (decor-semis.ts) : les stands (BMX, skate, trottinette,
    # la buvette, les fringues) à la même échelle, et le half-pipe, bien plus grand ; ses gradins de devant sont rognés
    # (halfpipe-rogne-base.png : l'image d'origine coupée sous les pieds de l'échafaudage, pour qu'il pose sur le sol)
    'standBmx': (['decor/fise/stand-bmx-base.png'], None, 56),
    'standSkate': (['decor/fise/stand-skate-base.png'], None, 55),
    'standTrottinette': (['decor/fise/stand-trottinette-base.png'], None, 55),
    'buvette': (['decor/fise/buvette-base.png'], None, 42),
    'standFringues': (['decor/fise/stand-fringues-base.png'], None, 42),
    'halfpipe': (['decor/fise/halfpipe-rogne-base.png'], None, 150),
    # les éléments qui portent les logos officiels du FISE (composés par outils/fise-logos.py) : la barrière Vauban et sa bâche,
    # l'arche d'entrée et sa bannière ; réduits avec lissage pour que le logo reste lisible
    'barriere': (['decor/fise/barriere-base.png'], None, 22),
    'archeFise': (['decor/fise/arche-base.png'], None, 100),
    # la scène de breaking : son portique (l'arche, bannière « BREAK »)
    'portiqueBreak': (['decor/fise/portique-break-base.png'], None, 72),
    'portiqueFlat': (['decor/fise/portique-flat-base.png'], None, 72),
    'portiqueDance': (['decor/fise/portique-dance-base.png'], None, 72),
    # le jury du breakdance : la table et ses trois juges (décor, posé sur la plateforme)
    'juryBreak': (['decor/fise/jury-base.png'], None, 40),
    # un danseur de décor (pas un ennemi) : il danse sur les estrades du breaking et de la danse
    'danseurFise': (['decor/fise/danseur-decor-base.png'], None, 12),
    # deux autres personnages de décor, pour le breakdance et le flat : un b-boy accroupi, une danseuse en casquette
    'bboyAccroupi': (['decor/fise/bboy-accroupi-base.png'], None, 17),
    'danseuseCasquette': (['decor/fise/danseuse-casquette-base.png'], None, 11),
    'danseurVeste': (['decor/fise/danseur-veste-base.png'], None, 12),  # un danseur en veste verte, du décor
    # lot 25-26 : les quatre food trucks du FISE (DUKE, ROUGAIL, CROQUE, GLACE) et les toilettes de chantier (rouge : la pissotière ;
    # grise : les toilettes) ; même largeur en jeu pour les quatre trucks
    'foodDuke': (['decor/fise/food-duke-base.png'], None, 46),
    'foodRougail': (['decor/fise/food-rougail-base.png'], None, 46),
    'foodCroque': (['decor/fise/food-croque-base.png'], None, 46),
    'foodGlace': (['decor/fise/food-glace-base.png'], None, 46),
    'pissotiere': (['decor/fise/pissotiere-base.png'], None, 31),
    'toilettes': (['decor/fise/toilettes-base.png'], None, 31),
    # lot 27 : les platanes du food court, en deux versions (couronne ronde ; branches étalées), alternées le long des berges
    'platane': (['decor/fise/platane-1-base.png'], None, 50),
    'platane2': (['decor/fise/platane-2-base.png'], None, 50),
    # lot 28 : les tables du food court, pieds au ras du sol (ce qui dépasse sous les pieds est rogné ; la roue du BMX aussi)
    'tablePique': (['decor/fise/table-pique-base.png'], None, 40),
    'tableSkate': (['decor/fise/table-skate-base.png'], None, 40),
    'tableBmx': (['decor/fise/table-bmx-base.png'], None, 40),
    'tableFamille': (['decor/fise/table-famille-base.png'], None, 40),
    # l'enceinte basse du club, à LED rose (décor seulement : elle n'explose pas)
    'enceinteRose': (['decor/enceinte-rose-base.png'], None, 20),
    # la borne à incendie des rues (remplace le dessin en code « bouche »)
    'borne': (['decor/borne-base.png'], None, 15),
    # les pneus empilés (garage, ville) ; le bidon d'essence est une tuile (outils/fixe-tuiles.py)
    'pneus': (['decor/pneus-base.png'], None, 14),
    # Tom de dos sur une échelle : deux images qui alternent (montée comme descente) ; même densité que les planches des héros (6),
    # largeur choisie pour que sa taille égale celle de Tom debout (118 px de planche de la tête aux pieds)
    'tom-echelle': ([f'heros/tom-echelle-{k}-base.png' for k in (1, 2)], None, 14.5),
    # Mat de dos sur une échelle (même principe) : largeur calée sur sa taille debout (120 px de planche), un peu plus que pile
    'mat-echelle': ([f'heros/mat-echelle-{k}-base.png' for k in (1, 2)], None, 11.6),
    # les trois autres héros, même principe ; largeurs calées sur leur taille debout (la tête aux pieds), un peu plus que pile
    'jbt-echelle': ([f'heros/jbt-echelle-{k}-base.png' for k in (1, 2)], None, 13.4),
    'jbm-echelle': ([f'heros/jbm-echelle-{k}-base.png' for k in (1, 2)], None, 9.9),
    'jbg-echelle': ([f'heros/jbg-echelle-{k}-base.png' for k in (1, 2)], None, 10.8),
    # le saut : l'instrument est dans l'image ; l'échelle des images est la même pour tous (tête d'environ 75 px dans l'image
    # d'origine, 27 px de planche chez le héros debout, soit 0,37 px de planche par pixel d'image)
    'tom-saut': (['heros/tom-saut-base.png'], None, 20.2),
    'mat-saut': (['heros/mat-saut-base.png'], None, 17.9),
    'jbt-saut': (['heros/jbt-saut-base.png'], None, 16.8),
    'jbm-saut': (['heros/jbm-saut-base.png'], None, 14.4),
    'jbg-saut': (['heros/jbg-saut-base.png'], None, 16.0),
    # la fougère (garage, alpages, plage)
    'fougere': (['decor/fougere-base.png'], None, 14),
    # le menhir des forêts et de l'île (arc breton) : une pierre levée, de l'artiste ; le dolmen, lui, est dessiné en code
    'menhir': (['decor/menhir-1-base.png'], None, 14),
    # le baril explosif (garage, ville) : un objet du jeu (genre BARIL), pas un décor
    'baril': (['decor/baril-explosif-base.png'], 'BARIL', 15),
    'poubelle': ([f'decor/poubelle-{k}-base.png' for k in (1, 2)], None, 11),
    # le tonneau de décor, sans pancarte (les tonneaux WOG sont des tuiles : outils/fixe-tuiles.py)
    'tonneau': (['decor/tonneau-base.png'], None, 13),
    # clôtures (neuve, simple, envahie de lierre), boîtes aux lettres (ronde, carrée), palmiers (penché, droit, courbé) et
    # arbres (rond vert clair, chêne sombre) : même échelle pour toutes les apparences d'un objet
    'cloture': ([f'decor/cloture-{k}-base.png' for k in (1, 2, 3)], None, 26),
    'boite': ([f'decor/boite-{k}-base.png' for k in (1, 2)], None, 11),
    'palmier': ([f'decor/palmier-{k}-base.png' for k in (1, 2, 3)], None, 34),
    'arbre': ([f'decor/arbre-{k}-base.png' for k in (1, 2)], None, 34),
    'enceinte-34': ([f'decor/enceinte-34-{k}-base.png' for k in (1, 2)], None, 26, True),
}


# Ces images ne sont pas du pixel art sur une grille de 2 : leurs pixels sont déjà ceux du jeu. Les ramener à la grille
# détecterait une case fausse et abîmerait le dessin (bruit, détails perdus) ; on les prend telles quelles, et on les agrandit
# d'un facteur entier pour que chaque pixel reste carré.
NATIF_BRUT = {'voiture', 'rocker', 'robot', 'borne', 'pneus', 'baril', 'fougere', 'menhir', *(f'{h}-echelle' for h in ECHELLES), *SAUTS}
# les panneaux de direction (le texte doit se lire) : chaque pixel de l'artiste reste un carré net (agrandissement entier, sans
# redimensionnement qui rend les pixels inégaux et brouille les lettres)
ENTIERS = {'panneau'}
# des personnages qu'on met tous à la même hauteur (et non à la même largeur) : ils ne se ressemblent pas en largeur
MEME_HAUTEUR = {'rocker': 19}  # pixels du jeu


def redresse(a):
    """Une voiture vue de trois quarts a sa roue arrière plus haute que l'avant : on fait glisser chaque colonne d'un nombre entier
    de pixels (un cisaillement, sans rééchantillonnage : le pixel art reste net) pour que les deux roues reposent sur la même ligne."""
    al = a[..., 3] > 0
    xs = np.nonzero(al.any(0))[0]
    bas = {x: np.nonzero(al[:, x])[0].max() for x in xs}
    milieu = (xs.min() + xs.max()) // 2
    xr = max((x for x in xs if x < milieu), key=lambda x: bas[x])  # le bas de la roue arrière
    xf = max((x for x in xs if x >= milieu), key=lambda x: bas[x])  # celui de la roue avant
    pente = (bas[xf] - bas[xr]) / (xf - xr)
    decal = {x: round(pente * (xf - x)) for x in xs}
    mini = min(decal.values())
    sortie = np.zeros((a.shape[0] + max(decal.values()) - mini, a.shape[1], 4), np.uint8)
    for x in xs:
        d = decal[x] - mini
        sortie[d : d + a.shape[0], x] = a[:, x]
    return sortie


def natif_brut(chemin):
    """L'image à sa vraie grille : la plus grande case (de 1 à 8 px) dont tous les blocs opaques sont unis (1 si le dessin n'est pas
    posé sur une grille plus large : on ne touche à rien). Les deux voitures de trois quarts sont ensuite redressées."""
    a = np.array(Image.open(chemin).convert('RGBA'))
    case, depart = 1, (0, 0)
    for c in range(2, 9):
        for oy in range(c):
            for ox in range(c):
                h, w = (a.shape[0] - oy) // c * c, (a.shape[1] - ox) // c * c
                b = a[oy : oy + h, ox : ox + w].astype(int).reshape(h // c, c, w // c, c, 4)
                unis = np.abs(b - b[:, :1, :, :1]).sum((1, 3, 4)) == 0
                opaques = b[:, 0, :, 0, 3] > 0
                if unis[opaques].mean() >= 0.99:
                    case, depart = c, (ox, oy)
    ox, oy = depart
    # les rockers viennent tous d'une même toile de 256 px, mais leur grille varie (2 px pour les uns, 1 px pour les autres) : on les
    # garde à l'échelle de la toile pour que leurs tailles restent comparables
    if case > 1 and not chemin.name.startswith('rocker'):
        h, w = (a.shape[0] - oy) // case * case, (a.shape[1] - ox) // case * case
        a = a[oy : oy + h, ox : ox + w].reshape(h // case, case, w // case, case, 4)[:, 0, :, 0]
    if chemin.name in ('voiture-5-base.png',):  # l'ancienne Mégane (voiture-2) est déjà de profil ; la Renault 11 est de trois quarts
        a = redresse(a)
    return a, case


def agrandit(chemin, largeur):
    """Le sprite remis sur sa grille, recadré, agrandi sans lissage à `largeur` px de planche."""
    nat, case = natif_et_case(chemin)
    ys, xs = np.nonzero(nat[..., 3])
    return nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1], case


def cadre_commun(chemins):
    """Toutes les images recadrées sur la même boîte (l'union de leurs silhouettes) : d'une pose à l'autre, le
    personnage ne glisse pas."""
    nats = [natif_et_case(c)[0] for c in chemins]
    h = min(n.shape[0] for n in nats)
    w = min(n.shape[1] for n in nats)
    nats = [n[:h, :w] for n in nats]
    plein = np.zeros((h, w), bool)
    for n in nats:
        plein |= n[..., 3] > 0
    ys, xs = np.nonzero(plein)
    return [(n[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1], 0) for n in nats]


def main():
    lignes, decors = [], []
    for nom, (sources, genre, largeur, *commun) in OBJETS.items():
        if commun:
            etats = cadre_commun([RACINE / 'assets-sources' / s for s in sources])
        elif nom in NATIF_BRUT:
            etats = []
            for s in sources:
                nat, case = natif_brut(RACINE / 'assets-sources' / s)
                ys, xs = np.nonzero(nat[..., 3])
                etats.append((nat[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1], case))
        else:
            etats = [agrandit(RACINE / 'assets-sources' / s, largeur) for s in sources]
        # tous les états ont la même échelle (celle du premier) pour que l'objet ne change pas de taille en s'ouvrant
        premier = etats[0][0]
        w0 = np.ptp(np.nonzero(premier[..., 3].any(0))[0]) + 1  # la largeur du personnage, pas celle du cadre commun
        dens = DENSITES.get(nom, DENSITE)
        echelle = largeur * dens / w0
        if nom in NATIF_BRUT and nom not in LISSES:
            echelle = max(1, round(echelle))  # entier : pas de pixel plus large que son voisin
        if nom in ENTIERS:
            echelle = max(1, round(echelle))
        images = []
        for nat, _ in etats:
            h, w = nat.shape[:2]
            if nom in MEME_HAUTEUR:  # chaque image à la même hauteur en jeu
                echelle = MEME_HAUTEUR[nom] * dens / h
            elif nom in ENTIERS:  # le même facteur entier pour toutes les images (le panneau ne change pas de taille)
                echelle = max(1, round(echelle))
            elif nom in NATIF_BRUT and nom not in LISSES:  # chaque image a sa grille : son propre facteur entier, pour une largeur en jeu voisine
                largeur_etat = np.ptp(np.nonzero(nat[..., 3].any(0))[0]) + 1
                echelle = max(1, round(largeur * dens / largeur_etat))
            nw, nh = round(w * echelle), round(h * echelle)
            if nom in LISSES:  # chaque pixel d'origine agrandi nettement (×4), puis réduit à la taille voulue avec un filtre de qualité
                gros = Image.fromarray(np.repeat(np.repeat(nat, 4, axis=0), 4, axis=1))
                images.append(gros.resize((nw, nh), Image.LANCZOS))
                continue
            yy = np.minimum((np.arange(nh) / echelle).astype(int), h - 1)
            xx = np.minimum((np.arange(nw) / echelle).astype(int), w - 1)
            images.append(Image.fromarray(nat[np.ix_(yy, xx)]))
        cw, ch = max(i.width for i in images), max(i.height for i in images)
        planche = Image.new('RGBA', (cw, ch * len(images)), (0, 0, 0, 0))
        for k, im in enumerate(images):  # centré, posé en bas de sa case
            planche.alpha_composite(im, ((cw - im.width) // 2, k * ch + ch - im.height))
        if nom == 'dj':
            # les montants de l'éclairage (les colonnes du bord) doivent toucher le sol : on descend chaque image de ce qui
            # dépasse sous eux, et on coupe ce qui sort de la case (le socle des platines, plus bas, est caché sous le sol)
            opaque = np.array(planche)[..., 3] > 0
            bord = max(1, cw // 12)
            colonnes = list(range(bord)) + list(range(cw - bord, cw))
            bas = max(np.nonzero(opaque[:ch, c])[0].max() for c in colonnes if opaque[:ch, c].any())
            d = ch - 1 - bas
            decale = Image.new('RGBA', planche.size, (0, 0, 0, 0))
            for k in range(len(images)):
                case = planche.crop((0, k * ch, cw, (k + 1) * ch))
                decale.paste(case.crop((0, 0, cw, ch - d)), (0, k * ch + d))  # ce qui sort par le bas est perdu, pas recopié dans la case suivante
            planche = decale
        # 256 couleurs suffisent aux planches lissées (visuellement identique) : 2 Mo de moins à charger et à garder hors ligne
        sortie = (
            planche.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE) if nom in QUANTIFIEES else planche
        )
        sortie.save(RACINE / 'public' / 'sprites' / f'{nom}.png', optimize=nom in QUANTIFIEES)
        print(f'{nom}.png : {len(images)} état(s), {cw}x{ch} px de planche, {cw / dens:.0f}x{ch / dens:.0f} en jeu')
        ligne = ', '.join(['1'] * len(images))
        cle = f'[G.{genre}]' if genre else f"'{nom}'"
        (lignes if genre else decors).append(
            f"  {cle}: {{ fichier: '{nom}.png', w: {cw}, h: {ch}, images: [{ligne}], rythme: 1, densite: {dens}, pied: {cw // 2} }},"
        )
    (RACINE / 'src' / 'rendu' / 'feuilles-objets.ts').write_text(
        "// Fichier généré par outils/fixe-objets.py : ne pas modifier à la main.\n"
        "import { G, type Genre } from '../jeu/vue';\n"
        "import type { Feuille } from './feuilles';\n\n"
        "export const FEUILLES_OBJETS: Partial<Record<Genre, Feuille>> = {\n" + '\n'.join(lignes) + '\n};\n\n'
        "/** Les planches du décor, sans genre : une ligne par apparence. */\n"
        "export const FEUILLES_DECOR: Record<string, Feuille> = {\n" + '\n'.join(decors) + '\n};\n'
    )


def formate(chemin):
    """Le fichier généré passe par Prettier, comme tout le code : sinon la CI (format:check) refuse le commit."""
    try:
        subprocess.run(['npx', 'prettier', '--write', str(chemin)], cwd=RACINE, check=False, capture_output=True)
    except OSError:
        print('Prettier introuvable : lancez `npx prettier --write src/rendu/feuilles-objets.ts` à la main.')


if __name__ == '__main__':
    main()
    formate(RACINE / 'src' / 'rendu' / 'feuilles-objets.ts')
