import { HAUTEUR_VUE, TUILE } from '../config';
import { decodeEtape, NAVIRE, type GeometrieNavire } from '../niveaux/navire';
import { disque } from './formes-pixels';
import { dessineQuai } from './navire-quais';
import { ecrit } from './police';

/**
 * Le ferry à l'écran (niveau « La Traversée »). Dans la carte, le navire n'est qu'un bloc de socle : on le dessine par-dessus,
 * coque, pont de bois, cabine, cheminée qui fume, drapeau ; les rampes arrière et avant pivotent ; les quais glissent ; devant,
 * la mer, l'écume et le sillage ; et tout ce qui est à bord tangue un peu en mer. Tout se lit dans la vue (l'étape et son
 * avancement, sur `EtatVue.navire`), et dans les mesures du navire.
 */
type Ctx = CanvasRenderingContext2D;

/** Ce que l'étape donne à voir : vitesse (0 à quai, 1 en mer), quais (décalés, ou absents), rampes (0 abaissée, 1 relevée). */
interface Scene {
  vitesse: number;
  lorient: number | null;
  groix: number | null;
  arriere: number;
  avant: number;
}

/** Au loin : de quoi sortir le quai de l'écran. */
const LOIN = 560;
const lisse = (t: number) => t * t * (3 - 2 * t);

function scene(code: number): Scene {
  const { etape, avancement: a } = decodeEtape(code);
  const s: Scene = { vitesse: 0, lorient: null, groix: null, arriere: 1, avant: 1 };
  if (etape === 'montee' || etape === 'rampe') {
    s.lorient = 0;
    s.arriere = etape === 'rampe' ? a : 0;
  } else if (etape === 'appareillage') {
    s.vitesse = a;
    s.lorient = -lisse(a) * LOIN;
  } else if (etape === 'traversee') s.vitesse = 1;
  else if (etape === 'accostage') {
    s.vitesse = 1 - a;
    s.groix = (1 - lisse(a)) * LOIN;
  } else {
    s.groix = 0;
    s.avant = etape === 'debarquement' ? 1 - a : 0;
  }
  return s;
}

export class RenduNavire {
  constructor(private readonly g: GeometrieNavire) {}

  /** De combien tout ce qui est à bord monte ou descend, en pixels : le navire tangue en mer. */
  tangage(code: number, tick: number): number {
    const v = scene(code).vitesse;
    return Math.round((Math.sin(tick / 26) * 1.4 + Math.sin(tick / 11) * 0.4) * v);
  }

  /** Les quais, avant tout le reste : ils ne tanguent pas. */
  quais(ctx: Ctx, camX: number, camY: number, code: number): void {
    const s = scene(code);
    const g = this.g;
    const ecart = NAVIRE.rampe * TUILE;
    if (s.lorient !== null) dessineQuai(ctx, g, g.poupe - ecart + s.lorient, -1, 'LORIENT', camX, camY);
    if (s.groix !== null) dessineQuai(ctx, g, g.proue + ecart + s.groix, 1, 'GROIX', camX, camY);
  }

