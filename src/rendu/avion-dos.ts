import { DECOLLAGE, PORTEE, xAvion } from '../jeu/avion';
import { BONUS, LONGUEURS, estObstacle, type Objet } from '../jeu/avion-parcours';
import type { VueAvion } from '../jeu/vue-avion';
import { portraits } from './avion-appareil';
import { avionDeDos, dessinePiste } from './avion-dos-decor';
import { objetDeDos } from './avion-dos-objets';
import { voieDe } from './avion-objets';
import {
  METRES,
  METRES_HAUT,
  Z_JBG,
  cadre,
  ech,
  ombre,
  profondeur,
  px,
  py,
  xVoie,
} from './avion-perspective';
import { dessineDecorFeuille } from './feuilles-images';
import { ecrit } from './police';

/**
 * L'avion de JBG pendant la course, vu de derrière JBG (façon Subway Surfers) : la piste qui file vers l'avion des DKK, l'avion
 * au bout, de plus en plus grand à mesure qu'on le rattrape, ce qui encombre le tarmac et arrive de l'horizon, et JBG de dos (son
 * image de l'échelle, et son miroir, en alternance : la course). L'arrivée et la fin restent vues de côté (voir avion.ts).
 */

type Ctx = CanvasRenderingContext2D;

/** JBG à l'écran : son image d'échelle (24 pixels de haut) agrandie à sa taille à cette profondeur. */
const TAILLE_JBG = 1.95;
const HAUTEUR_IMAGE = 24;

interface Flottant {
  x: number;
  y: number;
  texte: string;
  vie: number;
  couleur: string;
}

export class RenduAvionDos {
  private flottants: Flottant[] = [];
  private vus = new Set<number>();
  private manche = -1;

  dessine(c: Ctx, v: VueAvion, tarmac: readonly Objet[], largeur: number, tick: number): void {
    if (v.manche !== this.manche) {
      this.manche = v.manche;
      this.vus = new Set(v.consommes);
      this.flottants = [];
    }
    cadre(largeur, 0);
    const metres = v.x * METRES;
    dessinePiste(c, largeur, metres);
    const ecart = Math.max(0, xAvion(v.temps) - v.x) * METRES;
    const zAvion = Math.max(profondeur(0) + 5, profondeur(ecart));
    const decolle = v.temps / 60 - DECOLLAGE;
    avionDeDos(c, zAvion, portraits, tick, decolle > 0 ? decolle * decolle * 2 : 0, ecart <= PORTEE * METRES);
    // les objets visibles, du plus loin au plus proche ; JBG à sa place
    const s = v.temps / 60;
    const pris = new Set(v.consommes);
    const visibles: { o: Objet; i: number; z0: number; z1: number }[] = [];
    for (let i = 0; i < tarmac.length; i++) {
      const o = tarmac[i]!;
      const d = (o.x - v.x) * METRES;
      if (d > ecart || pris.has(i)) continue;
      const long = estObstacle(o) ? LONGUEURS[o.sorte] * METRES : 0.3;
      // derrière JBG, on ne garde que ce qui le frôle encore : les cartes et les bonus disparaissent tout de suite, les obstacles
      // dès qu'ils sortent par le bas de l'écran (sinon ils masquent tout, énormes, au premier plan)
      if (d + long < (estObstacle(o) ? -1.2 : -0.4)) continue;
      const z0 = profondeur(d);
      if (z0 > zAvion - 0.5) continue;
      visibles.push({ o, i, z0: Math.max(1.6, z0), z1: profondeur(d + long) });
    }
    // du plus loin au plus près ; ce que JBG longe (commencé devant lui, fini derrière) passe juste avant lui
    const cle = (o: { z0: number; z1: number }) => (o.z0 < Z_JBG && o.z1 > Z_JBG ? Z_JBG + 0.001 : o.z0);
    visibles.sort((a, b) => cle(b) - cle(a));
    let jbg = false;
    for (const { o, i, z0, z1 } of visibles) {
      // JBG passe devant ce qui est entièrement derrière lui, et devant ce qu'il longe (un camion sur la voie d'à côté, le tapis
      // sur lequel il court)
      if (!jbg && cle({ z0, z1 }) < Z_JBG) {
        this.jbg(c, v, tick);
        jbg = true;
      }
      objetDeDos(c, o, i, xVoie(voieDe(o, s)), z0, z1, tick);
    }
    if (!jbg) this.jbg(c, v, tick);
    this.effets(c, v, tarmac);
  }

