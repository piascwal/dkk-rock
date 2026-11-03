import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Carte } from '../src/monde/carte';
import { NIVEAUX, niveauLu } from '../src/niveaux';
import { T, type Tuile } from '../src/monde/tuiles';
import { semeDecor } from '../src/rendu/decor';
import {
  CATEGORIES_THEME,
  PANNEAUX,
  reglagePanneaux,
  panneauxDuTheme,
  poseDesPanneaux,
  tuilesDuPanneau,
} from '../src/rendu/decor-panneaux';
import { ACCESSOIRES } from '../src/rendu/decor-objets';
import { SPRITES } from '../src/rendu/decor-sprites';
import { THEMES } from '../src/rendu/themes';

/** Une carte vide de `l` × `h` tuiles, avec le décor de la fonction `fait` (un bâtiment de béton, par exemple). */
function carte(l: number, h: number, fait: (c: Carte) => void): Carte {
  const c = new Carte(l, h);
  fait(c);
  return c;
}

/** Un bâtiment : de la colonne `x0` à `x1`, le dessus à la rangée `toit`, du béton jusqu'en bas de la carte. */
const batiment = (c: Carte, x0: number, x1: number, toit: number, matiere: Tuile = T.BETON) => {
  for (let x = x0; x <= x1; x++) for (let y = toit; y < c.hauteur; y++) c.pose(x, y, matiere);
};

// les panneaux ne sont posés qu'en mode essai : on le branche le temps de ces tests
beforeAll(() => {
  reglagePanneaux.actifs = true;
});
afterAll(() => {
  reglagePanneaux.actifs = false;
});

const libre = () => true;
const rien = () => {};
const panneaux = (c: Carte, theme: 'ville' | 'neige' = 'ville', graine = 1) =>
  poseDesPanneaux(c, theme, graine, libre, rien);

describe('les catégories des panneaux', () => {
  it('chaque monde a ses catégories, et chaque panneau est planté dans l’urbain', () => {
    for (const nom of Object.keys(THEMES)) expect(CATEGORIES_THEME, nom).toHaveProperty(nom);
    expect(PANNEAUX.find((p) => p.nom === 'panneauTotoPizz')?.categories).toContain('urbain');
  });

  it('le panneau de pizza va dans les mondes urbains, jamais dans ceux de neige ou de campagne', () => {
    for (const urbain of ['ville', 'newyork', 'club', 'limerick'] as const)
      expect(
        panneauxDuTheme(urbain).map((p) => p.nom),
        urbain,
      ).toContain('panneauTotoPizz');
    for (const autre of ['neige', 'montagne', 'foret', 'stc', 'plage'] as const)
      expect(panneauxDuTheme(autre), autre).toHaveLength(0);
  });

  it('un monde à plusieurs catégories reçoit les panneaux de chacune', () => {
    // Ottawa est à la fois urbain et neigeux : il reçoit les panneaux « urbain » et ceux de « neige »
    expect(CATEGORIES_THEME.ottawa).toEqual(expect.arrayContaining(['urbain', 'neige']));
    expect(panneauxDuTheme('ottawa').map((p) => p.nom)).toContain('panneauTotoPizz');
  });

  it('chaque panneau est un accessoire, dessiné par sa planche', () => {
    for (const p of PANNEAUX) {
      expect(p.nom in ACCESSOIRES, p.nom).toBe(true);
      expect(SPRITES.has(p.nom), p.nom).toBe(true);
    }
  });

  it('le panneau de pizza tient sur cinq tuiles de large', () => {
    expect(tuilesDuPanneau('panneauTotoPizz').largeur).toBe(5);
  });
});

