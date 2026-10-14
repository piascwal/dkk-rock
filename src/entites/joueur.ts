import { TUILE } from '../config';
import { borne } from '../moteur/maths';
import { appliqueGravite, deplace, toucheMur } from '../monde/physique';
import { C, inverse, type Commandes } from '../jeu/commandes';
import type { Contexte } from '../jeu/contexte';
import { ANIM, type EntiteVue } from '../jeu/vue';
import { tire } from './armes';
import { angleVisee, codeVisee } from './visee';
import { JoueurBase } from './joueur-base';
import { SOLO } from './projectiles-defs';

const VITESSE = 1.75;
const SAUT = 5.5;
const SAUT_MUR = 5;
const VITESSE_ECHELLE = 1.4;
const DELAI_MUR = 8;
const PETIT_SAUT_MUR = 3.6;

/** Un héros contrôlé par un joueur (local ou distant : la simulation ne fait pas la différence). */
export class Joueur extends JoueurBase {
  private coyote = 0;
  private tamponSaut = 0;
  private verrouHorizontal = 0;
  private murVu: -1 | 0 | 1 = 0;
  private delaiMur = 0;
  private traverse = 0;
  private lacheTyro = 0;
  private contreMur = false;
  /** numéro du prochain tir de l'instrument : la note de la mélodie */
  private notes = 0;

  maj(ctx: Contexte, cmd: Commandes): void {
    this.commandes.avance(this.hypnose > 0 ? inverse(cmd) : cmd);
    if (this.mort) return;
    if (this.embarque) {
      this.invulnerable = 2;
      return;
    }
    for (const k of [
      'invulnerable',
      'invincible',
      'ebloui',
      'hypnose',
      'recharge',
      'lacheTyro',
      'traverse',
    ] as const)
      if (this[k] > 0) this[k]--;
    this.anim++;
    if (this.tyro) this.majTyrolienne(ctx);
    else if (this.echelle) this.majEchelle(ctx);
    else this.majNormal(ctx);
    this.majTir(ctx);
    if (this.corps.y > ctx.carte.hauteur * TUILE + 32) this.meurt(ctx);
  }

  private majNormal(ctx: Contexte): void {
    const c = this.corps;
    const k = this.commandes;
    const h = k.horizontal;
    if (h) this.dir = h > 0 ? 1 : -1;
    if (this.verrouHorizontal > 0) this.verrouHorizontal--;
    else {
      const accel = c.auSol ? (c.surGlace ? 0.05 : 0.4) : 0.22;
      c.vx += borne(h * VITESSE - c.vx, -accel, accel);
    }
    if (c.auSol) {
      this.coyote = 6;
    } else if (this.coyote > 0) this.coyote--;
    if (k.appuye(C.SAUT)) this.tamponSaut = 6;
    else if (this.tamponSaut > 0) this.tamponSaut--;

    // descendre d'une plateforme, ou attraper une échelle
    if (this.colonneEchelle(ctx, k.vertical) >= 0 && (k.tenu(C.HAUT) || k.tenu(C.BAS)) && !k.tenu(C.SAUT)) {
      this.echelle = true;
      c.vx = 0;
      return;
    }
    if (k.tenu(C.BAS) && this.tamponSaut > 0 && c.auSol) {
      this.traverse = 10;
      this.tamponSaut = 0;
    }

    // le mur à portée (côté tenu, sinon côté regardé) ; un instant après l'avoir quitté (le haut du mur), on s'en
    // souvient : on peut encore sauter « depuis le mur », de n'importe quel côté, pour passer le bord
    const vu = c.auSol ? 0 : this.murProche(ctx, h || this.dir);
    if (vu !== 0) {
      this.murVu = vu;
      this.delaiMur = DELAI_MUR;
    } else if (this.delaiMur > 0) this.delaiMur--;
    else this.murVu = 0;
    const sensMur = c.auSol ? 0 : this.murVu;
    const contreMur = vu !== 0 && h === vu;
    this.contreMur = vu !== 0;
    if (this.tamponSaut > 0 && (this.coyote > 0 || sensMur !== 0)) {
      this.tamponSaut = 0;
      this.coyote = 0;
      if (sensMur !== 0 && !c.auSol) {
        this.delaiMur = 0;
        if (h === sensMur) {
          // vers le mur : un petit saut qui remonte le long de la paroi (pas d'escalade : on enchaîne les sauts)
          c.vy = -PETIT_SAUT_MUR;
          c.vx = sensMur * 0.6;
          this.dir = sensMur > 0 ? 1 : -1;
        } else {
          // sans direction ou à l'opposé : on décolle du mur, face à nous (plus loin si on pousse dans ce sens)
          c.vy = -SAUT_MUR;
          c.vx = -sensMur * (h === 0 ? 1.4 : 2.4);
          this.dir = sensMur > 0 ? -1 : 1;
          this.verrouHorizontal = 10;
        }
      } else c.vy = -SAUT;
      ctx.son('saut', this.cx, this.cy);
    }
    if (contreMur && c.vy > 1.2) c.vy = 1.2;

    const gravite = c.vy < 0 && !k.tenu(C.SAUT) ? 2 : 1;
    if (this.slam) c.vy = Math.max(c.vy, 0) + 0.5;
    appliqueGravite(c, gravite);
    deplace(c, ctx.carte, this.traverse > 0);
    if (this.slam && c.auSol) this.atterrissageSlam(ctx);
    if (this.lacheTyro === 0) this.chercheTyrolienne(ctx);
  }

