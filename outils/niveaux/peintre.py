"""Le peintre de niveaux : une grille de caractères (légende dans src/niveaux/format.ts) et des « pièces » qu'on y pose.

Une pièce est un morceau de niveau (colline, fosse à pitons, tour, galerie souterraine...) posé sur un terrain de base.
Les pièces ne cassent jamais le chemin de surface : de quoi aller du départ au van sans rien détruire (le test
d'accessibilité de tests/niveaux.test.ts le vérifie). Les chemins souterrains, les tours et les îles sont des
variantes ou des récompenses.
"""
import random

SOLIDES = set('#RBMNGWSDVCTOQ=-X')
# quelles tuiles servent de sol à un ennemi ou à un objet posé
SOL_ENNEMI = set('#RBMNGWSDVCTOQ=-X')


class Niveau:
    def __init__(self, largeur, hauteur, base, graine, theme):
        self.w, self.h, self.base = largeur, hauteur, base
        self.rng = random.Random(graine)
        self.t = theme
        self.g = [[' '] * largeur for _ in range(hauteur)]
        self.yg = base + 12  # la galerie souterraine principale (sous tous les paliers)
        self.haut = [base] * largeur  # la rangée du terrain de chaque colonne
        self.bas = hauteur - 6  # sous cette rangée : le vide
        self.vus = []  # (x, nature) pour les statistiques
        self._terrain()

    # ---- outils de base
    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.g[y][x] = c

    def get(self, x, y):
        return self.g[y][x] if 0 <= x < self.w and 0 <= y < self.h else 'X'

    def rect(self, x0, y0, x1, y1, c):
        """Remplit [x0, x1) × [y0, y1)."""
        for y in range(y0, y1):
            for x in range(x0, x1):
                self.set(x, y, c)

    def sol(self, x, ymin=0):
        """La première rangée solide de la colonne x (à partir de ymin), ou None."""
        for y in range(ymin, self.h):
            if self.get(x, y) in SOLIDES:
                return y
        return None

    def fond_souterrain(self):
        """Donne un mur de fond ('.') à tous les creux sous le terrain : puits, cavernes, gouffres, galeries. Sans lui, on voit
        le ciel à travers la terre. Un creux est « sous le terrain » s'il y a de la matière à sa gauche et à sa droite sur
        sa rangée, et encore de la matière en dessous : le vide sans fond (le gouffre qu'on traverse) n'en reçoit pas."""
        mat = set('#RBMNGWSDVX')
        premier = [next((x for x in range(self.w) if self.g[y][x] in mat), None) for y in range(self.h)]
        dernier = [next((x for x in range(self.w - 1, -1, -1) if self.g[y][x] in mat), None) for y in range(self.h)]
        for x in range(self.w):
            dessous = False
            for y in range(self.h - 1, self.base, -1):
                dessous = dessous or self.g[y][x] in mat
                if self.g[y][x] == ' ' and dessous and premier[y] is not None and premier[y] < x < dernier[y]:
                    self.g[y][x] = '.'

    def libre(self, x, y, hauteur=2):
        return all(self.get(x, y - k) in ' .' for k in range(hauteur))

    def niveler(self, x0, x1):
        """Ramène le terrain de [x0, x1) à la hauteur courante `base` (comblé ou creusé)."""
        t = self.t
        for x in range(x0, min(x1, self.w)):
            h = self.haut[x]
            if self.base < h:
                for y in range(self.base, h):
                    self.set(x, y, t['sol'] if y == self.base else t['sous'])
            elif self.base > h:
                for y in range(h, self.base):
                    self.set(x, y, ' ')
                self.set(x, self.base, t['sol'])
            self.haut[x] = self.base

    def palier(self, x0, x1, dy):
        """Fait monter (dy < 0) ou descendre le terrain de |dy| tuiles, par marches d'une tuile ; `base` change."""
        n = abs(dy)
        nouveau = self.base + dy
        longueur = x1 - x0
        for x in range(x0, x1):
            etape = min(n, (x - x0) * (n + 1) // max(1, longueur - 3))  # la dernière marche arrive avant la fin
            cible = self.base + (-etape if dy < 0 else etape)
            self.base_col(x, cible)
        self.base = nouveau

    def base_col(self, x, cible):
        t = self.t
        h = self.haut[x]
        if cible < h:
            for y in range(cible, h):
                self.set(x, y, t['sol'] if y == cible else t['sous'])
        elif cible > h:
            for y in range(h, cible):
                self.set(x, y, ' ')
            self.set(x, cible, t['sol'])
        self.haut[x] = cible

    def _terrain(self):
        t = self.t
        for x in range(self.w):
            for y in range(self.base, self.bas):
                d = y - self.base
                self.set(x, y, t['sol'] if d == 0 else t['sous'] if d < 4 else t['profond'])

    # ---- les ennemis, objets, repères
    def pose_sur_sol(self, x, c, ymin=0):
        y = self.sol(x, ymin)
        if y is None or not self.libre(x, y - 1, 2):
            return False
        self.set(x, y - 1, c)
        return True

    def ennemis(self, x0, x1, lettres, n, ymin=0):
        pose = 0
        for _ in range(n * 6):
            if pose >= n:
                break
            x = self.rng.randrange(x0, max(x0 + 1, x1))
            if self.get(x, 0) == ' ' and self.pose_sur_sol(x, self.rng.choice(lettres), ymin):
                pose += 1
        return pose

    def drones(self, x0, x1, n, lettre='e'):
        """Pose n ennemis volants (le drone 'e', ou le goéland 'g' dans l'arc breton) au-dessus du sol."""
        for _ in range(n):
            x = self.rng.randrange(x0, x1)
            y = self.sol(x)
            if y is not None:
                self.set(x, max(2, y - self.rng.randrange(5, 8)), lettre)

    def repere(self, x, c, ymin=0, surface=False):
        """Pose un repère (@ ! F * + K) sur le sol de la colonne x ; `surface` : sur le terrain, décor écarté."""
        if surface and self.sol(x, self.base - 3) == self.base - 1:
            for k in (1, 2):
                if self.get(x, self.base - k) in 'CTW':
                    self.set(x, self.base - k, ' ')
        return self.pose_sur_sol(x, c, ymin)

    # ---- pièces de surface
    def plat(self, x0, x1, deco=0):
        for _ in range(deco):
            x = self.rng.randrange(x0 + 3, max(x0 + 4, x1 - 3))  # jamais contre une porte ou une paroi voisine
            if self.get(x, self.base - 1) == ' ' and self.sol(x) == self.base:
                self.set(x, self.base - 1, self.rng.choice(self.t['deco']))

    def colline(self, x0, largeur, haut):
        """Une butte : des marches d'une tuile tous les 3 pas, qui montent puis descendent."""
        m = largeur // 2
        for i in range(largeur):
            p = min(i, largeur - 1 - i) // 3
            hh = min(haut, p + 1) if min(i, largeur - 1 - i) >= 2 else 0
            for k in range(hh):
                self.set(x0 + i, self.base - 1 - k, self.t['sol'] if k == hh - 1 else self.t['sous'])

    def fosse(self, x0, largeur, pitons=True, sortie=True):
        """Une tranchée jusqu'à la galerie, traversée par des pitons ; une échelle permet d'en sortir."""
        for x in range(x0, x0 + largeur):
            for y in range(self.base, self.yg + 1):
                self.set(x, y, ' ')
        if pitons:
            x = x0 + 2
            while x < x0 + largeur - 1:
                self.set(x, self.base, '=')
                x += 3
        if sortie:
            for y in range(self.base, self.yg + 1):
                self.set(x0 + largeur - 1, y, 'H')

    def mur(self, x0, haut, largeur=2):
        """Un mur à franchir par une échelle posée contre lui (ou en sautant de paroi en paroi)."""
        mat = self.t['mur']
        self.rect(x0, self.base - haut, x0 + largeur, self.base, mat)
        for y in range(self.base - haut, self.base):
            self.set(x0 - 1, y, 'H')

    def tour(self, x0, largeur, etages, mat=None, vitre=False):
        """Un bâtiment à étages : dalles et échelles, une porte au rez-de-chaussée, un toit accessible."""
        mat = mat or self.t['mur']
        fh = 6
        haut = etages * fh
        top = self.base - haut
        # murs et fond d'intérieur
        self.rect(x0, top, x0 + largeur, self.base, '.')
        for y in range(top, self.base):
            self.set(x0, y, mat)
            self.set(x0 + largeur - 1, y, mat)
        for k in range(1, etages + 1):
            ys = self.base - k * fh
            for x in range(x0, x0 + largeur):
                self.set(x, ys, '=' if (x - x0) % 4 == 2 else mat)  # des pitons : si on casse la dalle, on passe encore
            gx = x0 + 2 if k % 2 else x0 + largeur - 3  # le trou de l'échelle change de côté à chaque étage
            for y in range(ys, self.base - (k - 1) * fh):
                self.set(gx, y, 'H')
        # porte au rez-de-chaussée (deux tuiles de haut), à gauche
        self.rect(x0, self.base - 2, x0 + 1, self.base, ' ')
        if vitre:
            for k in range(etages):
                self.set(x0 + largeur - 1, self.base - k * fh - 3, 'V')
        return top

    def pont(self, x0, largeur, haut):
        """Une passerelle de planches à `haut` tuiles du sol, avec une échelle à chaque bout."""
        y = self.base - haut
        for x in range(x0, x0 + largeur):
            self.set(x, y, '-')
        for x in range(x0 + 7, x0 + largeur - 6, 8):
            self.set(x, y, '=')
        for xx in (x0 - 1, x0 + largeur):
            for yy in range(y, self.base):
                self.set(xx, yy, 'H')
        return y

    def iles(self, x0, largeur, haut):
        """Un escalier de pitons qui monte vers un îlot : la récompense (arme) est au bout."""
        y = self.base - 3
        x = x0
        while y > self.base - haut:
            self.set(x, y, '=')
            self.set(x + 1, y, '=')
            x += 4
            y -= 2
        for k in range(5):
            self.set(x + k, y, '=')
        return x + 2, y

    def cheminee(self, x0, haut):
        """Un puits étroit (3 de large) où l'on monte en sautant de paroi en paroi, une récompense tout en haut.

        Des portes au pied des deux parois laissent le chemin de surface libre : on le traverse sans monter.
        """
        mat = self.t['mur']
        top = self.base - haut
        for x in (x0 - 1, x0 + 3):
            self.rect(x, top, x + 1, self.base - 2, mat)
        self.rect(x0 - 1, top - 1, x0 + 7, top, mat)  # le toit déborde à droite : on sort par le haut
        self.rect(x0 + 3, top - 1, x0 + 7, top, ' ')
        for k in range(4):
            self.set(x0 + 3 + k, top, '=')
        return x0 + 5, top

    def echafaudage(self, x0, largeur, niveaux):
        """Un échafaudage ouvert : des planches tous les 4 rangs, des échelles en alternance ; le chemin passe dessous."""
        haut = []
        for k in range(1, niveaux + 1):
            y = self.base - 4 * k
            haut.append(y)
            for x in range(x0, x0 + largeur):
                self.set(x, y, '-')
            for x in range(x0 + 5, x0 + largeur - 4, 7):
                self.set(x, y, '=')
            gx = x0 + 1 if k % 2 else x0 + largeur - 2
            for yy in range(y, y + 4):
                self.set(gx, yy, 'H')
        return haut

    def maison(self, x0, largeur, mat=None):
        """Une petite maison d'un étage : deux portes, un toit-terrasse où l'on monte par une échelle extérieure."""
        mat = mat or self.t['mur']
        top = self.base - 6
        self.rect(x0, top, x0 + largeur, self.base, '.')
        for y in range(top, self.base):
            self.set(x0, y, mat)
            self.set(x0 + largeur - 1, y, mat)
        for x in range(x0, x0 + largeur):
            self.set(x, top, mat)
        self.rect(x0, self.base - 2, x0 + 1, self.base, ' ')
        self.rect(x0 + largeur - 1, self.base - 2, x0 + largeur, self.base, ' ')
        for y in range(top, self.base):
            self.set(x0 + largeur, y, 'H')
        return top

    def tyro(self, xa, ya, xb, yb):
        """Une tyrolienne : `(` en (xa, ya) juste au-dessus d'un palier, `)` en (xb, yb) au-dessus de l'arrivée."""
        self.set(xa, ya, '(')
        self.set(xb, yb, ')')
        for x in range(xb - 2, xb + 4):
            if self.get(x, yb + 1) == ' ':
                self.set(x, yb + 1, '=')

    # ---- le dessous
    def galerie(self, x0, x1, alcoves=3, y=None):
        """Un tunnel de deux tuiles de haut à la rangée `y` (par défaut `yg`), avec des alcôves plus hautes.

        Renvoie les milieux des alcôves, pour y poser le butin.
        """
        y = y or self.yg
        for x in range(x0, x1):
            self.set(x, y, ' ')
            self.set(x, y - 1, ' ')
            for yy in range(y + 1, y + 3):  # le sol du tunnel est toujours plein
                if self.get(x, yy) == ' ':
                    self.set(x, yy, self.t['profond'])
        salles = []
        for _ in range(alcoves):
            ax = self.rng.randrange(x0 + 8, max(x0 + 9, x1 - 12))
            w = self.rng.randrange(5, 9)
            self.rect(ax, y - 4, ax + w, y + 1, ' ')
            salles.append(ax + w // 2)
        return salles

    def caverne(self, x, largeur, haut, y=None):
        """Une grande salle dans le tunnel, avec des pitons à plusieurs hauteurs ; renvoie le piton le plus haut (x, y)."""
        y = y or self.yg
        self.rect(x, y - haut, x + largeur, y + 1, ' ')
        for yy in range(y + 1, y + 3):
            for xx in range(x, x + largeur):
                if self.get(xx, yy) == ' ':
                    self.set(xx, yy, self.t['profond'])
        py = y - 3
        px = x + 2
        haut_x = px
        while py > y - haut + 1 and px < x + largeur - 3:
            for k in range(3):
                self.set(px + k, py, '=')
            haut_x = px + 1
            px += 4
            py -= 2
        return haut_x, py + 2

    def boucle(self, x0, x1, descente=7):
        """Un chemin plus bas qui double le tunnel : deux échelles, entre elles un tunnel à `yg + descente`."""
        y2 = self.yg + descente
        for xx in range(x0, x1):
            for k in range(2):
                self.set(xx, y2 - k, ' ')
            if self.get(xx, y2 + 1) == ' ':
                self.set(xx, y2 + 1, self.t['profond'])
        for xx in (x0 + 1, x1 - 2):
            for yy in range(self.yg + 1, y2 + 1):
                self.set(xx, yy, 'H')
        return y2

    def cache(self, x, y, largeur=4, hauteur=3):
        """Une cachette murée : de la roche tout autour, du butin dedans ; on y entre en creusant."""
        self.rect(x, y - hauteur, x + largeur, y, ' ')
        return x + largeur // 2, y - 1

    def puits(self, x, y0=None, y1=None):
        """Un puits d'une tuile avec une échelle, du sol à la galerie (l'entrée est une échelle au ras du sol)."""
        y0 = self.haut[x] if y0 is None else y0
        y1 = self.yg + 1 if y1 is None else y1
        for y in range(y0, y1):
            self.set(x, y, 'H')

    def sous_sol(self, x0, x1, y):
        """Un second étage de galeries (plus profond), pour le butin et les cages."""
        return self.galerie(x0, x1, alcoves=2, y=y)

    # ---- sortie
    def lignes(self):
        return [''.join(r).rstrip() for r in self.g]
