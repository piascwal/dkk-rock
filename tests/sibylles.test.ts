import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Objet } from '../src/entites/objets';
import { Partie } from '../src/jeu/partie';
import { partieSauvegardee } from '../src/jeu/partie-sauvegardee';
import { SAUVEGARDE_VIDE, valideSauvegarde, type Sauvegarde } from '../src/jeu/sauvegarde';
import { compteSibylles, type Carnet } from '../src/jeu/sibylles';
import { T, proprietes } from '../src/monde/tuiles';
import { NIVEAUX, niveauLu } from '../src/niveaux';
import { accessibles } from '../src/niveaux/accessibilite';
import { cachettes, cachettesDuNiveau, detourDuTrace } from '../src/niveaux/cachettes';
import { decodeEtat, encodeEtat } from '../src/reseau/protocole';

const STC = NIVEAUX.findIndex((n) => n.id === 'stc');

const enJeu = (p: Partie) => {
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};
const cartesPosees = (p: Partie) =>
  p.entites.filter((e): e is Objet => e instanceof Objet && e.sorte === 'sibylle');
/** Pose le héros sur la carte, et avance d'un pas : il la touche. */
const prend = (p: Partie, o: Objet) => {
  const j = p.joueurs[0]!;
  j.corps.x = o.corps.x;
  j.corps.y = o.corps.y + o.corps.h - j.corps.h;
  p.avance();
};

describe('les cachettes des cartes Sibylle', () => {
  it.each(NIVEAUX.map((n, i) => [n.id, i] as const))(
    '%s : des cartes partout sauf dans les mini-jeux',
    (_id, i) => {
      const c = cachettesDuNiveau(i);
      if (NIVEAUX[i]!.miniJeu) expect(c).toEqual([]);
      else expect(c.length).toBeGreaterThanOrEqual(2);
    },
  );

  it('chaque carte se prend sans rien casser, posée au sol, hors de l’eau, loin des tonneaux, cages et armes', () => {
    NIVEAUX.forEach((_n, i) => {
      const lu = niveauLu(i);
      const acces = accessibles(lu);
      const reperes = [...lu.cages, ...lu.armes, ...lu.soins, ...lu.barils, ...lu.drapeaux];
      lu.tuiles.forEach((t, k) => {
        if (t === T.TONNEAU_WOG || t === T.TONNEAU_OR)
          reperes.push({ tx: k % lu.largeur, ty: Math.floor(k / lu.largeur), x: 0, y: 0 });
      });
      for (const c of cachettesDuNiveau(i)) {
        const ici = `${lu.def.id} ${c.tx},${c.ty}`;
        expect(acces[c.ty * lu.largeur + c.tx], ici).toBe(1);
        expect(proprietes(lu.tuiles[(c.ty + 1) * lu.largeur + c.tx]!).solide, ici).toBe(true);
        expect(lu.tuiles[c.ty * lu.largeur + c.tx], ici).not.toBe(T.EAU);
        for (const r of reperes)
          expect(Math.abs(r.tx - c.tx) > 6 || Math.abs(r.ty - c.ty) > 3, ici).toBe(true);
      }
    });
  });

  it('assez nombreuses, et à l’écart du chemin direct (hors le ferry, tout plat, et le parc du FISE, tout en plaine)', () => {
    expect(cachettesDuNiveau(STC).length).toBeGreaterThanOrEqual(25);
    NIVEAUX.forEach((n, i) => {
      if (n.miniJeu || n.id === 'ferry' || n.id === 'fise') return;
      const lu = niveauLu(i);
      const detour = detourDuTrace(lu);
      const cartes = cachettesDuNiveau(i);
      expect(cartes.length, n.id).toBeGreaterThanOrEqual(10);
      // aucune carte sur le chemin ni à côté : il faut quitter le tracé de quelques gestes
      for (const c of cartes)
        expect(detour[c.ty * lu.largeur + c.tx], `${n.id} ${c.tx},${c.ty}`).toBeGreaterThanOrEqual(4);
    });
  });

  it('dans les forteresses (étages et toits) comme au fond des caves, au premier niveau', () => {
    const cartes = cachettesDuNiveau(STC);
    expect(cartes.filter((c) => c.ty <= 25).length).toBeGreaterThanOrEqual(8);
    expect(cartes.filter((c) => c.ty >= 31).length).toBeGreaterThanOrEqual(5);
  });

  it('toujours les mêmes, et réparties sur tout le niveau', () => {
    const lu = niveauLu(STC);
    const c = cachettes(lu);
    expect(cachettes(lu)).toEqual(c);
    for (let k = 1; k < c.length; k++)
      expect(Math.hypot(c[k]!.tx - c[k - 1]!.tx, (c[k]!.ty - c[k - 1]!.ty) * 2)).toBeGreaterThanOrEqual(8);
    expect(c[c.length - 1]!.tx - c[0]!.tx).toBeGreaterThan(lu.largeur / 2);
  });
});

