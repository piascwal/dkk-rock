"""Les lieux de l'International Tour (voir plans.py) : une ville par membre du groupe, chacune avec ses monuments en tuiles.

- Beauvais : la cathédrale Saint-Pierre (le chœur gothique le plus haut du monde, inachevé : pas de nef), l'avion low-cost ;
- Limerick : le château du roi Jean (ses tours rondes au bord de la Shannon), le pub, les prés à murets et la Shannon ;
- Lund : la cathédrale romane et ses deux tours, les maisons de bois rouges de Kulturen ;
- New York : les gratte-ciel et leurs châteaux d'eau, le métro sous la rue, le pont de Brooklyn ;
- Marseille : la colline de la Bonne Mère, les calanques.

Comme partout : le chemin de surface reste praticable sans rien casser (portes au rez-de-chaussée, échelles), les hauteurs et les
sous-sols sont des récompenses (armes, médiators, cages).
"""
from structures import ETAGE, forteresse
from hauteurs import abime, pont


def _seuils(n, x0, largeur):
    """Dégage l'entrée d'un bâtiment étroit : la caisse de son rez-de-chaussée tombe sinon juste derrière une porte (deux tuiles
    de haut, le héros ne passerait plus)."""
    for x in (x0 + 1, x0 + largeur - 2):
        if n.get(x, n.base - 1) in 'CT':
            n.set(x, n.base - 1, '.')


def _creneaux(n, x0, x1, y, mat):
    """Des créneaux sur un toit : une dent sur deux."""
    for x in range(x0, x1):
        if (x - x0) % 2 == 0:
            n.set(x, y - 1, mat)


def _vitraux(n, x, y0, y1):
    """Une haute verrière : une colonne de vitres (les vitraux)."""
    for y in range(y0, y1):
        n.set(x, y, 'V')


