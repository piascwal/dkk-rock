import { TUILE } from '../config';
import type { Joueur } from '../entites/joueur';
import { parcoursAcces } from '../niveaux/accessibilite';
import { chainesDeTyroliennes } from '../niveaux/tyroliennes';
import { C } from './commandes';
import type { Cible } from './contexte';
import type { Partie } from './partie';

/**
 * Les joueurs de l'ordinateur, en battle royale hors ligne (de quoi s'entraîner, ou essayer une carte) : chacun choisit
 * l'adversaire le plus proche et s'y rend par le chemin que trouve le parcours d'accessibilité (niveaux/accessibilite.ts, sur
 * la carte telle qu'elle est maintenant : marcher, sauter, grimper aux échelles, prendre les tyroliennes) ; il tire quand il
 * est à hauteur, et creuse quand il est coincé. Il n'a que les commandes d'un joueur.
 */

interface Memoire {
  /** la prochaine case du chemin (colonne, rangée des pieds), refaite de temps en temps */
  etape: [number, number] | null;
  recalcul: number;
  /** ticks restants de saut tenu (un saut plus haut), puis de relâche avant le suivant */
  saut: number;
  relache: number;
  /** pour voir qu'on n'avance plus */
  xAvant: number;
  yAvant: number;
  immobile: number;
  /** un détour forcé : le sens et sa durée */
  detour: number;
  sensDetour: number;
  special: number;
  /** sur une tyrolienne : le sens choisi en l'attrapant, gardé jusqu'à ce qu'on la lâche (0 : pas dessus) */
  sensTyro: number;
  /** le sens prévu sur la prochaine tyrolienne du chemin (vers son arrivée) */
  sensPrevu: number;
  /** un peu d'hésitation : tous ne tirent pas au même instant */
  vise: number;
  /** pour voir qu'on tourne en rond : où l'on était au dernier bilan, et depuis quand ; puis, un moment, on erre ailleurs */
  ancre: [number, number];
  bilan: number;
  errance: number;
  but: [number, number];
}

/** à cette distance (px), on tire si l'on est à hauteur */
const PORTEE = 190;
/** le chemin se refait tous les tant de pas */
const RECALCUL = 20;
/** tous les tant de pas, on regarde si l'on a bougé ; sinon, on erre ailleurs ce temps-là */
const BILAN = 8 * 60;
const ERRANCE = 4 * 60;
/** une case où aller, déguisée en cible (seuls sa place et sa taille servent au chemin) */
const BUT_FICTIF: Cible = {
  id: -1,
  x: 0,
  y: 0,
  w: 9,
  h: 15,
  camp: 'tous',
  vivant: () => true,
  blesse: () => {},
};

export class IAArene {
  private readonly memoires = new Map<number, Memoire>();

  constructor(readonly sieges: readonly number[]) {}

  /** Les commandes de chaque joueur de l'ordinateur pour ce pas. */
  pilote(p: Partie): void {
    for (const s of this.sieges) {
      const j = p.joueurs[s];
      if (!j) continue;
      let m = this.memoires.get(s);
      if (!m) {
        m = {
          etape: null,
          recalcul: s * 3,
          saut: 0,
          relache: 0,
          xAvant: j.cx,
          yAvant: j.cy,
          immobile: 0,
          detour: 0,
          sensDetour: 1,
          special: 200,
          sensTyro: 0,
          sensPrevu: 0,
          vise: 0,
          ancre: [j.cx, j.cy],
          bilan: 0,
          errance: 0,
          but: [j.cx, j.cy],
        };
        this.memoires.set(s, m);
      }
      p.commandes[s] = j.mort || p.arene?.gele ? 0 : this.commandes(p, j, m);
    }
  }