describe('la pose des panneaux sur les toits', () => {
  // un grand immeuble de 30 tuiles de large, dont le toit est à la rangée 40 ; le ciel est libre au-dessus
  const immeuble = () =>
    carte(120, 60, (c) => {
      batiment(c, 20, 49, 40);
      batiment(c, 70, 99, 40);
    });

  it('pose des panneaux sur les toits plats, et seulement dessus', () => {
    let vus = 0;
    for (let graine = 1; graine <= 40; graine++) {
      for (const p of panneaux(immeuble(), 'ville', graine)) {
        vus++;
        expect(p.ty).toBe(40);
        expect(p.quoi).toBe('panneauTotoPizz');
        expect((p.tx >= 22 && p.tx <= 47) || (p.tx >= 72 && p.tx <= 97), `tx ${p.tx}`).toBe(true);
      }
    }
    expect(vus).toBeGreaterThan(10);
  });

  it('ne pose rien dans un monde sans panneau pour lui', () => {
    for (let graine = 1; graine <= 20; graine++)
      expect(panneaux(immeuble(), 'neige', graine)).toHaveLength(0);
  });

  it('ne pose rien sur le sol d’une plaine qui continue (pas de bord de toit)', () => {
    const plaine = carte(120, 60, (c) => batiment(c, 0, 119, 40));
    for (let graine = 1; graine <= 20; graine++) expect(panneaux(plaine, 'ville', graine)).toHaveLength(0);
  });

  it('ne pose rien sur la terre d’une colline : seul un toit (béton, brique, tuiles, métal) en porte', () => {
    const colline = carte(120, 60, (c) => batiment(c, 20, 49, 40, T.TERRE));
    for (let graine = 1; graine <= 20; graine++) expect(panneaux(colline, 'ville', graine)).toHaveLength(0);
  });

  it('un toit trop étroit n’en reçoit pas, et le panneau garde une marge de chaque côté', () => {
    const etroit = carte(120, 60, (c) => batiment(c, 20, 25, 40)); // 6 tuiles : le panneau en fait 5, plus deux marges
    for (let graine = 1; graine <= 20; graine++) expect(panneaux(etroit, 'ville', graine)).toHaveLength(0);
    for (let graine = 1; graine <= 40; graine++)
      for (const p of panneaux(immeuble(), 'ville', graine)) {
        const gauche = p.tx - 2;
        expect(gauche === 20 || gauche === 70 || gauche > 20, 'pas à plat sur le bord').toBe(true);
        expect(gauche >= 21 || (gauche >= 71 && gauche <= 94), `gauche ${gauche}`).toBe(true);
      }
  });

  it('ne pose pas un panneau dont le ciel est bouché (un plafond, un mur de fond)', () => {
    const couvert = carte(120, 60, (c) => {
      batiment(c, 20, 49, 40);
      for (let x = 20; x <= 49; x++) c.pose(x, 35, T.BETON); // une dalle trois tuiles au-dessus : pas la place
    });
    for (let graine = 1; graine <= 20; graine++) expect(panneaux(couvert, 'ville', graine)).toHaveLength(0);
  });

  it('évite une échelle qui monte sur le toit', () => {
    const avecEchelle = carte(120, 60, (c) => {
      batiment(c, 20, 59, 40);
      for (let y = 36; y < 40; y++) c.pose(40, y, T.ECHELLE);
    });
    for (let graine = 1; graine <= 60; graine++)
      for (const p of panneaux(avecEchelle, 'ville', graine))
        expect(Math.abs(p.tx - 40), `panneau trop près de l’échelle (tx ${p.tx})`).toBeGreaterThan(3);
  });

  it('deux panneaux d’un niveau sont toujours espacés', () => {
    const long = carte(400, 60, (c) => {
      for (let k = 0; k < 6; k++) batiment(c, 10 + k * 60, 55 + k * 60, 40);
    });
    for (let graine = 1; graine <= 20; graine++) {
      const xs = panneaux(long, 'ville', graine).map((p) => p.tx);
      for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(26);
    }
  });

  it('est stable : la même carte, la même graine, les mêmes panneaux', () => {
    expect(panneaux(immeuble(), 'ville', 7)).toEqual(panneaux(immeuble(), 'ville', 7));
  });

  it('réserve les cases du panneau : ce qu’on sème ensuite ne le recouvre pas', () => {
    const prises = new Set<string>();
    const poses = poseDesPanneaux(
      immeuble(),
      'ville',
      3,
      (x, y) => !prises.has(`${x},${y}`),
      (x, y) => prises.add(`${x},${y}`),
    );
    expect(poses.length).toBeGreaterThan(0);
    const { largeur, hauteur } = tuilesDuPanneau('panneauTotoPizz');
    expect(prises.size).toBe(poses.length * largeur * hauteur);
  });

  it('un panneau n’est posé sur aucun niveau dont le monde ne le veut pas, et le semis garde sa forme', () => {
    const c = immeuble();
    const poses = semeDecor(c, 'ville', 5);
    const toits = poses.filter((p) => p.quoi === 'panneauTotoPizz');
    expect(toits.length).toBeGreaterThan(0);
    for (const t of toits)
      expect(c.solide(t.tx, t.ty) && !c.solide(t.tx, t.ty - 1), 'posé sur un toit').toBe(true);
    expect(semeDecor(immeuble(), 'neige', 5).some((p) => p.quoi === 'panneauTotoPizz')).toBe(false);
  });
});