describe('les cartes Sibylle dans la partie', () => {
  it('une carte prise est acquise : la sauvegarde la retient, l’écran la compte', () => {
    const prises: [number, number][] = [];
    const carnet: Carnet = { acquises: () => [], prise: (n, c) => prises.push([n, c]) };
    const p = enJeu(new Partie({ niveau: STC, drapeau: -1, vies: VIES_DEPART, score: 0 }, carnet));
    const total = cachettesDuNiveau(STC).length;
    expect(cartesPosees(p)).toHaveLength(total);
    const o = cartesPosees(p)[2]!;
    const score = p.score;
    prend(p, o);
    expect(prises).toEqual([[STC, 2]]);
    expect(p.score).toBe(score + 250);
    expect(cartesPosees(p)).toHaveLength(total - 1);
    expect(p.vue().sibylles).toEqual([1, total]);
  });

  it('une carte déjà acquise ne revient plus : ni au chargement, ni en recommençant le niveau', () => {
    const s: Sauvegarde = structuredClone(SAUVEGARDE_VIDE);
    const p = enJeu(
      partieSauvegardee({ niveau: STC, drapeau: -1, vies: VIES_DEPART, score: 0 }, s, () => {}),
    );
    const total = cachettesDuNiveau(STC).length;
    prend(p, cartesPosees(p)[0]!);
    prend(p, cartesPosees(p)[0]!);
    expect(s.sibylles.stc).toEqual([0, 1]);
    expect(compteSibylles(s, STC)).toEqual([2, total]);
    p.recommence(true);
    expect(cartesPosees(p).map((o) => o.variante)).not.toContain(0);
    expect(cartesPosees(p)).toHaveLength(total - 2);
    const autre = partieSauvegardee({ niveau: STC, drapeau: -1, vies: VIES_DEPART, score: 0 }, s, () => {});
    expect(cartesPosees(autre)).toHaveLength(total - 2);
    expect(autre.vue().sibylles).toEqual([2, total]);
  });

  it('la carte lévite : elle ne tombe pas si on casse le sol dessous', () => {
    const p = enJeu(new Partie({ niveau: STC, drapeau: -1, vies: VIES_DEPART, score: 0 }));
    const o = cartesPosees(p)[0]!;
    const y = o.corps.y;
    const r = cachettesDuNiveau(STC)[0]!;
    p.carte.pose(r.tx, r.ty + 1, T.VIDE);
    for (let i = 0; i < 30; i++) o.maj(p);
    expect(o.corps.y).toBe(y);
  });
});

describe('la sauvegarde et le réseau', () => {
  it('relit les cartes acquises, et ignore ce qui est abîmé', () => {
    const s = valideSauvegarde(
      { sibylles: { stc: [0, 3, 3, -1, 'x', 2.5], ville: 'non', club: [] } },
      NIVEAUX.length,
    );
    expect(s.sibylles).toEqual({ stc: [0, 3], club: [] });
    expect(valideSauvegarde({ sibylles: 4 }, NIVEAUX.length).sibylles).toEqual({});
  });

  it('le compte des cartes passe le réseau', () => {
    const p = enJeu(new Partie({ niveau: STC, drapeau: -1, vies: VIES_DEPART, score: 0 }));
    const v = p.vue();
    v.sibylles = [3, 12];
    expect(decodeEtat(encodeEtat(v))!.sibylles).toEqual([3, 12]);
  });
});

describe('l’histoire', () => {
  it('Mat cherche sa Sibylle, JBM se fixe pour objectif de les récupérer toutes (intro du premier niveau)', () => {
    const intro = NIVEAUX[STC]!.intro;
    const k = intro.findIndex((r) => r.qui === 'MAT' && r.texte.includes('Sibylle des fontaines'));
    expect(k).toBeGreaterThan(0);
    expect(intro[k + 1]!.qui).toBe('JBM');
    expect(intro[k + 1]!.texte).toMatch(/toutes les Sibylles des fontaines du monde/);
  });
});