  private commandes(p: Partie, j: Joueur, m: Memoire): number {
    const c = j.corps;
    const carte = p.carte;
    // huit secondes sans presque bouger : on part un moment vers un autre coin de la carte (deux joueurs de l'ordinateur qui se
    // guettent chacun de son côté ne restent pas figés)
    if (++m.bilan >= BILAN) {
      if (Math.hypot(j.cx - m.ancre[0], j.cy - m.ancre[1]) < 3 * TUILE) {
        m.errance = ERRANCE;
        m.but = p.arene!.caseQuelconque(p);
        m.recalcul = 0;
      }
      [m.bilan, m.ancre] = [0, [j.cx, j.cy]];
    }
    const adversaire = this.cible(p, j);
    const cible: Cible | null =
      m.errance-- > 0 ? { ...BUT_FICTIF, x: m.but[0], y: m.but[1], w: 9, h: 15 } : adversaire;
    const tx = Math.floor(j.cx / TUILE);
    const pieds = Math.floor((c.y + c.h - 1) / TUILE);
    if (!j.surTyrolienne) m.sensTyro = 0;
    else if (!m.sensTyro)
      m.sensTyro = m.sensPrevu || (cible ? Math.sign(cible.x + cible.w / 2 - j.cx) || 1 : j.dir);
    // le chemin se refait les pieds quelque part (pas suspendu à un câble : depuis le vide, il ne veut rien dire)
    if (!j.surTyrolienne && (--m.recalcul <= 0 || (m.etape && m.etape[0] === tx && m.etape[1] === pieds))) {
      m.recalcul = RECALCUL;
      m.etape = cible ? this.prochaineCase(p, tx, pieds, cible) : null;
    }
    let bits = 0;
    // le sens : vers la prochaine case du chemin (au milieu de la case, pour attraper les échelles) ; un pas trop grand pour être
    // marché ou sauté, c'est une tyrolienne : on va d'abord sous son poteau, côté câble (passer dessous suffit à l'attraper)
    let [ex, ey] = m.etape ?? [tx, pieds];
    m.sensPrevu = 0;
    if (Math.abs(ex - tx) > 3 || Math.abs(ey - pieds) > 3) {
      const poteau = poteauProche(p, tx, pieds, ex);
      if (poteau) {
        m.sensPrevu = Math.sign(ex - poteau[0]) || 1;
        [ex, ey] = [poteau[0] + 2 * m.sensPrevu, poteau[1]];
      }
    }
    let sens =
      ex !== tx
        ? Math.sign(ex - tx)
        : Math.abs(ex * TUILE + TUILE / 2 - j.cx) > 3
          ? Math.sign(ex * TUILE + TUILE / 2 - j.cx)
          : 0;
    if (m.detour > 0) {
      m.detour--;
      sens = m.sensDetour;
    }
    // coincé : on part dans l'autre sens un moment, en sautant et en creusant
    if (Math.hypot(j.cx - m.xAvant, j.cy - m.yAvant) < 0.4 && (sens !== 0 || ey !== pieds)) m.immobile++;
    else m.immobile = 0;
    [m.xAvant, m.yAvant] = [j.cx, j.cy];
    if (m.immobile > 50) {
      m.immobile = 0;
      m.detour = 30 + p.rng.entier(0, 40);
      m.sensDetour = p.rng.entre(0, 1) < 0.6 ? -sens || 1 : sens || 1;
    }
    if (sens > 0) bits |= C.DROITE;
    else if (sens < 0) bits |= C.GAUCHE;

    const devant = tx + (sens || j.dir);
    const mur = carte.solide(devant, pieds) || carte.solide(devant, pieds - 1);
    const echelle = carte.props(tx, pieds).echelle || carte.props(tx, pieds + 1).echelle;
    // monter ou descendre : l'échelle si on y est, sinon sauter (ou se laisser tomber d'une plateforme)
    // arrivé sous le câble sans l'avoir attrapé : un saut, et on le saisit en retombant
    let veutSauter =
      (mur && sens !== 0) || m.immobile > 25 || (m.sensPrevu !== 0 && ex === tx && ey === pieds);
    if (j.surEchelle) {
      // accroché à une échelle, gauche et droite ne font rien : on monte, on descend, ou on saute pour la quitter
      bits &= ~(C.GAUCHE | C.DROITE);
      if (ey < pieds) bits |= C.HAUT;
      else if (ey > pieds) bits |= C.BAS;
      else {
        bits |= sens > 0 ? C.DROITE : sens < 0 ? C.GAUCHE : 0;
        veutSauter = true;
      }
    } else if (j.surTyrolienne) {
      // sur une tyrolienne : on file dans le sens choisi, et on lâche au-dessus de la cible
      bits = (bits & ~(C.GAUCHE | C.DROITE)) | (m.sensTyro > 0 ? C.DROITE : C.GAUCHE);
      if (cible && cible.y > c.y + 24 && Math.abs(cible.x + cible.w / 2 - j.cx) < 24) bits |= C.BAS;
      veutSauter = false;
    } else if (ey < pieds) {
      if (echelle && ex === tx) bits |= C.HAUT;
      else veutSauter = true;
    } else if (ey > pieds && ex === tx) {
      if (carte.props(tx, pieds + 1).echelle) bits |= C.BAS;
      else if (carte.props(tx, pieds + 1).traversable) bits |= C.BAS | (m.saut === 0 ? C.SAUT : 0);
    }
    if (m.saut > 0) {
      m.saut--;
      bits |= C.SAUT;
      if (m.saut === 0) m.relache = 4;
    } else if (m.relache > 0) m.relache--;
    else if (veutSauter && (c.auSol || mur || j.surEchelle) && !(bits & C.HAUT)) {
      m.saut = 14;
      bits |= C.SAUT;
    }

    // le tir : à hauteur et à portée (en se tournant vers elle), à la verticale, ou pour creuser quand on est coincé
    const dy = adversaire ? adversaire.y + adversaire.h / 2 - j.cy : 0;
    const dx = adversaire ? adversaire.x + adversaire.w / 2 - j.cx : 0;
    if (m.vise > 0) m.vise--;
    if (adversaire && Math.abs(dx) < PORTEE) {
      if (Math.abs(dy) < 18) {
        bits = (bits & ~(C.GAUCHE | C.DROITE)) | (dx > 0 ? C.DROITE : C.GAUCHE);
        if (m.vise === 0 && p.rng.entre(0, 1) < 0.9) bits |= C.TIR;
      } else if (dy < -24 && Math.abs(dx) < 40) bits |= C.HAUT | C.TIR;
      else if (dy > 24 && Math.abs(dx) < 40 && !c.auSol) bits |= C.BAS | C.TIR;
      if (Math.abs(dx) < 70 && Math.abs(dy) < 30 && m.special-- <= 0) {
        bits |= C.SPECIAL;
        m.special = 300 + p.rng.entier(0, 300);
      }
    } else if (m.detour > 0 || (mur && m.immobile > 15)) bits |= C.TIR;
    if (!adversaire && m.vise === 0) m.vise = p.rng.entier(5, 25);
    return bits;
  }

