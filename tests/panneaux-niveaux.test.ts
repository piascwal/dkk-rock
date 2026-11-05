import { describe, expect, it } from 'vitest';
import { Carte } from '../src/monde/carte';
import { NIVEAUX, niveauLu } from '../src/niveaux';
import { semeDecor } from '../src/rendu/decor';
import { NOMS_PANNEAUX, tuilesDuPanneau } from '../src/rendu/decor-panneaux';

describe('les panneaux dans les vrais niveaux', () => {
  const semis = (i: number) => {
    const lu = niveauLu(i);
    const c = new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond);
    return { c, poses: semeDecor(c, NIVEAUX[i]!.theme, 11 + i, NIVEAUX[i]!.decor, NIVEAUX[i]!.semis) };
  };
  const niveaux = NIVEAUX.flatMap((n, i) => (n.miniJeu || n.arene ? [] : [[n.id, i] as const]));

  it.each(niveaux)(
    '%s : un panneau est sur un toit, jamais devant une échelle ni sur un autre accessoire',
    (_id, i) => {
      const { c, poses } = semis(i);
      const pris = new Set<string>();
      for (const p of poses.filter((q) => !NOMS_PANNEAUX.includes(q.quoi)))
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = 1; dy <= 3; dy++) pris.add(`${p.tx + dx},${p.ty - dy}`);
      for (const p of poses.filter((q) => NOMS_PANNEAUX.includes(q.quoi))) {
        const { largeur, hauteur } = tuilesDuPanneau(p.quoi);
        // le dessus d'une dalle (un piton compte : il se traverse) et rien de plein au-dessus
        expect(c.props(p.tx, p.ty).solide, `toit en ${p.tx},${p.ty}`).toBe(true);
        expect(c.solide(p.tx, p.ty - 1), `ciel en ${p.tx},${p.ty}`).toBe(false);
        for (let x = p.tx - (largeur - 1) / 2 - 1; x <= p.tx + (largeur - 1) / 2 + 1; x++)
          for (let y = p.ty - hauteur; y < p.ty; y++) {
            expect(c.props(x, y).echelle, `échelle en ${x},${y}`).toBe(false);
            if (Math.abs(x - p.tx) <= (largeur - 1) / 2 && y >= p.ty - hauteur)
              expect(pris.has(`${x},${y}`), `accessoire sous le panneau en ${x},${y}`).toBe(false);
          }
      }
    },
  );

  it('la Ville, New York et Limerick ont des panneaux, et les deux « Vermi-fin » vont toujours par deux', () => {
    const nombre = (id: string, nom?: string) =>
      semis(NIVEAUX.findIndex((x) => x.id === id)).poses.filter((p) =>
        nom ? p.quoi === nom : NOMS_PANNEAUX.includes(p.quoi),
      ).length;
    for (const id of ['ville', 'newyork', 'limerick']) expect(nombre(id), id).toBeGreaterThan(0);
    for (const [id] of niveaux)
      expect(nombre(id, 'panneauVermiVie'), id).toBe(nombre(id, 'panneauVermiSavent'));
  });
});
