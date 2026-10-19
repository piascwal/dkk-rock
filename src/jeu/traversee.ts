import { TUILE } from '../config';
import { ENNEMIS_PAR_LETTRE } from '../entites/ennemis/definitions';
import { Ennemi } from '../entites/ennemis/ennemi';
import { T, type Tuile } from '../monde/tuiles';
import type { Repere } from '../niveaux/format';
import type { Cible } from './contexte';
import type { Partie } from './partie';

/**
 * La traversée en ferry (fin du niveau du port, voir outils/niveaux/ferry.py). Une fois tous les héros à bord (repère `&` de la
 * carte), le pont se ferme derrière eux et des vagues montent à l'abordage par les deux côtés : marins, bigoudènes, goélands.
 * La porte du pont s'ouvre quand la dernière vague est vaincue, sur le van. Le monde, lui, ne bouge pas : la vue transporte le
 * temps de traversée (`EtatVue.traversee`) et le rendu fait défiler le fond, comme si le ferry avançait.
 */

/** La porte du pont, en tuiles à droite du repère d'embarquement ; l'arène va du repère à elle. */
const PORTE = 19;
/** Hauteur des murs qui ferment le pont, en tuiles. */
const MUR = 7;
/** Les vagues : première vague, puis le délai entre deux vagues (images) ; un pont vide les fait venir plus vite. */
const PREMIERE = 150;
const INTERVALLE = 600;
const MINIMUM = 180;

type Cote = 'gauche' | 'droite';

/** Chaque vague : (lettre de l'ennemi, côté par où il monte à bord). m marin, h bigoudène, g goéland. */
const VAGUES: readonly (readonly [string, Cote][])[] = [
  [
    ['m', 'gauche'],
    ['m', 'gauche'],
  ],
  [
    ['h', 'droite'],
    ['h', 'droite'],
  ],
  [
    ['m', 'gauche'],
    ['h', 'droite'],
    ['g', 'droite'],
  ],
  [
    ['m', 'gauche'],
    ['m', 'droite'],
    ['g', 'gauche'],
    ['g', 'droite'],
  ],
  [
    ['h', 'gauche'],
    ['h', 'droite'],
    ['m', 'gauche'],
    ['m', 'droite'],
    ['g', 'droite'],
  ],
];

export class Traversee {
  /** images écoulées depuis l'embarquement */
  horloge = 0;
  /** images avant la prochaine vague */
  avant = PREMIERE;
  vague = 0;
  readonly ennemis: Ennemi[] = [];
  /** l'horloge à l'arrivée du ferry (la porte s'ouvre, le fond cesse de défiler), ou -1 en route */
  arrivee = -1;

  constructor(readonly embarquement: Repere) {}

  /** Le temps de traversée que montre la vue : il s'arrête à l'arrivée. */
  get sillage(): number {
    return this.arrivee >= 0 ? this.arrivee : this.horloge;
  }

  /** Le point d'apparition d'un héros qui revient à bord, au pied du pont. */
  get pointApparition(): [number, number] {
    return [this.embarquement.x + 3 * TUILE, this.embarquement.y];
  }
}

/** Pose ou retire une colonne de socle indestructible, de `MUR` tuiles de haut, au-dessus du pont. */
function colonne(p: Partie, tx: number, ty: number, t: Tuile): void {
  for (let y = ty - MUR + 1; y <= ty; y++) p.carte.pose(tx, y, t);
}

/** À chaque chargement de niveau : la porte du pont est fermée (elle s'ouvre à l'arrivée). */
export function prepareTraversee(p: Partie): void {
  p.traversee = null;
  const emb = p.lu.embarquement;
  if (emb) colonne(p, emb.tx + PORTE, emb.ty, T.SOCLE);
}

function lanceVague(p: Partie, t: Traversee): void {
  const emb = t.embarquement;
  const vague = VAGUES[t.vague++]!;
  p.texte(emb.x + (PORTE / 2) * TUILE, emb.y - 40, `Vague ${t.vague}/${VAGUES.length}`, '#ffd23f');
  vague.forEach(([lettre, cote], i) => {
    const def = ENNEMIS_PAR_LETTRE[lettre]!;
    const bord = cote === 'gauche' ? 1.5 + (i % 3) * 0.7 : PORTE - 2.5 - (i % 3) * 0.7;
    // les goélands arrivent du ciel, les autres montent à bord au niveau du pont
    const e = new Ennemi(p, def, emb.x + bord * TUILE, lettre === 'g' ? emb.y - 60 : emb.y);
    t.ennemis.push(e);
    p.ajoute(e);
    p.son('alerte', e.cx, e.cy);
  });
}

/** Le plus proche des héros vivants, ou null. */
function procheHeros(p: Partie, x: number): Cible | null {
  let mieux: Cible | null = null;
  for (const h of p.heros()) if (!mieux || Math.abs(h.x - x) < Math.abs(mieux.x - x)) mieux = h;
  return mieux;
}

/** Un pas de la traversée : embarquement, vagues, arrivée. */
export function majTraversee(p: Partie): void {
  const emb = p.lu.embarquement;
  if (!emb) return;
  let t = p.traversee;
  if (!t) {
    const aBord = p.joueurs.filter((j) => j && !j.mort);
    // le ferry n'appareille que quand tous les héros vivants sont montés à bord
    if (!aBord.length || !aBord.every((j) => j!.corps.x > emb.x + 2 * TUILE)) return;
    t = p.traversee = new Traversee(emb);
    colonne(p, emb.tx - 1, emb.ty, T.SOCLE);
    p.evenement({ k: 'bulle', qui: 'NARRATEUR', texte: 'Le ferry appareille. Tenez le pont !' });
    return;
  }
  t.horloge++;
  if (t.arrivee >= 0) return;
  const vivants = t.ennemis.filter((e) => e.vivant());
  // à l'abordage : chaque assaillant ne lâche jamais le héros le plus proche (sinon il flânerait sur le pont)
  for (const e of vivants) {
    const cible = procheHeros(p, e.cx);
    if (!cible) continue;
    e.cible = cible;
    e.etat = 'attaque';
    e.vuA = p.tick;
  }
  if (t.vague < VAGUES.length) {
    // un pont vide fait venir la vague suivante plus tôt
    if (!vivants.length) t.avant = Math.min(t.avant, MINIMUM);
    if (--t.avant <= 0) {
      lanceVague(p, t);
      t.avant = INTERVALLE;
    }
    return;
  }
  if (vivants.length) return;
  t.arrivee = t.horloge;
  colonne(p, emb.tx + PORTE, emb.ty, T.VIDE);
  p.son('victoire', emb.x, emb.y);
  p.evenement({ k: 'bulle', qui: 'NARRATEUR', texte: 'Groix en vue ! La porte du pont est ouverte.' });
}