  /**
   * La prochaine case du chemin vers la cible : le parcours en largeur depuis sa propre case (sur la carte telle qu'elle est),
   * puis on remonte depuis la case atteinte la plus proche de la cible jusqu'au premier pas.
   */
  private prochaineCase(p: Partie, tx: number, ty: number, cible: Cible): [number, number] | null {
    const L = p.lu.largeur;
    if (tx < 0 || ty < 0 || tx >= L || ty >= p.lu.hauteur) return null;
    const depart = ty * L + tx;
    const { dist, parent } = parcoursAcces({ ...p.lu, tuiles: p.carte.tuiles }, true, [depart]);
    const cx = Math.floor((cible.x + cible.w / 2) / TUILE);
    const cy = Math.floor((cible.y + cible.h - 1) / TUILE);
    let but = -1;
    let ecart = Infinity;
    dist.forEach((d, k) => {
      if (d < 0) return;
      const e = Math.abs((k % L) - cx) + 2 * Math.abs(Math.floor(k / L) - cy);
      if (e < ecart) [ecart, but] = [e, k];
    });
    if (but < 0 || but === depart) return [cx, cy];
    while (parent[but]! >= 0 && parent[but] !== depart) but = parent[but]!;
    return [but % L, Math.floor(but / L)];
  }

  /** L'adversaire le plus proche (les autres joueurs ; et les ennemis tout près, s'il y en a). */
  private cible(p: Partie, j: Joueur): Cible | null {
    let meilleure: Cible | null = null;
    let dMin = Infinity;
    const candidats: Cible[] = [
      ...p.joueurs.filter((o): o is Joueur => !!o && o !== j && !o.mort),
      ...p.cibles('ennemis').filter((e) => Math.abs(e.x - j.cx) < 160),
    ];
    for (const o of candidats) {
      if (!o.vivant()) continue;
      // un peu plus loin à la verticale : on préfère qui est à son étage
      const d = Math.abs(o.x + o.w / 2 - j.cx) + 2.5 * Math.abs(o.y + o.h / 2 - j.cy);
      if (d < dMin) [dMin, meilleure] = [d, o];
    }
    return meilleure;
  }
}

/**
 * Le poteau de tyrolienne d'où part le pas (la même règle que le parcours : à 3 colonnes près, de 0 à 3 rangées au-dessus des
 * pieds), en cases ; parmi eux, celui qui mène le plus vers l'arrivée `versX`.
 */
function poteauProche(p: Partie, tx: number, pieds: number, versX: number): [number, number] | null {
  let meilleur: [number, number] | null = null;
  let score = Infinity;
  for (const poteaux of chainesDeTyroliennes(p.tyroliennes))
    for (const q of poteaux) {
      const [px, py] = [Math.floor(q.x / TUILE), Math.floor(q.y / TUILE)];
      if (Math.abs(px - tx) > 3 || pieds - py < 0 || pieds - py > 3) continue;
      const loin = Math.min(...poteaux.map((o) => Math.abs(Math.floor(o.x / TUILE) - versX)));
      if (loin < score) [score, meilleur] = [loin, [px, py]];
    }
  return meilleur;
}
