"""Les Plages Électroniques, à Cannes : la fin du niveau, quand la nuit est tombée, c'est le festival sur le sable. Une foule
de danseurs (du décor, qu'on traverse), des caissons de basses empilés en monticules, beaucoup de fêtards (les ennemis), et
au bout la grande scène de bois : une estrade, ses murs de caissons, le portique des projecteurs où attend une arme."""
from a_la_main import echelle, pose

DANSEURS = ['danseurVeste', 'danseuseCasquette', 'danseurFise', 'bboyAccroupi']


def festival(n, x0, largeur, lettres='acdf'):
    base = n.base
    w = min(18, largeur // 3)
    xs = x0 + largeur - w - 4  # la scène, au bout
    # la fosse : des monticules de caissons tous les neuf pas (deux de large, un de plus au milieu une fois sur deux)
    for k, x in enumerate(range(x0 + 4, xs - 6, 9)):
        n.set(x, base - 1, 'T')
        n.set(x + 1, base - 1, 'I' if k % 2 else 'T')
        if k % 2 == 0:
            n.set(x, base - 2, 'T')
    # la scène : les marches, l'estrade, les murs de caissons aux deux bouts, le portique et son échelle (sur l'estrade, après les caissons)
    n.rect(xs - 1, base - 1, xs, base, 'W')
    n.rect(xs, base - 2, xs + w, base, 'W')
    for x, c in ((xs, 'T'), (xs + 1, 'I'), (xs + w - 2, 'I'), (xs + w - 1, 'T')):  # un rang de caissons : on les saute
        n.set(x, base - 3, c)
    for x in range(xs + 2, xs + w - 2):
        n.set(x, base - 10, '=')
    echelle(n, xs + 3, 7, sol=base - 2)
    n.repere(xs + w // 2, '*', ymin=base - 11)
    # la foule de danseurs (du décor), une fois les caissons posés : elle ne se met ni dessus ni devant l'échelle
    k = 0
    for x in range(x0 + 2, xs - 2, 3):
        if pose(n, x, DANSEURS[k % len(DANSEURS)], base, ecart=3):
            k += 1
    # beaucoup de monde : un fêtard tous les cinq pas dans la fosse, sur l'estrade et sur le portique
    n.ennemis(x0 + 2, xs - 2, lettres, max(4, (xs - x0) // 5))
    n.ennemis(xs + 2, xs + w - 2, lettres, 3, ymin=base - 5)
    n.ennemis(xs + 3, xs + w - 3, lettres, 1, ymin=base - 12)
