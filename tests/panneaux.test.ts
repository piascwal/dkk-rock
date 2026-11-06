import { describe, expect, it } from 'vitest';
import { Carte } from '../src/monde/carte';
import { T, type Tuile } from '../src/monde/tuiles';
import { semeDecor } from '../src/rendu/decor';
import { ACCESSOIRES } from '../src/rendu/decor-objets';
import { NOMS_PANNEAUX, PANNEAUX, poseDesPanneaux, tuilesDuPanneau } from '../src/rendu/decor-panneaux';
import { SPRITES } from '../src/rendu/decor-sprites';

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

const libre = () => true;
const rien = () => {};
const panneaux = (c: Carte, graine = 1) => poseDesPanneaux(c, graine, libre, rien);

/** Une rue de bâtiments de `n` toits de 30 tuiles, espacés de 10 : de quoi poser plusieurs panneaux. */
const rue = (n = 8) =>
  carte(40 * n + 20, 60, (c) => {
    for (let k = 0; k < n; k++) batiment(c, 10 + k * 40, 39 + k * 40, 40);
  });

describe('les panneaux', () => {
  it('chaque panneau est un accessoire, dessiné par sa planche, sur une largeur impaire de tuiles', () => {
    for (const nom of NOMS_PANNEAUX) {
      expect(nom in ACCESSOIRES, nom).toBe(true);
      expect(SPRITES.has(nom), nom).toBe(true);
      expect(tuilesDuPanneau(nom).largeur % 2, `${nom} : largeur impaire`).toBe(1);
      expect(tuilesDuPanneau(nom).hauteur, nom).toBeGreaterThan(2);
    }
  });

  it('les deux « Vermi-fin » vont ensemble : la suite de « Ma vie a changé » est « Pour ceux qui ne le savent pas »', () => {
    expect(PANNEAUX.find((p) => p.nom === 'panneauVermiVie')?.suite).toBe('panneauVermiSavent');
    expect(PANNEAUX.some((p) => p.nom === 'panneauVermiSavent')).toBe(false); // jamais tiré seul
  });

  it('il y a de quoi choisir : au moins cinq panneaux, aucun lié à un type de niveau', () => {
    expect(PANNEAUX.length).toBeGreaterThanOrEqual(5);
    expect(PANNEAUX.every((p) => !('categories' in p))).toBe(true);
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
      for (const p of panneaux(immeuble(), graine)) {
        vus++;
        expect(p.ty).toBe(40);
        expect(NOMS_PANNEAUX).toContain(p.quoi);
        expect((p.tx >= 22 && p.tx <= 47) || (p.tx >= 72 && p.tx <= 97), `tx ${p.tx}`).toBe(true);
      }
    }
    expect(vus).toBeGreaterThan(10);
  });

  it('pose des panneaux sur une longue ligne droite et plate, même de terre, sans bord de toit', () => {
    let vus = 0;
    for (const matiere of [T.BETON, T.TERRE, T.NEIGE]) {
      const plaine = carte(160, 60, (c) => batiment(c, 0, 159, 40, matiere));
      for (let graine = 1; graine <= 20; graine++)
        for (const p of panneaux(plaine, graine)) {
          vus++;
          expect(p.ty).toBe(40);
        }
    }
    expect(vus).toBeGreaterThan(10);
  });

  it('ne pose rien sur une plaine courte ni sur la terre d’une colline : un sol court n’est pas un toit', () => {
    const courte = carte(120, 60, (c) => batiment(c, 0, 119, 40)); // 118 tuiles : assez longue
    expect([1, 2, 3, 4, 5].some((g) => panneaux(courte, g).length > 0)).toBe(true);
    const colline = carte(120, 60, (c) => batiment(c, 20, 49, 40, T.TERRE)); // 30 tuiles seulement
    for (let graine = 1; graine <= 20; graine++) expect(panneaux(colline, graine)).toHaveLength(0);
  });

  it('un toit trop étroit n’en reçoit pas', () => {
    const etroit = carte(120, 60, (c) => batiment(c, 20, 25, 40)); // 6 tuiles : un panneau en demande cinq, plus deux marges
    for (let graine = 1; graine <= 20; graine++) expect(panneaux(etroit, graine)).toHaveLength(0);
  });

  it('un panneau garde une marge sur chaque bord de toit', () => {
    for (let graine = 1; graine <= 40; graine++)
      for (const p of panneaux(immeuble(), graine)) {
        const { largeur } = tuilesDuPanneau(p.quoi);
        const gauche = p.tx - (largeur - 1) / 2;
        const droite = gauche + largeur - 1;
        const dans = (x0: number, x1: number) => gauche >= x0 + 1 && droite <= x1 - 1;
        expect(dans(20, 49) || dans(70, 99), `panneau ${p.quoi} sur ${gauche}-${droite}`).toBe(true);
      }
  });

  it('ne pose pas un panneau dont le ciel est bouché (un plafond, un mur de fond)', () => {
    const couvert = carte(120, 60, (c) => {
      batiment(c, 20, 49, 40);
      for (let x = 20; x <= 49; x++) c.pose(x, 38, T.BETON); // une dalle deux tuiles au-dessus : aucun panneau n'y tient
    });
    for (let graine = 1; graine <= 20; graine++) expect(panneaux(couvert, graine)).toHaveLength(0);
  });

  it('évite une échelle qui monte sur le toit', () => {
    const avecEchelle = carte(120, 60, (c) => {
      batiment(c, 20, 59, 40);
      for (let y = 30; y < 40; y++) c.pose(40, y, T.ECHELLE);
    });
    for (let graine = 1; graine <= 60; graine++)
      for (const p of panneaux(avecEchelle, graine)) {
        const { largeur } = tuilesDuPanneau(p.quoi);
        expect(Math.abs(p.tx - 40), `panneau trop près de l’échelle (tx ${p.tx})`).toBeGreaterThan(
          (largeur - 1) / 2 + 1,
        );
      }
  });

  it('espace les panneaux d’un niveau (sauf un panneau et sa suite)', () => {
    for (let graine = 1; graine <= 20; graine++) {
      const liste = panneaux(rue(), graine);
      for (let i = 1; i < liste.length; i++) {
        const [a, b] = [liste[i - 1]!, liste[i]!];
        if (PANNEAUX.some((p) => p.nom === a.quoi && p.suite === b.quoi)) continue;
        expect(b.tx - a.tx).toBeGreaterThanOrEqual(26);
      }
    }
  });

  it('est stable : la même carte, la même graine, les mêmes panneaux', () => {
    expect(panneaux(rue(), 7)).toEqual(panneaux(rue(), 7));
  });

  it('ne recouvre jamais un autre panneau : leurs cases sont réservées une seule fois', () => {
    for (let graine = 1; graine <= 20; graine++) {
      const prises = new Set<string>();
      const poses = poseDesPanneaux(
        rue(),
        graine,
        (x, y) => !prises.has(`${x},${y}`),
        (x, y) => {
          expect(prises.has(`${x},${y}`), `case ${x},${y} prise deux fois`).toBe(false);
          prises.add(`${x},${y}`);
        },
      );
      const cases = poses.reduce(
        (n, p) => n + tuilesDuPanneau(p.quoi).largeur * tuilesDuPanneau(p.quoi).hauteur,
        0,
      );
      expect(prises.size).toBe(cases);
    }
  });

  it('chacun passe une fois avant que l’un se répète', () => {
    let longueurs = 0;
    for (let graine = 1; graine <= 30; graine++) {
      const noms = panneaux(rue(10), graine)
        .map((p) => p.quoi as string)
        .filter((n) => n !== 'panneauVermiSavent');
      const premiers = noms.slice(0, PANNEAUX.length);
      expect(new Set(premiers).size, `${premiers}`).toBe(premiers.length);
      longueurs += noms.length;
    }
    expect(longueurs).toBeGreaterThan(60);
  });

  it('un panneau et sa suite : toujours ensemble, la suite à droite, près du premier', () => {
    let paires = 0;
    for (let graine = 1; graine <= 60; graine++) {
      const liste = panneaux(rue(), graine);
      const vie = liste.filter((p) => p.quoi === 'panneauVermiVie');
      const savent = liste.filter((p) => p.quoi === 'panneauVermiSavent');
      expect(savent.length, `graine ${graine}`).toBe(vie.length);
      vie.forEach((a, i) => {
        const b = savent[i]!;
        expect(b.tx).toBeGreaterThan(a.tx);
        expect(b.tx - a.tx).toBeLessThanOrEqual(40);
        paires++;
      });
    }
    expect(paires).toBeGreaterThan(5);
  });

  it('une suite sans place n’est pas posée seule : le premier non plus', () => {
    // un seul toit, assez large pour un panneau mais pas pour deux : « Ma vie a changé » ne peut pas être suivi
    const seul = carte(80, 60, (c) => batiment(c, 20, 30, 40));
    for (let graine = 1; graine <= 80; graine++) {
      const liste = poseDesPanneaux(seul, graine, libre, rien);
      expect(liste.filter((p) => p.quoi === 'panneauVermiVie')).toHaveLength(0);
      expect(liste.filter((p) => p.quoi === 'panneauVermiSavent')).toHaveLength(0);
    }
  });

  it('le semis du décor les pose sur les toits, dans tous les mondes', () => {
    for (const theme of ['ville', 'neige', 'foret', 'port'] as const) {
      const c = rue();
      const toits = semeDecor(c, theme, 5).filter((p) => NOMS_PANNEAUX.includes(p.quoi));
      expect(toits.length, theme).toBeGreaterThan(0);
      for (const t of toits)
        expect(c.solide(t.tx, t.ty) && !c.solide(t.tx, t.ty - 1), 'posé sur un toit').toBe(true);
    }
  });
});