describe('les panneaux dans les vrais niveaux', () => {
  const semis = (i: number) => {
    const lu = niveauLu(i);
    const c = new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond);
    return { c, poses: semeDecor(c, NIVEAUX[i]!.theme, 11 + i, NIVEAUX[i]!.decor, NIVEAUX[i]!.semis) };
  };
  const urbains = NIVEAUX.flatMap((n, i) => (n.miniJeu || n.arene ? [] : [[n.id, i] as const]));

  it.each(urbains)(
    '%s : un panneau est sur un toit, jamais devant une échelle ni sur un autre accessoire',
    (_id, i) => {
      const { c, poses } = semis(i);
      const { largeur, hauteur } = tuilesDuPanneau('panneauTotoPizz');
      const pris = new Set<string>();
      for (const p of poses.filter((q) => q.quoi !== 'panneauTotoPizz'))
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = 1; dy <= 3; dy++) pris.add(`${p.tx + dx},${p.ty - dy}`);
      for (const p of poses.filter((q) => q.quoi === 'panneauTotoPizz')) {
        // le dessus d'une dalle (un piton compte : il se traverse) et rien de plein au-dessus
        expect(c.props(p.tx, p.ty).solide, `toit en ${p.tx},${p.ty}`).toBe(true);
        expect(c.solide(p.tx, p.ty - 1), `ciel en ${p.tx},${p.ty}`).toBe(false);
        for (let x = p.tx - (largeur - 1) / 2 - 1; x <= p.tx + (largeur - 1) / 2 + 1; x++)
          for (let y = p.ty - hauteur - 1; y < p.ty; y++) {
            expect(c.props(x, y).echelle, `échelle en ${x},${y}`).toBe(false);
            if (Math.abs(x - p.tx) <= (largeur - 1) / 2 && y >= p.ty - hauteur)
              expect(pris.has(`${x},${y}`), `accessoire sous le panneau en ${x},${y}`).toBe(false);
          }
      }
    },
  );

  it('les niveaux de la ville et de New York ont des panneaux, ceux de neige, de plage et de campagne n’en ont pas', () => {
    const n = (id: string) =>
      semis(NIVEAUX.findIndex((x) => x.id === id)).poses.filter((p) => p.quoi === 'panneauTotoPizz').length;
    expect(n('ville')).toBeGreaterThan(0);
    expect(n('newyork')).toBeGreaterThan(0);
    for (const id of ['cimes', 'alpages', 'plage', 'stc', 'foret', 'tuves']) expect(n(id), id).toBe(0);
  });

  it('sans le réglage d’essai, aucun panneau n’est posé nulle part', () => {
    reglagePanneaux.actifs = false;
    try {
      for (const [, i] of urbains)
        expect(semis(i).poses.some((p) => p.quoi === 'panneauTotoPizz')).toBe(false);
    } finally {
      reglagePanneaux.actifs = true;
    }
  });
});
