import { HEROS_HAUTEUR, TUILE } from '../config';
import { ENNEMIS_PAR_LETTRE } from '../entites/ennemis/definitions';
import { Ennemi } from '../entites/ennemis/ennemi';
import { Kiwi } from '../entites/kiwi';
import { Objet } from '../entites/objets';
import { codeEtape, geometrieNavire, NAVIRE, type Etape, type GeometrieNavire } from '../niveaux/navire';
import type { Cible } from './contexte';
import type { Partie } from './partie';

/**
 * La traversée en ferry (niveau « La Traversée », entre le port et Groix ; la carte : outils/niveaux/ferry.py). Le niveau se
 * joue en étapes : le van monte à bord par la rampe arrière et se gare (les héros sont dedans), la rampe se relève, les héros
 * descendent, le ferry appareille ; des vagues montent à l'abordage par les deux côtés ; la dernière vaincue, le ferry accoste à
 * Groix, la rampe avant s'abaisse et le van redescend tout seul. Le monde, lui, ne bouge pas : la vue transporte l'étape et le
 * chemin parcouru, le rendu fait glisser les quais, défiler le fond et tanguer le navire (rendu/navire.ts).
 */

/** La durée des étapes scénarisées, en images (la montée dure le temps que le van se gare, la traversée celui des vagues). */
const DUREES: Partial<Record<Etape, number>> = {
  rampe: 50,
  appareillage: 150,
  accostage: 210,
  debarquement: 50,
};
/** Le van, en montant à bord puis en descendant à Groix : sa vitesse de croisière (px par image). */
const VITESSE_VAN = 2;
const VITESSE_SORTIE = 2.5;

/** Les vagues : la première, puis le délai entre deux (images) ; un pont vide fait venir la suivante plus tôt. */
const PREMIERE = 120;
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
  etape: Etape = 'montee';
  /** images depuis le début de l'étape */
  t = 0;
  /** le chemin parcouru par le ferry, et sa vitesse de 0 (à quai) à 1 (en mer) */
  sillage = 0;
  vitesse = 0;
  vague = 0;
  avant = PREMIERE;
  readonly ennemis: Ennemi[] = [];

  constructor(
    readonly g: GeometrieNavire,
    readonly van: Objet | null,
  ) {}

  /** L'avancement de l'étape, de 0 à 1 (0 pour les étapes sans durée fixe). */
  get avancement(): number {
    const d = DUREES[this.etape];
    return d ? Math.min(1, this.t / d) : 0;
  }

  get code(): number {
    return codeEtape(this.etape, this.avancement);
  }

  /** Un héros qui revient en pleine traversée réapparaît au milieu du pont. */
  get pointApparition(): [number, number] {
    return [this.g.poupe + 12 * TUILE, this.g.pont - HEROS_HAUTEUR];
  }

  passe(etape: Etape): void {
    this.etape = etape;
    this.t = 0;
  }
}

/** À chaque chargement de niveau : sur le ferry, le van attend sur le quai de Lorient, à quai contre la poupe. */
export function prepareTraversee(p: Partie): void {
  p.traversee = null;
  const emb = p.lu.embarquement;
  if (!emb) return;
  const g = geometrieNavire(emb);
  const van = p.entites.find((e): e is Objet => e instanceof Objet && e.sorte === 'van') ?? null;
  if (van) van.corps.x = g.poupe - (NAVIRE.rampe + 4) * TUILE;
  p.traversee = new Traversee(g, van);
}

/** Les héros restent dans le van (invisibles) : la caméra le suit. */
function dansLeVan(p: Partie, van: Objet): void {
  for (const j of p.joueurs)
    if (j && !j.mort) {
      j.embarque = true;
      j.corps.x = van.corps.x + van.corps.w / 2 - j.corps.w / 2;
      j.corps.y = van.corps.y + van.corps.h - j.corps.h;
    }
}

/** Le van garé, les héros en descendent, côté poupe ; Fadatchi les suit. */
function descendDuVan(p: Partie, t: Traversee): void {
  const x0 = t.van ? t.van.corps.x - 6 : t.g.poupe + 12 * TUILE;
  let k = 0;
  for (const j of p.joueurs)
    if (j && !j.mort) {
      j.embarque = false;
      j.invulnerable = 60;
      Object.assign(j.corps, { x: x0 - 14 * k++ - j.corps.w, y: t.g.pont - j.corps.h, vx: 0, vy: 0 });
    }
  const kiwi = p.entites.find((e): e is Kiwi => e instanceof Kiwi);
  if (kiwi) Object.assign(kiwi.corps, { x: x0 - 14 * k - 12, y: t.g.pont - kiwi.corps.h, vx: 0, vy: 0 });
}

