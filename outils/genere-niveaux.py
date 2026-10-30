#!/usr/bin/env python3
"""Génère les cartes des niveaux (src/niveaux/cartes/NN-*.ts) à partir de plans (outils/niveaux/plans.py) : une suite de
lieux (forteresses, barrages, traversées de gouffres, tours...) reliés par de très courts raccords, et sous la terre des
caves entrées par une échelle (outils/niveaux/souterrain.py). Jamais de longue ligne droite sans rien à y faire.

Usage : python3 outils/genere-niveaux.py [garage|alpages|cimes|plage|ville|club|foret|port|groix ...]     Sortie : les cartes + un aperçu PNG
Une refonte (marseille_refonte...) s'écrit dans src/niveaux/refontes/ : elle ne remplace l'original qu'une fois publiée
(voir src/niveaux/refontes.ts).
Après une régénération, relancer python3 outils/pose-barils.py : il repose les barils explosifs (seuls ou en pile) des niveaux.
Les cartes sont ensuite modifiables à la main (c'est du texte) ; relancer le script les écrase.
"""
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / 'niveaux'))

from peintre import Niveau
from plans import NIVEAUX, enchaine
from souterrain import souterrain, tonneaux_de_surface
from ferry import ferry
from fise import bigair, breakdance, densite, entree, flat_bmx, food_court, gradins, halfpipe_bois, parc_street, soirees, spine, village
from plage import festival
from stc import calade, chapelle, clos, place, remparts, restanques
from tuves import canal, figuiers, lacets, pont_des_tuves, riviere, sentier
from hauteurs import corniches, descente, grotte, pont_de_singe, tours, vide_partout
from signatures import falaise, glacier, parking, ponton, scene, toits
from structures import forteresse, traversee
from verrous import barrage, gouffre
from detours import bastion, passe_haute, puits
import international
import international_jeu
import ottawa

RACINE = pathlib.Path(__file__).resolve().parent.parent
CARTES = RACINE / 'src' / 'niveaux' / 'cartes'
TEXTES = RACINE / 'src' / 'niveaux' / 'textes'

THEMES = {
    'garage': dict(sol='#', sous='#', profond='R', mur='B', deco=['C', 'C', 'T']),
    'alpages': dict(sol='#', sous='#', profond='R', mur='W', deco=['C', 'W']),
    'cimes': dict(sol='N', sous='R', profond='R', mur='R', deco=['G']),
    'plage': dict(sol='S', sous='S', profond='#', mur='W', deco=['C', 'W']),
    'ville': dict(sol='D', sous='D', profond='D', mur='D', deco=['C', 'T', 'M']),
    'club': dict(sol='D', sous='D', profond='D', mur='M', deco=['C', 'T', 'T']),
    'foret': dict(sol='#', sous='#', profond='R', mur='W', deco=['C', 'W']),
    'port': dict(sol='D', sous='#', profond='R', mur='B', deco=['C', 'T', 'W']),
    'groix': dict(sol='#', sous='R', profond='R', mur='R', deco=['C', 'W']),
    'mer': dict(sol='D', sous='#', profond='R', mur='B', deco=['C']),
    # le FISE : le béton des skateparks, les rampes en bois
    'fise': dict(sol='D', sous='#', profond='R', mur='W', deco=[]),
    # Saint-Cézaire : la pierre calcaire des maisons et des remparts ; les gorges de la Siagne : la roche, le bois des cabanes
    'stc': dict(sol='#', sous='#', profond='R', mur='{', deco=['C', 'C', 'T']),
    'tuves': dict(sol='#', sous='#', profond='R', mur='{', deco=['C', 'W']),
    # l'International Tour (voir niveaux/international.py) : la pierre de Beauvais, le calcaire gris de Limerick, la brique de
    # Lund, le béton et la brique de New York, la pierre blanche de Marseille
    'beauvais': dict(sol='#', sous='#', profond='R', mur='{', deco=['C', 'T']),
    'limerick': dict(sol='#', sous='#', profond='R', mur='R', deco=['C', 'W']),
    'lund': dict(sol='#', sous='#', profond='R', mur='B', deco=['C', 'W']),
    'newyork': dict(sol='D', sous='D', profond='R', mur='B', deco=['C', 'T', 'M']),
    'marseille': dict(sol='#', sous='R', profond='R', mur='{', deco=['C', 'W']),
    # Ottawa : la terre sous la neige, la brique rouge du Glebe
    'ottawa': dict(sol='#', sous='#', profond='R', mur='B', deco=['C', 'W']),
}

