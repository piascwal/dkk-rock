import { TUILE } from '../config';
import type { Joueur } from '../entites/joueur';
import { C } from './commandes';
import type { Cible } from './contexte';
import type { Partie } from './partie';

/**
 * Les joueurs de l'ordinateur, en battle royale hors ligne (de quoi s'entraîner, ou essayer une carte) : chacun cherche
 * l'adversaire le plus proche, y court, saute les murs et les trous, grimpe aux échelles, tire quand il est à hauteur (et
 * creuse quand il est coincé), rentre dans la zone quand elle se referme. Ils ne trichent pas : ils n'ont que les commandes.
 */

interface Memoire {
  /** ticks restants de saut tenu (un saut plus haut), puis de relâche avant le suivant */
  saut: number;
  relache: number;
  /** pour voir qu'on n'avance plus */
  xAvant: number;
  immobile: number;
  /** un détour forcé : le sens et sa durée */
  detour: number;
  sensDetour: number;
  special: number;
  /** un peu d'hésitation : tous ne tirent pas au même instant */
  vise: number;
}

/** à cette distance (px), on tire si l'on est à hauteur */
const PORTEE = 190;

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
          saut: 0,
          relache: 0,
          xAvant: j.cx,
          immobile: 0,
          detour: 0,
          sensDetour: 1,
          special: 200,
          vise: 0,
        };
        this.memoires.set(s, m);
      }
      p.commandes[s] = j.mort || p.arene?.gele ? 0 : this.commandes(p, j, m);
    }
  }

  private commandes(p: Partie, j: Joueur, m: Memoire): number {
    const c = j.corps;
    const carte = p.carte;
    const zone = p.arene!.zone;
    const cible = this.cible(p, j);
    let bits = 0;
    // le sens : rentrer dans la zone d'abord, sinon vers la cible, sinon vers le milieu de la zone
    let sens = 0;
    if (j.cx < zone[0] + 2 * TUILE) sens = 1;
    else if (j.cx > zone[1] - 2 * TUILE) sens = -1;
    else if (cible)
      sens = Math.abs(cible.x + cible.w / 2 - j.cx) > 24 ? Math.sign(cible.x + cible.w / 2 - j.cx) : 0;
    else sens = Math.sign((zone[0] + zone[1]) / 2 - j.cx);
    if (m.detour > 0) {
      m.detour--;
      sens = m.sensDetour;
    }
    // coincé : on part dans l'autre sens un moment, en sautant et en creusant
    if (Math.abs(j.cx - m.xAvant) < 0.4 && sens !== 0) m.immobile++;
    else m.immobile = 0;
    m.xAvant = j.cx;
    if (m.immobile > 50) {
      m.immobile = 0;
      m.detour = 40 + p.rng.entier(0, 40);
      m.sensDetour = p.rng.entre(0, 1) < 0.6 ? -sens || 1 : sens || 1;
    }
    if (sens > 0) bits |= C.DROITE;
    else if (sens < 0) bits |= C.GAUCHE;

    const tx = Math.floor(j.cx / TUILE);
    const pieds = Math.floor((c.y + c.h - 1) / TUILE);
    const devant = tx + (sens || j.dir);
    const mur = carte.solide(devant, pieds) || carte.solide(devant, pieds - 1);
    const trou = c.auSol && ![1, 2, 3].some((k) => carte.solide(devant, pieds + k));
    const dy = cible ? cible.y + cible.h / 2 - j.cy : 0;
    const dx = cible ? cible.x + cible.w / 2 - j.cx : 0;

    // les échelles : on monte ou on descend vers la cible
    if (carte.props(tx, pieds).echelle || carte.props(tx, pieds + 1).echelle) {
      if (dy < -20) bits |= C.HAUT;
      else if (dy > 20) bits |= C.BAS;
    }
    // le saut : un mur, un trou (sauf si la cible est plus bas), la cible au-dessus, ou coincé
    const veutSauter =
      (mur && sens !== 0) || (trou && dy < 40) || (dy < -28 && Math.abs(dx) < 120) || m.immobile > 25;
    if (m.saut > 0) {
      m.saut--;
      bits |= C.SAUT;
      if (m.saut === 0) m.relache = 4;
    } else if (m.relache > 0) m.relache--;
    else if (veutSauter && (c.auSol || mur)) {
      m.saut = 14;
      bits |= C.SAUT;
    }

    // le tir : à hauteur et à portée (en se tournant vers elle), à la verticale, ou pour creuser quand on est coincé
    if (m.vise > 0) m.vise--;
    if (cible && Math.abs(dx) < PORTEE) {
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
    if (!cible && m.vise === 0) m.vise = p.rng.entier(5, 25);
    return bits;
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
