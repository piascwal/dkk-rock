import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { NIVEAU_DRIFT } from '../src/jeu/drift';
import { lanceDrift } from '../src/jeu/drift-partie';
import { Pelouse, marqueVoiture } from '../src/jeu/drift-pelouse';
import { Voiture } from '../src/jeu/drift-voiture';
import { Partie } from '../src/jeu/partie';
import { NIVEAUX } from '../src/niveaux';
import { suivantDansMonde } from '../src/niveaux/arcs';
import { decodeEtat, encodeEtat } from '../src/reseau/protocole';

/** Une partie au pré du Clos, deux joueurs, son intro lue : le concours commence. */
function auPreDuClos(): Partie {
  const p = new Partie({ niveau: NIVEAU_DRIFT, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  p.ajouteJoueur(1, 1);
  while (p.phase === 'histoire') p.suivant();
  return p;
}

/** Fait avancer la partie de `n` pas, le siège `siege` tenant `bits` (un appui : un pas tenu, puis relâché). */
function pas(p: Partie, n: number, siege = 0, bits = 0): void {
  for (let i = 0; i < n; i++) {
    p.commande(siege, bits);
    p.avance();
    p.releveEvenements();
  }
}

const appuie = (p: Partie, siege: number, bits: number) => {
  pas(p, 1, siege, bits);
  pas(p, 1, siege, 0);
};

describe('le concours de drift du pré du Clos', () => {
  it('la voiture qui part en travers laboure la pelouse ; en ligne droite, elle la laisse', () => {
    const v = new Voiture();
    const pelouse = new Pelouse();
    const roule = (n: number, volant: number, freinAMain: boolean) => {
      for (let i = 0; i < n; i++) {
        const avant = v.pose();
        v.avance({ gaz: true, frein: false, volant, freinAMain });
        marqueVoiture(pelouse, avant, v.pose(), v.griffe);
      }
    };
    roule(45, 0, false);
    const depart = pelouse.pourcent; // le démarrage patine un peu
    roule(60, 0, false);
    expect(pelouse.pourcent).toBe(depart); // lancée, en ligne droite : rien
    expect(v.vitesse).toBeGreaterThan(8);
    roule(90, 1, true); // braqué, frein à main : elle part en travers
    expect(Math.abs(v.glisse)).toBeGreaterThan(2);
    expect(pelouse.pourcent).toBeGreaterThan(depart + 0.3);
  });

  it('vient après le pont des Tuves, avant la route des Alpes', () => {
    const tuves = NIVEAUX.findIndex((n) => n.id === 'tuves');
    expect(suivantDansMonde(0)).toBe(tuves);
    expect(suivantDansMonde(tuves)).toBe(NIVEAU_DRIFT);
    expect(suivantDansMonde(NIVEAU_DRIFT)).toBe(1);
  });

  it('au pré du Clos : chaque joueur conduit une minute, puis le podium ; le niveau est fait, en route', () => {
    const p = auPreDuClos();
    const progres: [number, boolean, number | undefined][] = [];
    p.onProgression = (prog, fini, niveauFini) => progres.push([prog.niveau, fini, niveauFini]);
    expect(p.phase).toBe('drift');
    expect(p.vue().drift?.etape).toBe('choix');
    // le premier joueur prend Matt et part
    appuie(p, 0, C.DROITE);
    expect(p.vue().drift?.pilote).toBe(1);
    appuie(p, 0, C.SAUT);
    expect(p.vue().drift?.etape).toBe('compte');
    pas(p, 180);
    expect(p.vue().drift?.etape).toBe('course');
    // une minute de cercles au frein à main
    for (let t = 0; t < 3600; t++) pas(p, 1, 0, C.HAUT | C.DROITE | (t % 120 < 40 ? C.TIR : 0));
    const d = p.vue().drift!;
    expect(d.etape).toBe('resultat');
    expect(d.scores[0]?.pilote).toBe(1);
    expect(d.scores[0]!.pourcent).toBeGreaterThan(3);
    // au tour du second joueur : ses appuis comptent, plus ceux du premier
    pas(p, 300);
    expect(p.vue().drift?.etape).toBe('choix');
    expect(p.vue().drift?.siege).toBe(1);
    appuie(p, 0, C.SAUT);
    expect(p.vue().drift?.etape).toBe('choix');
    appuie(p, 1, C.SAUT);
    pas(p, 180 + 3600 + 300);
    expect(p.vue().drift?.etape).toBe('podium');
    pas(p, 60);
    appuie(p, 1, C.TIR);
    expect(p.phase).toBe('carte');
    expect(p.drift).toBeNull();
    expect(progres).toEqual([[1, true, NIVEAU_DRIFT]]);
  });

  it('lancé depuis le menu des mini-jeux, le podium relance un concours', () => {
    const p = new Partie({ niveau: NIVEAU_DRIFT, drapeau: -1, vies: VIES_DEPART, score: 0 });
    p.ajouteJoueur(0, 0);
    lanceDrift(p, true);
    appuie(p, 0, C.SAUT);
    pas(p, 180 + 3600 + 300 + 60);
    expect(p.vue().drift?.etape).toBe('podium');
    appuie(p, 0, C.SAUT);
    expect(p.phase).toBe('drift');
    expect(p.vue().drift?.etape).toBe('choix');
    expect(p.vue().drift?.scores.every((s) => s === null)).toBe(true);
  });

  it('le concours traverse le réseau', () => {
    const p = auPreDuClos();
    appuie(p, 0, C.SAUT);
    pas(p, 180);
    for (let t = 0; t < 200; t++) pas(p, 1, 0, C.HAUT | C.GAUCHE | C.TIR);
    const v = p.vue();
    const lu = decodeEtat(encodeEtat(v))!;
    expect(lu.phase).toBe('drift');
    const a = v.drift!;
    const b = lu.drift!;
    expect(b.etape).toBe(a.etape);
    expect(b.siege).toBe(a.siege);
    expect(b.manche).toBe(a.manche);
    expect(b.minuteur).toBe(a.minuteur);
    expect(b.griffe).toBe(a.griffe);
    expect(b.x).toBeCloseTo(a.x, 1);
    expect(b.y).toBeCloseTo(a.y, 1);
    expect(Math.cos(b.cap)).toBeCloseTo(Math.cos(a.cap), 3);
    expect(b.pourcent).toBeCloseTo(a.pourcent, 1);
    // hors du concours, pas de bloc drift
    expect(
      decodeEtat(encodeEtat(new Partie({ niveau: 0, drapeau: -1, vies: 5, score: 0 }).vue()))?.drift,
    ).toBeUndefined();
  });
});