# ce qui vole dans chaque monde (posé par `drones`) : le drone par défaut, le goéland en Bretagne, à Limerick, à Lund et à
# Marseille (le gabian), la gargouille de la cathédrale de Beauvais, le pigeon de New York, la bernache du Canada à Ottawa
VOLANTS = {'foret': 'g', 'port': 'g', 'groix': 'g', 'mer': 'g', 'limerick': 'g', 'lund': 'g', 'marseille': 'g', 'beauvais': 'z', 'newyork': 'n', 'ottawa': 'w'}


# les niveaux de l'arc breton (voir docs/ARC-BRETAGNE.md) : le goéland y remplace le drone
BRETON = {'foret', 'port', 'groix', 'mer'}


def declencheurs(fichier):
    s = (TEXTES / fichier).read_text()
    m = re.search(r'dialogues:\s*\{(.*?)\n  \},\n  outro', s, re.S)
    return sorted(re.findall(r'^    (\d): \[', m.group(1), re.M))


class Recette:
    """Pose les pièces les unes après les autres, de gauche à droite, et le butin."""

    def __init__(self, nom, theme, fichier_textes, largeur=430, base=30, graine=1, profondeur=30):
        # peu de profondeur : 30 rangées sous la surface, dont 6 de vide ; le monde finit vite, on tombe vite (un niveau qui
        # descend, comme le sentier du pont des Tuves, en demande plus : `profondeur` dans son plan)
        self.nom, self.n = nom, Niveau(largeur, base + profondeur, base, graine, THEMES[theme])
        # l'arc breton a son goéland (g) à la place du drone (e), chaque ville de l'International Tour son volatile
        self.volant = VOLANTS.get(theme, 'e')
        self.x = 6
        self.digits = declencheurs(fichier_textes)
        self.pieces = []  # (x0, x1, genre)
        self.base_debut = {}  # x0 -> la rangée du sol au début du lieu
        self.flags = []

    @property
    def d(self):  # difficulté de 0 à 1 selon l'avancement
        return min(1.0, self.x / self.n.w)

    def suite(self, genre, largeur, **kw):
        x0, n = self.x, self.n
        x1 = x0 + largeur
        n.niveler(x0, x1)
        self.base_debut[x0] = n.base  # le sol de ce lieu : les drapeaux, posés après tout, le retrouvent (n.base a descendu)
        poser = getattr(self, 'p_' + genre)
        poser(x0, x1, **kw)
        self.pieces.append((x0, x1, genre))
        self.x = x1

    def combat(self, x0, x1, lettres='a', plus=0, drones=0):
        k = 1 + int(self.d * 3) + plus
        self.n.ennemis(x0 + 3, x1 - 2, lettres, max(0, k))
        if drones:
            self.n.drones(x0 + 3, x1 - 2, drones, self.volant)

    # ---- pièces de surface
    def p_palier(self, x0, x1, dy=-4, lettres='a'):
        self.n.palier(x0, x1, dy)
        self.combat(x0, x1, lettres)

    def p_echafaudage(self, x0, x1, niveaux=2, lettres='a'):
        n = self.n
        ys = n.echafaudage(x0 + 2, x1 - x0 - 4, niveaux)
        for y in ys:
            n.ennemis(x0 + 4, x1 - 4, lettres, 1, ymin=y - 1)
        n.repere((x0 + x1) // 2, '*', ymin=ys[-1] - 1)
        n.ennemis(x0, x1, lettres, 1)

    def p_maison(self, x0, x1, lettres='a', mat=None):
        n = self.n
        top = n.maison(x0, x1 - x0, mat)
        n.ennemis(x0 + 2, x1 - 2, lettres, 1 + int(self.d * 2), ymin=top + 1)
        n.repere((x0 + x1) // 2, '+', ymin=top - 1)
        n.ennemis(x0 + 2, x1 - 2, lettres, 1, ymin=top - 3)
    def p_plat(self, x0, x1, lettres='a', plus=0, deco=2, drones=0, cage=False, caissons=False):
        n = self.n
        n.plat(x0, x1, deco)
        if cage:  # un membre du groupe en cage, au milieu
            n.repere((x0 + x1) // 2, 'K', surface=True)
        if caissons:  # des caissons de basses, en pile au milieu
            for dx in (-1, 0, 1):
                n.repere((x0 + x1) // 2 + dx, 'T', surface=True)
            n.repere((x0 + x1) // 2, 'T', ymin=n.base - 4)
        self.combat(x0, x1, lettres, plus, drones)

    def p_raccord(self, x0, x1, lettres='a'):
        """Un court raccord entre deux lieux : un ennemi, rien de plus (le décor est semé à part)."""
        # (pas de caisse posée au hasard : à quatre tuiles de large, elle finirait devant la porte du lieu suivant)
        self.n.ennemis(x0 + 1, x1 - 1, lettres, 1 + (self.d > 0.5))

    def p_vide(self, x0, x1):
        """Du terrain nu, pour une arène que le plan remplira après coup."""

    def p_colline(self, x0, x1, haut=3, lettres='a', plus=0):
        self.n.colline(x0, x1 - x0, haut)
        self.combat(x0, x1, lettres, plus)

    def p_fosse(self, x0, x1, lettres='a'):
        self.n.fosse(x0, x1 - x0)
        self.n.ennemis(x1 + 1, x1 + 6, lettres, 1)

    def p_mur(self, x0, x1, haut=5, lettres='a'):
        self.n.mur(x0 + 3, haut)
        self.combat(x0, x1, lettres)

    def p_tour(self, x0, x1, etages=2, lettres='a', tyro=0, mat=None, vitre=False):
        n = self.n
        top = n.tour(x0, x1 - x0, etages, mat, vitre)
        for k in range(etages):
            ys = n.base - k * 6
            n.ennemis(x0 + 3, x1 - 3, lettres, 1 + (k > 0), ymin=ys - 5)
        n.repere(x0 + (x1 - x0) // 2, '*', ymin=top - 1)  # une arme sur le toit
        if tyro:
            n.tyro(x1 - 1, top - 1, x1 + tyro, n.base - 5)  # part du bord du toit : le câble ne traverse rien

    def p_pont(self, x0, x1, haut=6, lettres='a'):
        n = self.n
        y = n.pont(x0, x1 - x0, haut)
        n.ennemis(x0 + 2, x1 - 2, lettres, 1 + int(self.d * 2), ymin=y - 1)
        n.ennemis(x0, x1, lettres, 1)

    def p_iles(self, x0, x1, haut=12, lettres='a'):
        n = self.n
        ix, iy = n.iles(x0 + 2, x1 - x0, haut)
        n.repere(ix, '*', ymin=iy - 1)
        self.combat(x0, x1, lettres)

    def p_cheminee(self, x0, x1, haut=10, lettres='a'):
        n = self.n
        cx, cy = n.cheminee(x0 + 3, haut)
        n.repere(cx, '+', ymin=cy - 1)
        self.combat(x0, x1, lettres)

    def p_barrage(self, x0, x1, haut=12, lettres='a', tyro=0, butin='*'):
        barrage(self.n, x0 + 2, haut, lettres, tyro, butin)
        self.n.ennemis(x1 - 9, x1 - 1, lettres, 2)

    def p_gouffre(self, x0, x1, lettres='a', nb=4):
        gouffre(self.n, x0 + 3, x1 - x0 - 6, lettres, nb)

    def p_forteresse(self, x0, x1, etages=3, lettres='a', sous_sol=True, cage=False, mat=None):
        forteresse(self.n, x0 + 2, x1 - x0 - 4, etages, lettres, mat, sous_sol, cage)

    def p_traversee(self, x0, x1, lettres='a', mode='mixte'):
        traversee(self.n, x0, lettres, mode)

    # ---- les structures propres à chaque monde (voir niveaux/signatures.py)
    def p_parking(self, x0, x1, lettres='a'):
        parking(self.n, x0, x1 - x0, lettres)

    def p_falaise(self, x0, x1, lettres='a'):
        falaise(self.n, x0, x1 - x0, lettres, 'R')

    def p_glacier(self, x0, x1, lettres='y', nb=3):
        glacier(self.n, x0, x1 - x0, lettres, nb)

    def p_ponton(self, x0, x1, lettres='a'):
        ponton(self.n, x0, x1 - x0, lettres, self.n.t['mur'])

    def p_scene(self, x0, x1, lettres='a'):
        scene(self.n, x0, x1 - x0, lettres, 'D')

    def p_festival(self, x0, x1, lettres='acdf'):
        festival(self.n, x0, x1 - x0, lettres)

    def p_toits(self, x0, x1, lettres='a'):
        toits(self.n, x0, x1 - x0, lettres, self.n.t['mur'])

    # ---- le vide et l'escalade (voir niveaux/hauteurs.py)
    def p_pont_singe(self, x0, x1, lettres='a', butin=None):
        pont_de_singe(self.n, x0, x1 - x0, lettres, butin)

    def p_descente(self, x0, x1, chute=6, lettres='a'):
        descente(self.n, x0, x1 - x0, chute, lettres)

    def p_grotte(self, x0, x1, monte=8, lettres='a', butin='*'):
        grotte(self.n, x0, x1 - x0, monte, lettres, butin)

    def p_corniches(self, x0, x1, monte=6, lettres='a', butin='+'):
        corniches(self.n, x0, x1 - x0, monte, lettres, butin)

    def p_tours(self, x0, x1, etages=3, mode='pont', lettres='a', mat=None):
        tours(self.n, x0, x1 - x0, etages, mode, lettres, mat)

    # ---- Saint-Cézaire (voir niveaux/stc.py) : le Clos, les restanques, les remparts, la place, les calades, la chapelle
    def p_clos(self, x0, x1, lettres='a'):
        clos(self.n, x0, x1 - x0, lettres)

    def p_restanques(self, x0, x1, lettres='a', marches=3, haut=2):
        restanques(self.n, x0, x1 - x0, lettres, marches, haut)

    def p_remparts(self, x0, x1, haut=5, lettres='a'):
        remparts(self.n, x0, x1 - x0, haut, lettres)

    def p_place(self, x0, x1, lettres='a', caissons=True):
        place(self.n, x0, x1 - x0, lettres, caissons)

    def p_calade(self, x0, x1, lettres='a', haut=5):
        calade(self.n, x0, x1 - x0, lettres, haut)

    def p_chapelle(self, x0, x1, lettres='a', cage=True):
        chapelle(self.n, x0, x1 - x0, lettres, cage)

    # ---- le pont des Tuves (voir niveaux/tuves.py) : le sentier qui descend aux gorges, le canal, le pont, la rivière, les figuiers
    def p_sentier(self, x0, x1, lettres='a'):
        sentier(self.n, x0, x1 - x0, lettres)

    def p_lacets(self, x0, x1, chute=6, lettres='a'):
        lacets(self.n, x0, x1 - x0, chute, lettres)

    def p_canal(self, x0, x1, lettres='a'):
        canal(self.n, x0, x1 - x0, lettres)

    def p_pont_des_tuves(self, x0, x1, lettres='a'):
        pont_des_tuves(self.n, x0, x1 - x0, lettres)

    def p_riviere(self, x0, x1, lettres='a', chute=4):
        riviere(self.n, x0, x1 - x0, lettres, chute)

    def p_figuiers(self, x0, x1, lettres='v'):
        figuiers(self.n, x0, x1 - x0, lettres)

    # ---- le FISE (voir niveaux/fise.py) : chaque zone du festival, son décor placé à la main
    def p_entree(self, x0, x1, lettres='s'):
        entree(self.n, x0, x1 - x0, lettres)

    def p_parc_street(self, x0, x1, lettres='sot'):
        parc_street(self.n, x0, x1 - x0, lettres)

    def p_food_court(self, x0, x1, lettres='f'):
        food_court(self.n, x0, x1 - x0, lettres)

    def p_halfpipe_bois(self, x0, x1, haut=5, lettres='sotx'):
        halfpipe_bois(self.n, x0, x1 - x0, haut, lettres)

    def p_spine(self, x0, x1, haut=3, lettres='so'):
        spine(self.n, x0, x1 - x0, haut, lettres)

    def p_breakdance(self, x0, x1, lettres='k'):
        breakdance(self.n, x0, x1 - x0, lettres)

    def p_flat_bmx(self, x0, x1, lettres='px'):
        flat_bmx(self.n, x0, x1 - x0, lettres)

    def p_village(self, x0, x1, lettres='fs'):
        village(self.n, x0, x1 - x0, lettres)

    def p_gradins(self, x0, x1, haut=6, lettres='a', cage=False, butin='+', mat=None):
        gradins(self.n, x0, x1 - x0, haut, lettres, cage, butin, mat)

    def p_bigair(self, x0, x1, lettres='a'):
        bigair(self.n, x0, x1 - x0, lettres)

    def p_ferry(self, x0, x1, lettres='a'):
        ferry(self.n, x0, x1 - x0, lettres)

    # ---- les détours (voir niveaux/detours.py) : la pierre de taille qu'on contourne plutôt que de la casser
    def p_bastion(self, x0, x1, haut=7, lettres='a', butin='+'):
        bastion(self.n, x0, x1 - x0, haut, lettres, butin)

    def p_passe_haute(self, x0, x1, haut=10, lettres='a', butin='+'):
        passe_haute(self.n, x0, x1 - x0, haut, lettres, butin)

    def p_puits(self, x0, x1, lettres='a', butin='*'):
        puits(self.n, x0, x1 - x0, lettres, butin)

    # ---- l'International Tour (voir niveaux/international.py) : les monuments de chaque ville
    def p_cathedrale_beauvais(self, x0, x1, lettres='a'):
        international.cathedrale_beauvais(self.n, x0, x1 - x0, lettres)

    def p_avion(self, x0, x1, lettres='a'):
        international.avion_lowcost(self.n, x0, x1 - x0, lettres)

    def p_chateau_roi_jean(self, x0, x1, lettres='a'):
        international.chateau_roi_jean(self.n, x0, x1 - x0, lettres)

    def p_pub(self, x0, x1, lettres='a'):
        international.pub(self.n, x0, x1 - x0, lettres)

    def p_universite(self, x0, x1, lettres='a'):
        international.universite_limerick(self.n, x0, x1 - x0, lettres)

    def p_gymnase(self, x0, x1, lettres='a'):
        international_jeu.gymnase(self.n, x0, x1 - x0, lettres)

    def p_lac_gele(self, x0, x1, lettres='a'):
        international_jeu.lac_gele(self.n, x0, x1 - x0, lettres)

    def p_luge(self, x0, x1, lettres='a', haut=7):
        international_jeu.butte_de_luge(self.n, x0, x1 - x0, lettres, haut)

    def p_pres(self, x0, x1, lettres='c'):
        international.pres_a_murets(self.n, x0, x1 - x0, lettres)

    def p_shannon(self, x0, x1, lettres='a'):
        international.shannon(self.n, x0, x1 - x0, lettres)

    def p_cathedrale_lund(self, x0, x1, lettres='a'):
        international.cathedrale_lund(self.n, x0, x1 - x0, lettres)

    def p_maisons_rouges(self, x0, x1, lettres='a'):
        international.maisons_rouges(self.n, x0, x1 - x0, lettres)

    def p_gratte_ciel(self, x0, x1, lettres='a', etages=5):
        international.gratte_ciel(self.n, x0, x1 - x0, lettres, etages)

    def p_metro(self, x0, x1, lettres='c'):
        international.metro(self.n, x0, x1 - x0, lettres)

    def p_pont_brooklyn(self, x0, x1, lettres='a'):
        international.pont_brooklyn(self.n, x0, x1 - x0, lettres)

    def p_bonne_mere(self, x0, x1, lettres='a'):
        international.bonne_mere(self.n, x0, x1 - x0, lettres)

    def p_calanques(self, x0, x1, lettres='a'):
        international.calanques(self.n, x0, x1 - x0, lettres)

    # ---- Ottawa (voir niveaux/ottawa.py)
    def p_patinoire(self, x0, x1, lettres='a'):
        ottawa.patinoire(self.n, x0, x1 - x0, lettres)

    def p_parlement(self, x0, x1, lettres='a'):
        ottawa.parlement(self.n, x0, x1 - x0, lettres)

    def p_glebe(self, x0, x1, lettres='a', chute=8):
        ottawa.glebe(self.n, x0, x1 - x0, lettres, chute)

    def p_arene(self, x0, x1, lettres='ab', plus=2):
        n = self.n
        n.plat(x0, x1, 5)
        k = 3 + int(self.d * 4) + plus
        n.ennemis(x0 + 3, x1 - 2, lettres, k)

    # ---- repères
    def dialogue(self, c, x):
        self.n.repere(x, c)

    def drapeau(self, x, portee=3, monte=3, base=None):
        base = self.n.base if base is None else base
        for dx in sorted(range(-portee, portee + 1), key=abs):  # le plus près possible d'un sol libre
            if self.n.repere(x + dx, '!', ymin=base - monte, surface=True):  # au sol, jamais sur une plate-forme en hauteur
                self.flags.append(x + dx)
                return True
        return False

    def ecrit(self, indice, nom_fichier, constante):
        n = self.n
        n.fond_souterrain()
        lignes = n.lignes()
        ts = (
            f'// {self.nom} : la carte du niveau, générée par outils/genere-niveaux.py puis modifiable à la main.\n'
            f'// Légende dans ../format.ts. Une ligne par rangée de tuiles de 16 px ; sous la dernière rangée de terre, le vide.\n'
            f'export const {constante}: string[] = [\n' + ''.join(f"  '{l}',\n" for l in lignes) + '];\n'
        )
        if n.decors:  # le décor placé à la main (voir Niveau.decor) : [nom, colonne, rangée du sol]
            ts += (
                f'\n/** Le décor du niveau, placé à la main par le générateur (pas de décor semé au hasard) : [nom, colonne, rangée du sol]. */\n'
                f'export const DECOR_{constante.removeprefix("CARTE_")}: [string, number, number][] = [\n'
                + ''.join(f"  ['{d}', {x}, {y}],\n" for d, x, y in n.decors)
                + '];\n'
            )
        if n.assauts:  # les assauts de riders (voir Niveau.assaut) : les colonnes qui les déclenchent
            ts += (
                f'\n/** Les colonnes qui déclenchent un assaut de riders (voir jeu/assauts.ts). */\n'
                f'export const ASSAUTS_{constante.removeprefix("CARTE_")}: number[] = [{", ".join(str(x) for x in n.assauts)}];\n'
            )
        if n.zones:  # les modules des riders au repos (voir Niveau.zones)
            ts += (
                f'\n/** Les modules où les riders au repos roulent : colonnes de début et de fin (voir jeu/chargement.ts). */\n'
                f'export const ZONES_{constante.removeprefix("CARTE_")}: [number, number][] = [{", ".join(f"[{a}, {b}]" for a, b in n.zones)}];\n'
            )
        (CARTES / nom_fichier).write_text(ts)
        # une refonte (../refontes/...) a son aperçu à côté des autres, préfixé
        apercu(lignes, nom_fichier.replace('../refontes/', 'refonte-').replace('.ts', '.png'))


COULEURS = {
    ' ': (30, 20, 40), '.': (60, 50, 70), '#': (122, 74, 42), 'R': (109, 109, 120), 'B': (156, 59, 46), 'M': (138, 150, 163),
    'X': (20, 20, 20), 'N': (230, 240, 251), 'G': (143, 208, 238), 'W': (168, 116, 58), '-': (210, 154, 85), 'H': (196, 154, 90),
    'E': (255, 255, 255), '=': (190, 200, 210), 'C': (176, 125, 60), 'T': (60, 60, 60), 'S': (232, 207, 138), 'V': (191, 233, 255),
    'D': (154, 154, 146), 'L': (44, 44, 49), 'U': (232, 96, 122), 'A': (216, 168, 104), 'I': (170, 80, 220), '|': (255, 79, 216), '{': (200, 184, 150), '^': (184, 73, 46), '~': (60, 150, 190), ';': (90, 64, 40), '(': (255, 0, 255), ')': (255, 0, 255), '[': (96, 96, 112),
}


def apercu(lignes, nom, z=3):
    from PIL import Image

    h, w = len(lignes), max(len(l) for l in lignes)
    im = Image.new('RGB', (w * z, h * z))
    px = im.load()
    for y, l in enumerate(lignes):
        for x, c in enumerate(l.ljust(w)):
            col = COULEURS.get(c, (255, 255, 0) if c in '@!F*+K' else (255, 80, 80) if c.isalpha() else (0, 255, 255))
            for dy in range(z):
                for dx in range(z):
                    px[x * z + dx, y * z + dy] = col
    out = pathlib.Path(sys.argv[0]).resolve().parent.parent / 'assets-sources' / 'niveaux'
    out.mkdir(exist_ok=True)
    im.save(out / nom)


# ---------------------------------------------------------------------------------------------------------------
# Les recettes. Chaque recette : une liste de pièces (genre, largeur, options), puis les galeries et le butin.


def construit(nom, theme, textes, plan, fichier, constante, graine, base=30, van=True, altitude=False, profondeur=30, drapeaux=None):  # fichier et constante : inutilisés ici
    total = 12 + sum(p[1] for p in plan)
    r = Recette(nom, theme, textes, largeur=total, graine=graine, base=base, profondeur=profondeur)
    n = r.n
    if altitude:
        # un niveau en hauteur : tout est vide, chaque pièce pose son massif (voir niveaux/hauteurs.py) ; le départ a le sien
        vide_partout(n)
        n.niveler(0, 6)
    n.repere(3, '@', surface=True)
    digits = iter(r.digits)
    for genre, w, kw in plan:
        kw = dict(kw)
        c = kw.pop('digit', None)
        x0 = r.x
        r.suite(genre, w, **kw)
        if c:  # le déclencheur du dialogue, au début du lieu : sur la première colonne libre (l'eau, un ennemi l'occupent parfois)
            any(n.repere(x, c, surface=True) for x in range(x0 + 1, x0 + 9))
        if kw.get('flag'):
            pass
    # drapeaux : après chaque lieu important (un par 50 colonnes au moins), et juste avant chaque boss. `drapeaux` (un
    # espacement, en colonnes) : un drapeau sur chaque lieu et non plus sur les seuls raccords, pour un niveau sans plat
    # (le pont des Tuves : la descente, les lacets, la rivière), la place du sol se cherche plus loin
    dernier = 0
    for x0, x1, g in r.pieces:
        if drapeaux and x0 - dernier >= drapeaux and x0 > 20:
            # le milieu du lieu, sinon son quart ou ses trois quarts : un lieu sans sol où poser n'arrête pas la suite
            for k in (2, 1, 3):  # quarts de lieu : 2 = le milieu
                if r.drapeau(x0 + (x1 - x0) * k // 4, portee=8, monte=14, base=r.base_debut[x0]):
                    dernier = x0
                    break
        elif g == 'raccord' and x0 - dernier >= 50 and x0 > 30 and not drapeaux:
            # au sol du raccord (n.base, lui, est celui de la fin du niveau : il a monté ou descendu en chemin)
            r.drapeau(x0 + (x1 - x0) // 2, base=r.base_debut[x0])
            dernier = x0
    for x0, x1, g in r.pieces:
        if g in ('arene', 'vide') and x1 - x0 >= 40:
            r.drapeau(x0 + 3)
    # le bout du niveau, après la dernière pièce : un replat pour le van, à la hauteur où l'on est arrivé (un niveau en altitude,
    # ou qui descend comme le sentier du pont des Tuves)
    if altitude or n.base != base:
        n.niveler(r.x, total)
    # le van, au bout (le club n'en a pas : le niveau finit avec le DJ)
    if van:
        n.repere(total - 5, 'F', surface=True)
    return r


def fabrique(cle):
    """Construit un niveau d'après son plan (outils/niveaux/plans.py), puis ses caves, et l'écrit."""
    cfg = NIVEAUX[cle]
    plan = enchaine(cfg['lieux'], cfg['graine'], cfg['raccord'])
    r = construit(
        cfg['nom'], cfg['theme'], cfg['textes'], plan, '', '', cfg['graine'], base=cfg['base'], van=cfg.get('van', True),
        altitude=cfg.get('altitude', False), profondeur=cfg.get('profondeur', 30), drapeaux=cfg.get('drapeaux'),
    )
    if not cfg.get('sans_caves'):  # le ferry est un petit niveau : rien sous le quai
        souterrain(r, cfg['caves'])
    tonneaux_de_surface(r, barils=cle in ('stc', 'ville', 'newyork'))
    if cle == 'cimes':
        arene_du_yeti(r)
    if cle == 'club':
        arene_du_dj(r)
    if cle == 'fise':
        arene_du_champion(r)
        densite(r)
        soirees(r)
        # les modules où les riders au repos roulent : tout ce qui n'est ni un raccord, ni l'entrée, ni le plat, ni le vide
        r.n.zones = [(x0, x1) for x0, x1, g in r.pieces if g not in ('raccord', 'entree', 'plat', 'vide')]
    if cfg.get('interieur'):
        interieur(r.n)
    r.ecrit(0, cfg['fichier'], cfg['constante'])
    return r


def arene_du_yeti(r):
    """L'arène du Yéti Alpha, plate et fermée par de la roche, avec deux médiators ; le van est tout au bout."""
    n = r.n
    x0 = n.w - 64
    n.niveler(x0, n.w)
    n.repere(x0 + 30, 'Y', surface=True)
    n.repere(x0 + 14, '+', surface=True)
    n.repere(x0 + 50, '+', surface=True)
    n.rect(n.w - 9, 0, n.w - 7, n.h, '|')  # la barrière : le van reste bloqué tant que le Yéti n'est pas battu
    # deux estrades, à deux tuiles du sol (le saut en monte trois)
    n.rect(x0 + 8, n.base - 2, x0 + 22, n.base - 1, 'G')
    n.rect(x0 + 38, n.base - 2, x0 + 52, n.base - 1, 'G')
    n.repere(n.w - 5, 'F', surface=True)


def arene_du_champion(r):
    """La finale du FISE, sur la main stage : le sol noir du grand parc entre deux barrières, deux estrades de pitons pour esquiver
    les élans du Champion et un médiator sur chacune ; le Champion au milieu, le van tout au bout (comme chez le Yéti Alpha)."""
    n = r.n
    x0 = n.w - 64
    n.niveler(x0, n.w)
    for x in range(x0, n.w):  # pas de cave sous la piste : le sol est plein (un puits d'échelle y débouchait)
        for y in range(n.base, n.h - 6):
            n.set(x, y, n.t['sol'] if y == n.base else n.t['sous'])
    for x in range(x0 + 2, n.w - 9):  # la main stage : le sol noir du grand parc, entre deux barrières
        n.set(x, n.base, 'L')
    n.decor(x0 + 2, 'barriere', n.base)
    n.decor(n.w - 10, 'barriere', n.base)
    n.repere(x0 + 32, 'P', surface=True)
    n.repere(x0 + 12, '+', ymin=n.base - 6)
    n.repere(x0 + 52, '+', ymin=n.base - 6)
    n.rect(n.w - 9, 0, n.w - 7, n.h, '|')  # la barrière : le van reste bloqué tant que le Champion n'est pas battu
    # deux estrades, à deux tuiles du sol (le saut en monte trois) ; elles s'arrêtent avant la barrière, qui ne doit pas être percée
    for a, b in ((x0 + 6, x0 + 18), (x0 + 46, x0 + 58)):
        for x in range(a, min(b, n.w - 11)):
            n.set(x, n.base - 2, '=')
    n.repere(n.w - 5, 'F', surface=True)


def arene_du_dj(r):
    """L'arène de DJ Boucle : plate, close par un mur de métal. Sous la scène (le DJ et ses deux enceintes, à sept tuiles de lui),
    du socle incassable : on ne peut pas faire tomber le boss en creusant. Quatre estrades de pitons pour esquiver les ondes au sol
    et les bombes du Drop : deux au fond, deux plus près de la scène ; un médiator sur chacune des estrades du fond. Pas de van :
    le niveau finit avec le DJ."""
    n = r.n
    x0 = n.w - 70
    n.niveler(x0, n.w)
    n.rect(n.w - 4, 3, n.w, n.base, 'M')
    n.rect(x0 + 28, n.base, x0 + 45, n.base + 4, 'X')  # le sol de la scène, incassable
    n.repere(x0 + 36, 'Z', surface=True)
    for a, b, y, butin in (
        (x0 + 6, x0 + 16, n.base - 2, True),
        (x0 + 20, x0 + 27, n.base - 2, False),
        (x0 + 47, x0 + 54, n.base - 2, False),
        (x0 + 58, x0 + 64, n.base - 2, True),
    ):
        for x in range(a, b):
            n.set(x, y, '=')
        if butin:
            n.repere((a + b) // 2, '+', ymin=y - 1)
    n.ennemis(x0 + 4, x0 + 28, 'bcd', 3)
    n.ennemis(x0 + 46, n.w - 6, 'bcd', 3)


def interieur(n):
    """Un club est une salle : un plafond de métal, un mur au bout, et un mur de fond derrière tout ce qui est creux au-dessus du sol."""
    plafond = 2
    for y in range(0, n.base):
        for x in range(n.w):
            if n.g[y][x] != ' ':
                continue
            n.g[y][x] = 'M' if y <= plafond or x == 0 else '.'


if __name__ == '__main__':
    for nom in sys.argv[1:] or list(NIVEAUX):
        fabrique(nom)