  /** -1 ou 1 si un mur est collé à ce côté (ou à l'autre), 0 sinon. */
  private murProche(ctx: Contexte, cote: number): -1 | 0 | 1 {
    const d = cote > 0 ? 1 : -1;
    // 4 px de tolérance : on peut déjà s'être décollé du mur en poussant dans l'autre sens
    if (toucheMur(this.corps, ctx.carte, d, 4)) return d;
    return toucheMur(this.corps, ctx.carte, d === 1 ? -1 : 1, 4) ? (d === 1 ? -1 : 1) : 0;
  }

  private atterrissageSlam(ctx: Contexte): void {
    this.slam = false;
    const y = this.corps.y + this.corps.h - 4;
    for (const dx of [0, -22, 22, -44, 44]) ctx.explosion(this.cx + dx, y, 22, 5, 'heros');
    ctx.secoue(10);
    ctx.texte(this.cx, y - 24, 'SLAP !', '#9b5de5');
  }

  /** La colonne de l'échelle à portée de main (un peu de tolérance au pouce), ou -1. */
  private colonneEchelle(ctx: Contexte, vertical: number): number {
    const pied = Math.floor((this.corps.y + this.corps.h + (vertical > 0 ? 2 : -2)) / TUILE);
    const milieu = Math.floor(this.cy / TUILE);
    for (const dx of [0, -4, 4]) {
      const tx = Math.floor((this.cx + dx) / TUILE);
      if (ctx.carte.props(tx, milieu).echelle || ctx.carte.props(tx, pied).echelle) return tx;
    }
    return -1;
  }

  private majEchelle(ctx: Contexte): void {
    const c = this.corps;
    const k = this.commandes;
    const v = k.vertical;
    const colonne = this.colonneEchelle(ctx, v);
    if (k.appuye(C.SAUT) || colonne < 0) {
      this.echelle = false;
      if (k.appuye(C.SAUT)) c.vy = -SAUT * 0.8;
      return;
    }
    // on se recentre sur l'échelle
    const centre = (colonne + 0.5) * TUILE - c.w / 2;
    c.x += borne(centre - c.x, -1.5, 1.5);
    c.vx = k.horizontal * 0.8;
    c.vy = v * VITESSE_ECHELLE;
    if (k.horizontal) this.dir = k.horizontal > 0 ? 1 : -1;
    deplace(c, ctx.carte, true);
    if (v > 0 && c.auSol) this.echelle = false;
    if (v < 0) this.poseEnHautDeLEchelle(ctx, colonne);
  }

  /**
   * Arrivé au sommet d'une échelle (aucun échelon au-dessus), on se pose dessus comme sur un sol : joystick vers le bas,
   * on redescend. Sans ça, on sortait de l'échelle quelques pixels trop bas et on retombait dedans.
   */
  private poseEnHautDeLEchelle(ctx: Contexte, colonne: number): void {
    const c = this.corps;
    const carte = ctx.carte;
    const ty = Math.floor((c.y + c.h - 1) / TUILE);
    if (!carte.props(colonne, ty).echelle || carte.props(colonne, ty - 1).echelle) return;
    if (c.y + c.h > ty * TUILE + 1) return;
    c.y = ty * TUILE - c.h;
    c.vy = 0;
    c.auSol = true;
    this.echelle = false;
  }