  /** Le navire, par-dessus ses tuiles et derrière les personnages. */
  navire(ctx: Ctx, camX: number, camY: number, code: number, tick: number): void {
    const s = scene(code);
    const g = this.g;
    const p = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x - camX), Math.round(y - camY), w, h);
    };
    const l = g.proue - g.poupe;
    const T = TUILE;
    // la coque : bleu marine, un liseré blanc, l'antifouling rouge à la flottaison, des hublots allumés
    p(g.poupe, g.pont + T, l, g.quille - g.pont - T, '#22335c');
    p(g.poupe, g.pont + T, l, 3, '#f2f0ea');
    p(g.poupe, g.flottaison - 4, l, g.quille - g.flottaison + 4, '#b8322a');
    for (let x = g.poupe + 14; x < g.proue - 10; x += 20) {
      p(x, g.pont + T + 8, 5, 5, '#11182c');
      p(x + 1, g.pont + T + 9, 3, 3, '#ffe27a');
    }
    ecrit(ctx, 'ENEZ GROE', Math.round(g.poupe + 30 - camX), Math.round(g.pont + T + 6 - camY), '#f2f0ea');
    // l'étrave : la coque s'effile en pointe au-delà de la proue
    for (let y = g.pont; y < g.quille; y++) {
      const w = Math.round(14 * (1 - (y - g.pont) / (g.quille - g.pont)));
      p(g.proue, y, w, 1, y < g.pont + T ? '#a8743a' : y >= g.flottaison - 4 ? '#b8322a' : '#22335c');
    }
    // le pont de bois : des planches, leurs joints, un bord clair
    p(g.poupe, g.pont, l, T, '#a8743a');
    p(g.poupe, g.pont, l, 2, '#d29a55');
    p(g.poupe, g.pont + T - 2, l, 2, '#6b4a22');
    for (let x = g.poupe + 6; x < g.proue; x += 12) p(x, g.pont + 3, 1, T - 5, '#6b4a22');
    this.superstructure(p, tick);
    // la fumée de la cheminée : des bouffées rondes qui grossissent et filent vers l'arrière quand le ferry avance
    for (let k = 0; k < 6; k++) {
      const age = (tick * 0.6 + k * 22) % 130;
      ctx.fillStyle = age < 90 ? '#dfe4e8' : '#c4cbd1';
      disque(
        ctx,
        Math.round(g.poupe + 15 * T + 8 - age * (0.15 + 0.9 * s.vitesse) - camX),
        Math.round(g.pont - 78 - age * 0.35 - camY),
        3 + Math.floor(age / 26),
      );
    }
    this.rampe(ctx, g.poupe + T, -1, s.arriere, camX, camY);
    this.rampe(ctx, g.proue - T, 1, s.avant, camX, camY);
  }

  /** La cabine et la passerelle, la cheminée qui fume, le bastingage et le drapeau breton. */
  private superstructure(
    p: (x: number, y: number, w: number, h: number, c: string) => void,
    tick: number,
  ): void {
    const g = this.g;
    const T = TUILE;
    const x0 = g.poupe + 13 * T;
    // le bastingage, derrière tout le monde : des poteaux et deux lisses
    for (let x = g.poupe + T + 4; x < g.proue - T; x += 12) p(x, g.pont - 11, 1, 11, '#e8e2d0');
    p(g.poupe + T, g.pont - 11, g.proue - g.poupe - 2 * T, 1, '#e8e2d0');
    p(g.poupe + T, g.pont - 6, g.proue - g.poupe - 2 * T, 1, '#c8c4b8');
    // la cabine, puis la passerelle au-dessus
    p(x0, g.pont - 40, 13 * T, 40, '#f2f0ea');
    p(x0, g.pont - 40, 13 * T, 2, '#c8c4b8');
    for (let x = x0 + 6; x < x0 + 13 * T - 8; x += 14) p(x, g.pont - 31, 9, 7, '#2a3a5a');
    for (const x of [x0 + 30, x0 + 150]) {
      p(x, g.pont - 20, 7, 7, '#ff7a1a');
      p(x + 2, g.pont - 18, 3, 3, '#f2f0ea');
    }
    const xp = g.poupe + 19 * T;
    p(xp, g.pont - 62, 6 * T, 22, '#f2f0ea');
    p(xp - 2, g.pont - 64, 6 * T + 4, 3, '#c8c4b8');
    p(xp + 4, g.pont - 56, 6 * T - 8, 8, '#2a3a5a');
    // un canot de sauvetage orange sur le toit de la cabine
    p(x0 + 14, g.pont - 47, 34, 7, '#ff7a1a');
    p(x0 + 16, g.pont - 47, 30, 2, '#ffa64a');
    // la cheminée rouge à bande blanche, et sa fumée qui file vers l'arrière quand le ferry avance
    const xc = g.poupe + 15 * T;
    p(xc, g.pont - 72, 16, 32, '#c8322a');
    p(xc, g.pont - 62, 16, 4, '#f2f0ea');
    p(xc, g.pont - 74, 16, 4, '#1a1a20');
    // le mât et le gwenn-ha-du qui flotte
    const xm = g.proue - 3 * T;
    p(xm, g.pont - 84, 2, 84, '#3a3a44');
    for (let i = 0; i < 18; i++) {
      const onde = Math.round(Math.sin((tick + i * 6) / 9) * 1.2);
      for (let j = 0; j < 9; j++) {
        const canton = i < 8 && j < 5;
        const c = canton ? ((i + j) % 3 === 0 ? '#1a1a20' : '#f2f0ea') : j % 2 ? '#f2f0ea' : '#1a1a20';
        p(xm + 2 + i, g.pont - 84 + j + onde, 1, 1, c);
      }
    }
  }

  /**
   * Une rampe : une plaque d'acier à chevrons jaunes, qui pivote sur le bord du pont. `cote` -1 : la rampe arrière (elle
   * s'abaisse vers la gauche), 1 : la rampe avant ; `leve` de 0 (abaissée, à plat sur le quai) à 1 (relevée, la poupe ou la proue).
   */
  private rampe(ctx: Ctx, pivot: number, cote: -1 | 1, leve: number, camX: number, camY: number): void {
    const g = this.g;
    const T = TUILE;
    const h = NAVIRE.bastingage * T;
    // la rampe ouverte laisse voir la cale, sombre, à la place de la poupe ou de la proue
    if (leve < 1) {
      ctx.fillStyle = '#1a2440';
      ctx.fillRect(Math.round((cote < 0 ? pivot - T : pivot) - camX), Math.round(g.pont - h - camY), T, h);
    }
    ctx.save();
    ctx.translate(Math.round(pivot - camX), Math.round(g.pont - camY));
    // abaissée, la rampe arrière se couche vers la gauche (quart de tour en sens inverse), la rampe avant vers la droite
    ctx.rotate(cote * (1 - leve) * (Math.PI / 2));
    // relevée, la plaque occupe la case de la poupe (à gauche du pivot) ou de la proue (à droite)
    const x = cote < 0 ? -T : 0;
    ctx.fillStyle = '#3a4a6a';
    ctx.fillRect(x, -h, T, h);
    ctx.fillStyle = '#2a3650';
    for (let y = -h + 6; y < 0; y += 8) ctx.fillRect(x + 2, y, T - 4, 2);
    // les chevrons de sécurité, sur la face qui touche le quai une fois abaissée
    for (let y = -h; y < 0; y += 6) {
      ctx.fillStyle = (y / 6) % 2 ? '#1a1a20' : '#ffd23f';
      ctx.fillRect(cote < 0 ? x : x + T - 3, y, 3, 6);
    }
    ctx.restore();
  }

  /** Devant tout : la mer, ses crêtes, l'écume contre la coque et le sillage quand le ferry avance. */
  mer(ctx: Ctx, camX: number, camY: number, largeur: number, code: number, tick: number): void {
    const s = scene(code);
    const g = this.g;
    const y0 = Math.round(g.flottaison - camY);
    if (y0 >= HAUTEUR_VUE) return;
    const fond = ctx.createLinearGradient(0, y0, 0, HAUTEUR_VUE);
    fond.addColorStop(0, '#3a86b8');
    fond.addColorStop(1, '#16405f');
    ctx.fillStyle = fond;
    ctx.fillRect(0, y0, largeur, HAUTEUR_VUE - y0);
    // les crêtes : la surface ondule, des reflets clairs glissent
    ctx.fillStyle = '#9fd0ea';
    for (let x = 0; x < largeur; x += 2) {
      const monde = x + camX;
      const dy = Math.round(Math.sin((monde + tick * (0.6 + s.vitesse * 1.5)) / 9) * 1.2);
      ctx.fillRect(x, y0 - 1 + dy, 2, 1);
    }
    ctx.fillStyle = '#cfe9f5';
    for (let k = 0; k < largeur / 18; k++) {
      const x = (((k * 37 - tick * (0.3 + s.vitesse * 1.6) - camX) % largeur) + largeur) % largeur;
      ctx.fillRect(Math.round(x), y0 + 4 + ((k * 7) % 22), 5, 1);
    }
    if (s.vitesse <= 0.05) return;
    // l'écume le long de la coque, la vague d'étrave et le sillage derrière la poupe
    ctx.fillStyle = '#ffffff';
    const l = g.proue - g.poupe;
    for (let k = 0; k < l / 10; k++) {
      const x = g.proue - ((tick * 2.2 * s.vitesse + k * 10) % l);
      ctx.fillRect(Math.round(x - camX), y0 + (k % 3) - 1, 4 + (k % 4), 1);
    }
    for (let k = 0; k < 8 * s.vitesse; k++)
      ctx.fillRect(
        Math.round(g.proue + 8 + ((tick + k * 5) % 12) - camX),
        y0 - 3 + ((k * 3 + tick) % 5),
        2,
        2,
      );
    for (let k = 0; k < 24; k++) {
      const d = (tick * 1.8 * s.vitesse + k * 9) % (120 * s.vitesse + 1);
      ctx.fillRect(Math.round(g.poupe - d - camX), y0 + (k % 4) - 1 + Math.round(d / 40), 6, 1);
    }
  }
}