def cathedrale_beauvais(n, x0, largeur, lettres='a'):
    """Le chœur de Beauvais : un vaisseau de pierre de quatre étages, de hautes verrières, des arcs-boutants à l'extérieur (des
    marches de pitons qu'on gravit de saut en saut), et à droite... rien : la nef n'a jamais été construite, les planchers
    s'arrêtent dans le vide, fermés par un mur de bois provisoire depuis cinq siècles. Une arme tout en haut, une cage au
    triforium."""
    mat = '{'
    base = n.base
    w = largeur - 10
    xa = x0 + 6
    top = forteresse(n, xa, w, 4, lettres, mat, sous_sol=True, cage=False, balcon=False, annexe=False, toit=False)
    for k in range(4):  # les verrières, sur les deux murs
        _vitraux(n, xa + 4, base - (k + 1) * ETAGE + 2, base - k * ETAGE - 2)
        _vitraux(n, xa + w - 5, base - (k + 1) * ETAGE + 2, base - k * ETAGE - 2)
    # les arcs-boutants : un escalier de pitons qui monte le long du mur gauche, jusqu'au toit
    y = base - 3
    x = x0 + 1
    while y > top + 1:
        n.set(x, y, '=')
        n.set(x + 1, y, '=')
        x = x0 + 1 + (x - x0 + 2) % 4
        y -= 3
    # le mur de bois provisoire, à la place de la nef (une porte au rez-de-chaussée : le chemin passe)
    for yy in range(top, base - 2):
        n.set(xa + w - 1, yy, 'W')
    # le faîte : une flèche de pierre, et l'arme qui y attend
    for yy in range(top - 4, top):
        n.set(xa + w // 2, yy, mat)
    n.repere(xa + w // 2 - 3, '*', ymin=top - 1)
    n.repere(xa + w // 2 + 2, 'K', ymin=base - 2 * ETAGE - 1)
    n.ennemis(xa + 2, xa + w - 2, lettres, 2, ymin=top - 1)


def avion_lowcost(n, x0, largeur, lettres='a'):
    """L'avion low-cost sur le tarmac : un fuselage creux posé sur ses trains (on passe dessous), un escalier de pitons jusqu'à la
    porte avant, la cabine (des passagers pressés), une aile de planches où l'on court, et l'arme dans le poste de pilotage."""
    base = n.base
    fx0, fx1 = x0 + 6, x0 + largeur - 4
    fy = base - 7  # le plancher de la cabine
    n.rect(fx0, fy - 4, fx1, fy + 1, 'M')
    n.rect(fx0 + 1, fy - 3, fx1 - 1, fy, '.')  # la cabine
    for x in range(fx0 + 3, fx1 - 3, 3):  # les hublots
        n.set(x, fy - 2, 'V')
    n.rect(fx0, fy - 2, fx0 + 1, fy, ' ')  # la porte arrière, et la porte avant
    n.rect(fx1 - 1, fy - 2, fx1, fy, ' ')
    for x in (fx0 + 3, fx1 - 5):  # les jambes des trains d'atterrissage : deux tuiles libres dessous, on passe
        for y in range(fy + 1, base - 2):
            n.set(x, y, 'M')
    n.rect(fx0, fy - 8, fx0 + 2, fy - 4, 'M')  # la dérive
    for k in range(6):  # l'escalier de la passerelle, vers la porte arrière
        n.set(fx0 - 6 + k, base - 1 - k, '=')
    for x in range((fx0 + fx1) // 2 - 6, (fx0 + fx1) // 2 + 6):  # l'aile, au milieu, à hauteur du plancher
        n.set(x, fy + 1, '-')
    n.ennemis(fx0 + 2, fx1 - 2, lettres, 3, ymin=fy - 2)
    n.ennemis(fx0 + 2, fx1 - 2, lettres, 1, ymin=fy - 6)
    n.repere(fx1 - 3, '*', ymin=fy - 2)
    n.ennemis(x0, fx0 - 6, lettres, 1)


def chateau_roi_jean(n, x0, largeur, lettres='a'):
    """Le château du roi Jean : un mur d'enceinte crénelé entre deux grosses tours rondes (plus hautes), un chemin de ronde où
    l'on court d'une tour à l'autre. On entre par les portes du rez-de-chaussée ; l'arme est au sommet de la seconde tour."""
    mat = 'R'
    base = n.base
    tw = 12  # pas plus étroit : la caisse de chaque étage tomberait devant la porte
    t1 = forteresse(n, x0 + 2, tw, 4, lettres, mat, sous_sol=False, balcon=False, annexe=False, toit=False)
    xm0, xm1 = x0 + 2 + tw, x0 + largeur - tw - 2
    top_m = forteresse(n, xm0, xm1 - xm0, 3, lettres, mat, sous_sol=True, balcon=False, annexe=False, toit=False)
    t2 = forteresse(n, xm1, tw, 4, lettres, mat, sous_sol=False, balcon=False, annexe=False, toit=False)
    for a, b, t in ((x0 + 2, x0 + 2 + tw, t1), (xm0, xm1, top_m), (xm1, xm1 + tw, t2)):
        _creneaux(n, a, b, t, mat)
        _seuils(n, a, b - a)
    # les portes entre le mur et les tours, à l'étage du chemin de ronde
    for x in (xm0, xm1 - 1):
        n.rect(x, top_m - 2, x + 1, top_m, ' ')
    n.repere(xm1 + tw // 2, '*', ymin=t2 - 1)
    n.ennemis(xm0 + 2, xm1 - 2, lettres, 2, ymin=top_m - 1)


def pub(n, x0, largeur, lettres='a'):
    """Le pub : un rez-de-chaussée avec son comptoir de bois, un étage où joue la session de
    musique traditionnelle (une petite estrade), un toit en pente d'ardoise ; un médiator derrière le comptoir."""
    mat = 'B'
    base = n.base
    top = forteresse(n, x0 + 2, largeur - 4, 2, lettres, mat, sous_sol=False, balcon=False, annexe=False, toit=False)
    _seuils(n, x0 + 2, largeur - 4)
    cx = x0 + largeur // 2 + 1  # à droite de la cloison du rez-de-chaussée : un comptoir dessous fermerait son passage
    for x in range(cx, cx + 5):  # le comptoir : une planche (on passe à travers, sous la cloison, ou on monte dessus)
        n.set(x, base - 1, '-')
    n.repere(cx + 2, '+', ymin=base - 3)
    for x in range(x0 + 5, x0 + 10):  # l'estrade de la session, à l'étage
        n.set(x, base - ETAGE - 1, 'W')
    for k in range(1, 4):  # le toit en pente
        for x in range(x0 + 2 + k, x0 + largeur - 2 - k):
            n.set(x, top - k, '^')
    n.ennemis(x0 + 4, x0 + largeur - 4, lettres, 2, ymin=base - ETAGE - 2)


def pres_a_murets(n, x0, largeur, lettres='a'):
    """Les prés irlandais : de douces collines vertes coupées de murets de pierre sèche (deux tuiles : on saute par-dessus), des
    moutons qui chargent."""
    base = n.base
    for x in range(x0 + 4, x0 + largeur - 3, 9):
        for y in range(base - 2, base):
            n.set(x, y, 'R')
    n.ennemis(x0 + 2, x0 + largeur - 2, lettres, 3)


def shannon(n, x0, largeur, lettres='a'):
    """La Shannon et le pont de Thomond : un fleuve (de l'eau qu'on traverse, les pieds dedans, et un lit de boue) sous un pont
    de pierre à arches, où l'on passe à pied sec. Un médiator sous la deuxième arche."""
    base = n.base
    for x in range(x0 + 2, x0 + largeur - 2):
        for y in range(base, base + 3):
            n.set(x, y, '~')
        n.set(x, base + 3, ';')
    py = base - 3  # le tablier, à trois tuiles au-dessus de l'eau
    for x in range(x0, x0 + largeur):
        n.set(x, py, 'R')
    for x in range(x0 + 4, x0 + largeur - 3, 7):  # les piles des arches
        for y in range(py + 1, base + 3):
            n.set(x, y, 'R')
    for x in (x0, x0 + largeur - 1):  # les culées, et des marches pour monter sur le pont
        for y in range(py, base):
            n.set(x, y, 'R')
    n.set(x0 - 1, base - 1, '=')
    n.set(x0 - 1, base - 2, '=')
    n.set(x0 + largeur, base - 1, '=')
    n.set(x0 + largeur, base - 2, '=')
    n.repere(x0 + 11, '+', ymin=base - 1)
    n.ennemis(x0 + 2, x0 + largeur - 2, lettres, 2, ymin=py - 1)


def cathedrale_lund(n, x0, largeur, lettres='a'):
    """La cathédrale de Lund : une nef romane basse entre deux tours jumelles carrées, plus hautes, aux toits pointus ; dessous,
    la crypte (le sous-sol), où le géant Finn serre son pilier. On monte dans les tours par l'intérieur ; l'arme est entre les
    deux flèches."""
    mat = 'R'
    base = n.base
    tw = 12  # pas plus étroit : la caisse de chaque étage tomberait devant la porte
    t1 = forteresse(n, x0 + 2, tw, 5, lettres, mat, sous_sol=False, balcon=False, annexe=False, toit=False)
    t2 = forteresse(n, x0 + 2 + tw, tw, 5, lettres, mat, sous_sol=False, balcon=False, annexe=False, toit=False)
    nef0 = x0 + 2 + 2 * tw
    top_n = forteresse(n, nef0, x0 + largeur - nef0 - 2, 2, lettres, mat, sous_sol=True, cage=True, balcon=False, annexe=False, toit=False)
    for a, w in ((x0 + 2, tw), (x0 + 2 + tw, tw), (nef0, x0 + largeur - nef0 - 2)):
        _seuils(n, a, w)
    for a, t in ((x0 + 2, t1), (x0 + 2 + tw, t2)):  # les flèches pointues
        for k in range(1, 4):
            for x in range(a + k, a + tw - k):
                n.set(x, t - k, '^')
    for y in range(top_n - 3, top_n):  # le toit de la nef, et une abside
        for x in range(nef0 + (top_n - y), x0 + largeur - 2 - (top_n - y)):
            n.set(x, y, '^')
    n.repere(x0 + 2 + tw, '*', ymin=t1 - 4)
    n.ennemis(nef0 + 2, x0 + largeur - 4, lettres, 2, ymin=top_n - 4)


def maisons_rouges(n, x0, largeur, lettres='a'):
    """Kulturen : trois maisons de bois rouge de Falun, à un étage, toits de tourbe (on y marche), de l'une à l'autre on saute."""
    base = n.base
    x = x0 + 2
    while x + 9 <= x0 + largeur:
        top = n.maison(x, 8, 'W')
        for xx in range(x, x + 8):  # la tourbe, verte, sur le toit
            n.set(xx, top, '#')
        n.ennemis(x + 1, x + 7, lettres, 1, ymin=top - 1)
        x += 11
    n.repere(x0 + largeur // 2, '+', ymin=base - 8)


def gratte_ciel(n, x0, largeur, lettres='a', etages=6):
    """Un gratte-ciel de Manhattan : des étages vitrés, des escaliers de secours en façade (un échafaudage de planches qu'on
    gravit dehors), et sur le toit un château d'eau en bois sur ses pieds de métal. L'arme est dans le château d'eau."""
    base = n.base
    w = largeur - 8
    top = n.tour(x0 + 6, w, etages, 'B', vitre=True)
    for k in range(etages):
        for x in range(x0 + 6 + 3, x0 + 6 + w - 3, 3):
            n.set(x, base - k * 6 - 3, 'V')
    for k in range(1, etages + 1):  # les escaliers de secours, à gauche
        y = base - 6 * k + 3
        for x in range(x0 + 2, x0 + 6):
            n.set(x, y, '-')
        for yy in range(y, y + 6):
            n.set(x0 + 2 if k % 2 else x0 + 5, yy, 'H')
    cx = x0 + 6 + w // 2
    for y in range(top - 3, top):  # les pieds du château d'eau : des échelles (on passe entre elles, on y grimpe)
        n.set(cx - 2, y, 'H')
        n.set(cx + 2, y, 'H')
    n.rect(cx - 3, top - 7, cx + 4, top - 3, 'W')
    n.rect(cx - 2, top - 6, cx + 3, top - 4, '.')
    n.set(cx - 3, top - 5, ' ')  # une porte dans le château d'eau
    n.set(cx - 3, top - 4, ' ')
    n.repere(cx, '*', ymin=top - 5)
    n.ennemis(x0 + 7, x0 + 6 + w - 1, lettres, 2, ymin=top - 1)


def metro(n, x0, largeur, lettres='a'):
    """Le métro sous la rue : un escalier qui descend (une échelle), un quai de béton éclairé, les rails, un second escalier qui
    remonte ; des rats sur le quai, un médiator au bout. La rue au-dessus reste praticable."""
    base = n.base
    y = base + 6  # le sol du quai
    n.rect(x0 + 2, y - 4, x0 + largeur - 2, y, '.')
    for x in range(x0 + 2, x0 + largeur - 2):
        n.set(x, y, 'D')
        n.set(x, y - 5, 'D')
    for x in (x0 + 3, x0 + largeur - 4):  # les deux escaliers (échelles), de la rue au quai
        for yy in range(base, y):
            n.set(x, yy, 'H')
    for x in range(x0 + 6, x0 + largeur - 6, 4):  # les rails (des pitons : si on casse le quai, on y passe encore)
        n.set(x, y, '=')
    n.repere(x0 + largeur - 7, '+', ymin=y - 2)
    n.ennemis(x0 + 5, x0 + largeur - 5, lettres, 3, ymin=y - 2)


def pont_brooklyn(n, x0, largeur, lettres='a'):
    """Le pont de Brooklyn au-dessus de l'East River (un gouffre sans fond) : un tablier de métal, deux tours de pierre à arches
    gothiques, et les câbles (des pitons en pente) qu'on gravit jusqu'au sommet des tours. L'arme est sur la seconde tour."""
    base = n.base
    abime(n, x0 + 3, x0 + largeur - 3)
    py = base
    for x in range(x0, x0 + largeur):
        n.set(x, py, 'M')
    for x in range(x0 + 6, x0 + largeur - 6, 8):
        n.set(x, py, '=')
    tours = (x0 + largeur // 4, x0 + 3 * largeur // 4)
    for t in tours:
        n.rect(t - 2, py - 12, t + 3, py, 'R')
        n.rect(t - 2, py - 4, t + 3, py, ' ')  # l'arche du bas : le tablier passe à travers la tour
        n.rect(t - 1, py - 10, t + 2, py - 7, ' ')  # l'arche du haut
        for k in range(1, 8):  # les câbles, de chaque côté de la tour
            n.set(t - 3 - k, py - 12 + k, '=')
            n.set(t + 3 + k, py - 12 + k, '=')
    n.repere(tours[1], '*', ymin=py - 13)
    n.ennemis(x0 + 2, x0 + largeur - 2, lettres, 3, ymin=py - 1)


def bonne_mere(n, x0, largeur, lettres='a'):
    """La colline de Notre-Dame de la Garde : on monte par des terrasses (des marches de trois tuiles), jusqu'à la basilique en
    haut (une tour de pierre et son clocher, l'arme au sommet). On redescend de l'autre côté. `base` ne change pas."""
    mat = '{'
    base = n.base
    marches = 6
    pas = 2  # deux tuiles : on les monte d'un saut
    for k in range(marches):  # les terrasses, de chaque côté
        h = (k + 1) * pas
        n.rect(x0 + 2 + k * 3, base - h, x0 + largeur - 2 - k * 3, base, '#')
    sommet = base - marches * pas
    cx = x0 + largeur // 2
    top = sommet - 2 * ETAGE
    n.rect(cx - 4, top, cx + 5, sommet, '.')
    for y in range(top, sommet):
        n.set(cx - 4, y, mat)
        n.set(cx + 4, y, mat)
    for x in range(cx - 4, cx + 5):
        n.set(x, top, mat)
        n.set(x, sommet - ETAGE, '=' if x % 3 == 0 else mat)
    for y in range(sommet - ETAGE, sommet):
        n.set(cx - 2, y, 'H')
    for y in range(top, sommet - ETAGE):
        n.set(cx + 2, y, 'H')
    n.rect(cx - 4, sommet - 2, cx - 3, sommet, ' ')
    n.rect(cx + 4, sommet - 2, cx + 5, sommet, ' ')
    for y in range(top - 5, top):  # le clocher
        n.set(cx, y, mat)
    n.repere(cx - 2, '*', ymin=top - 1)
    n.ennemis(x0 + 3, x0 + largeur - 3, lettres, 3, ymin=sommet - 1)


def calanques(n, x0, largeur, lettres='a'):
    """Les calanques : une falaise blanche qui tombe dans une crique d'eau turquoise (l'eau se traverse) ; un sentier de pitons
    accroché à la paroi pour la longer, et au fond de la crique, un médiator."""
    base = n.base
    mid0, mid1 = x0 + 6, x0 + largeur - 6
    for x in range(mid0, mid1):  # la crique : de l'eau sur deux rangées, un fond de sable
        for y in range(base, base + 2):
            n.set(x, y, '~')
        n.set(x, base + 2, 'S')
    for x in (mid0, mid1 - 1):  # une échelle de chaque bord : qui tombe à l'eau en ressort
        for y in range(base - 5, base + 2):
            n.set(x, y, 'H')
    for x in range(x0, mid0):  # les falaises de chaque côté, plus hautes
        for y in range(base - 5, base):
            n.set(x, y, 'R')
    for x in range(mid1, x0 + largeur):
        for y in range(base - 5, base):
            n.set(x, y, 'R')
    for x in range(mid0, mid1, 3):  # le sentier de pitons, au-dessus de l'eau
        n.set(x, base - 5, '=')
    for k in (0, 2, 4):  # des marches pour monter sur la première falaise
        n.set(x0 - 1, base - 1 - k, '=')
    n.repere((mid0 + mid1) // 2, '+', ymin=base)
    n.ennemis(x0, x0 + largeur, lettres, 2, ymin=base - 6)