  private chercheTyrolienne(ctx: Contexte): void {
    const mx = this.cx;
    const my = this.corps.y - 2;
    for (const t of ctx.tyroliennes) {
      if (mx < t.x1 || mx > t.x2) continue;
      const ly = t.y1 + ((mx - t.x1) / (t.x2 - t.x1)) * (t.y2 - t.y1);
      if (Math.abs(ly - my) < 7 && this.corps.vy > -1.5) {
        this.tyro = t;
        this.corps.vy = 0;
        ctx.son('tyrolienne', mx, my);
        return;
      }
    }
  }

  private majTyrolienne(ctx: Contexte): void {
    const t = this.tyro!;
    const c = this.corps;
    const k = this.commandes;
    const pente = (t.y2 - t.y1) / (t.x2 - t.x1);
    const sens = Math.abs(pente) < 0.12 ? k.horizontal || Math.sign(c.vx) : Math.sign(pente);
    if (sens) this.dir = sens > 0 ? 1 : -1;
    const cible = Math.abs(pente) < 0.12 ? 2.2 : 3.8;
    c.vx += borne(sens * cible - c.vx, -0.12, 0.12);
    c.x += c.vx;
    const mx = this.cx;
    c.y = t.y1 + ((mx - t.x1) / (t.x2 - t.x1)) * (t.y2 - t.y1) + 2;
    c.vy = 0;
    const lache = k.appuye(C.SAUT) || k.tenu(C.BAS) || mx <= t.x1 || mx >= t.x2;
    // on ne lâche que si le câble rentre dans un mur (la tête cogne), pas si les pieds frôlent le sol
    if (lache || ctx.carte.solideEnPixel(mx, c.y + 2)) {
      this.tyro = null;
      this.lacheTyro = 20;
      if (k.appuye(C.SAUT)) c.vy = -SAUT * 0.8;
    }
  }

  private majTir(ctx: Contexte): void {
    const k = this.commandes;
    this.angle = angleVisee(k, !this.corps.auSol);
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    const bouche = {
      x: this.cx + this.dir * 5 * cos,
      y: this.corps.y + 5 - 6.5 * sin,
      dir: this.dir,
      angle: this.angle,
    };
    if (this.solo > 0) {
      this.solo--;
      if (this.solo % 3 === 0) tire(ctx, bouche, SOLO, ctx.rng.entre(-0.5, 0.5));
      if (this.solo % 9 === 0) ctx.son('solo', this.cx, this.cy);
    }
    if (k.appuye(C.SPECIAL) && this.speciaux > 0 && !this.slam) {
      this.speciaux--;
      this.def.special.lance(ctx, { ...bouche, angle: 0 }, this);
      ctx.son('special', this.cx, this.cy);
    }
    if (!k.tenu(C.TIR) || this.recharge > 0 || this.ebloui > 0) return;
    const a = this.armeActuelle;
    a.tir(ctx, bouche);
    this.recharge = a.cadence;
    // l'instrument du héros joue la note suivante de son riff (voir audio/melodies.ts) ; une arme ramassée, son bruit
    ctx.son(this.arme ? a.son : `${a.son}:${this.notes++ % 256}`, this.cx, this.cy);
    if (this.arme && --this.munitions <= 0) this.arme = 0;
  }

  vue(): EntiteVue {
    const c = this.corps;
    let e: number = ANIM.DEBOUT;
    if (this.mort) e = ANIM.MORT;
    else if (this.tyro) e = ANIM.TYROLIENNE;
    else if (this.echelle) e = ANIM.ECHELLE;
    else if (!c.auSol) e = this.contreMur ? ANIM.MUR : ANIM.SAUT;
    else if (Math.abs(c.vx) > 0.3) e = ANIM.COURT;
    const tire = this.recharge > this.armeActuelle.cadence - 4 || this.solo > 0;
    return {
      id: this.id,
      g: this.def.genre,
      x: this.cx,
      y: c.y + c.h,
      gauche: this.dir < 0,
      clignote: this.invulnerable > 0 && this.invulnerable % 8 < 4,
      aura: this.invincible > 0,
      e,
      // 4 bits de phase d'animation (cycle de 12 pas de 3 ticks : 6 images de course de 6 ticks chacune, sans à-coup),
      // 3 bits de visée, 1 bit « tire »
      f: (Math.floor(this.anim / 3) % 12) | (codeVisee(this.angle) << 4) | (tire ? 128 : 0),
    };
  }
}