  /** JBG de dos : il court (son image et son miroir), saute, glisse, trébuche, file en trottinette, joue son solo. */
  private jbg(c: Ctx, v: VueAvion, tick: number): void {
    const x = xVoie(v.voieVue);
    const h = v.z * METRES_HAUT + (v.surTapis ? 14 * METRES_HAUT : 0);
    const z = Z_JBG;
    ombre(c, x, z, v.z > 0 ? 0.32 : 0.5);
    const bonus = v.bonus >= 0 ? BONUS[v.bonus] : null;
    const k = (TAILLE_JBG * ech(z)) / HAUTEUR_IMAGE;
    const sx = Math.round(px(x, z));
    const sy = Math.round(py(h, z));
    if (bonus === 'trottinette' && v.z === 0) {
      // la trottinette, de dos : la planche, le guidon
      c.fillStyle = '#4ff0ff';
      c.fillRect(sx - 2, sy - 2, 4, 3);
      c.fillRect(sx - 6, sy - 26, 12, 2);
      c.fillRect(sx - 1, sy - 26, 2, 24);
    }
    if (v.invulnerable > 0 && v.trebuche === 0 && tick % 6 < 3) c.globalAlpha = 0.5;
    c.save();
    c.translate(sx, sy - (bonus === 'trottinette' && v.z === 0 ? 3 : 0));
    if (v.trebuche > 0) c.rotate(Math.sin(tick / 3) * 0.25);
    // la course : l'image d'échelle, puis son miroir ; en l'air, l'image seule ; en glissade, tassé
    const miroir = v.z === 0 && v.glisse === 0 && v.etape === 'course' && Math.floor(tick / 5) % 2 === 1;
    c.scale(miroir ? -k : k, v.glisse > 0 ? k * 0.55 : k);
    dessineDecorFeuille(c, 'jbg-echelle', 0);
    c.restore();
    c.globalAlpha = 1;
    if (v.glisse > 0) {
      // la poussière soulevée par la glissade
      c.fillStyle = 'rgba(220,220,210,0.6)';
      for (let n = 0; n < 4; n++)
        c.fillRect(sx - 14 + n * 8 + ((tick + n * 3) % 4), sy - 2 - (n % 2) * 2, 3, 2);
    }
    if (v.trebuche > 0)
      for (let n = 0; n < 3; n++) {
        const a = tick / 6 + (n * Math.PI * 2) / 3;
        c.fillStyle = '#ffd23f';
        c.fillRect(sx + Math.round(Math.cos(a) * 10) - 1, sy - 46 + Math.round(Math.sin(a) * 3), 2, 2);
      }
    if (bonus === 'solo')
      for (let n = 0; n < 5; n++) {
        // les notes du solo filent vers l'horizon, droit devant
        const p = ((tick * 2 + n * 20) % 100) / 100;
        const zn = z + p * 9;
        c.fillStyle = `rgba(255,${200 - n * 25},80,${(1 - p).toFixed(2)})`;
        const r = Math.max(1, Math.round(0.25 * ech(zn)));
        c.fillRect(Math.round(px(x + Math.sin(p * 9 + n) * 0.6, zn)), Math.round(py(h + 1.2, zn)), r, r + 1);
      }
    if (bonus === 'aimant' && tick % 8 < 4) {
      c.strokeStyle = 'rgba(255,90,90,0.5)';
      c.beginPath();
      c.arc(sx, sy - 22, 26, 0, Math.PI * 2);
      c.stroke();
    }
    if (bonus === 'ressorts' && tick % 4 < 2) {
      c.fillStyle = '#ffd23f';
      c.fillRect(sx - 6, sy + 1, 3, 1);
      c.fillRect(sx + 3, sy + 1, 3, 1);
    }
  }

  /** Ce que la vue dit avoir été pris depuis la dernière image : les cartes rapportent « +5 », au-dessus de JBG. */
  private effets(c: Ctx, v: VueAvion, tarmac: readonly Objet[]): void {
    const sx = Math.round(px(xVoie(v.voieVue), Z_JBG));
    const sy = Math.round(py(TAILLE_JBG + 0.3, Z_JBG));
    for (const i of v.consommes) {
      if (this.vus.has(i)) continue;
      this.vus.add(i);
      const o = tarmac[i];
      if (o?.sorte === 'carte')
        this.flottants.push({ x: sx + 8, y: sy, texte: '+5', vie: 24, couleur: '#ffffff' });
      else if (o && !estObstacle(o))
        this.flottants.push({ x: sx - 14, y: sy - 6, texte: 'BONUS !', vie: 40, couleur: '#4ff0ff' });
    }
    this.flottants = this.flottants.filter((f) => --f.vie > 0);
    for (const f of this.flottants) {
      f.y -= 0.5;
      ecrit(c, f.texte, Math.round(f.x), Math.round(f.y), f.couleur);
    }
  }
}