/** La montée à bord : le van roule du quai jusqu'à sa place, en ralentissant à l'approche. */
function monte(p: Partie, t: Traversee): void {
  const van = t.van;
  if (!van) return t.passe('rampe');
  dansLeVan(p, van);
  const reste = t.g.parking - van.corps.x;
  if (t.t < 30) return; // le moteur tourne un instant
  const v = Math.min(VITESSE_VAN, 0.2 + (t.t - 30) * 0.04, Math.max(0.3, reste / 24));
  if (reste <= v) {
    van.conduit(reste);
    van.conduit(0);
    p.son('derapage', van.corps.x, van.corps.y);
    t.passe('rampe');
  } else van.conduit(v);
}

/** La sortie : les héros remontent dans le van, qui roule tranquillement jusqu'à la rampe avant et descend à Groix. */
function sort(p: Partie, t: Traversee): void {
  const van = t.van;
  if (!van) {
    p.termineNiveau();
    return t.passe('fin');
  }
  dansLeVan(p, van);
  if (t.t < 30) return; // tout le monde monte, le moteur tourne
  van.conduit(Math.min(VITESSE_SORTIE, 0.2 + (t.t - 30) * 0.04));
  // le van est sur le quai de Groix : fin du niveau
  if (van.corps.x > t.g.proue + (NAVIRE.rampe + 5) * TUILE) {
    van.conduit(0);
    p.termineNiveau();
    t.passe('fin');
  }
}

function lanceVague(p: Partie, t: Traversee): void {
  const vague = VAGUES[t.vague++]!;
  const milieu = (t.g.poupe + t.g.proue) / 2;
  p.texte(milieu, t.g.pont - 50, `Vague ${t.vague}/${VAGUES.length}`, '#ffd23f');
  vague.forEach(([lettre, cote], i) => {
    const def = ENNEMIS_PAR_LETTRE[lettre]!;
    // ils montent à bord par-dessus la poupe ou la proue ; les goélands arrivent du ciel
    const bord = cote === 'gauche' ? 1.5 + (i % 3) * 0.7 : NAVIRE.longueur - 3 - (i % 3) * 0.7;
    const y = lettre === 'g' ? t.g.pont - 5 * TUILE : t.g.pont - TUILE;
    const e = new Ennemi(p, def, t.g.poupe + bord * TUILE, y);
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

/** En mer : les vagues d'assaillants, et l'accostage quand la dernière est vaincue. */
function vagues(p: Partie, t: Traversee): void {
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
    if (!vivants.length) t.avant = Math.min(t.avant, MINIMUM);
    if (--t.avant <= 0) {
      lanceVague(p, t);
      t.avant = INTERVALLE;
    }
  } else if (!vivants.length) {
    t.passe('accostage');
    p.evenement({ k: 'bulle', qui: 'NARRATEUR', texte: 'Groix en vue ! Le ferry ralentit.' });
  }
}

/** Un pas de la traversée. */
export function majTraversee(p: Partie): void {
  const t = p.traversee;
  if (!t || t.etape === 'fin') return;
  t.t++;
  t.sillage += t.vitesse;
  switch (t.etape) {
    case 'montee':
      return monte(p, t);
    case 'rampe':
      if (t.van) dansLeVan(p, t.van);
      if (t.t === 1) p.son('demarrage', t.g.poupe, t.g.pont);
      if (t.avancement < 1) return;
      descendDuVan(p, t);
      t.passe('appareillage');
      p.evenement({ k: 'bulle', qui: 'NARRATEUR', texte: 'Le ferry appareille. Tenez le pont !' });
      return;
    case 'appareillage':
      t.vitesse = t.avancement;
      if (t.avancement >= 1) t.passe('traversee');
      return;
    case 'traversee':
      return vagues(p, t);
    case 'accostage':
      t.vitesse = 1 - t.avancement;
      if (t.avancement < 1) return;
      t.passe('debarquement');
      p.evenement({
        k: 'bulle',
        qui: 'NARRATEUR',
        texte: 'Groix ! La rampe s’abaisse : tout le monde dans le van.',
      });
      return;
    case 'debarquement':
      if (t.avancement < 1) return;
      t.passe('sortie');
      p.son('demarrage', t.g.proue, t.g.pont);
      return;
    case 'sortie':
      return sort(p, t);
  }
}
