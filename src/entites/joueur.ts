import { INVULNERABLE, PV_HEROS, SPECIAUX_DEPART, TUILE } from '../config';
import { borne } from '../moteur/maths';
import { appliqueGravite, deplace, nouveauCorps, toucheMur, type Corps } from '../monde/physique';
import { C, EtatCommandes, inverse, type Commandes } from '../jeu/commandes';
import type { Camp, Cible, Contexte, Tyrolienne } from '../jeu/contexte';
import { ANIM, type EntiteVue } from '../jeu/vue';
import { tire, armeRamassee, type DefArme } from './armes';
import { HEROS, type DefHeros, type EtatSpecial } from './heros';
import { SOLO } from './projectiles-defs';

const VITESSE = 1.75;
const SAUT = 5.5;
const SAUT_MUR = 5;
const VITESSE_ECHELLE = 1.4;
const GRIMPE_MAX = 40;

/** Un héros contrôlé par un joueur (local ou distant : la simulation ne fait pas la différence). */
export class Joueur implements Cible, EtatSpecial {
  readonly camp: Camp = 'heros';
  readonly corps: Corps;
  readonly commandes = new EtatCommandes();
  dir: 1 | -1 = 1;
  pv = PV_HEROS;
  speciaux = SPECIAUX_DEPART;
  /** 0 = l'instrument, sinon index dans ARMES_RAMASSABLES + 1 */
  arme = 0;
  munitions = 0;
  mort = false;
  delaiReapparition = 0;
  invulnerable = INVULNERABLE;
  solo = 0;
  slam = false;
  /** ébloui par un selfie : ne peut plus tirer */
  ebloui = 0;
  /** hypnotisé par le DJ : commandes inversées */
  hypnose = 0;
  private recharge = 0;
  private coyote = 0;
  private tamponSaut = 0;
  private verrouHorizontal = 0;
  private grimpe = GRIMPE_MAX;
  private traverse = 0;
  private echelle = false;
  private tyro: Tyrolienne | null = null;
  private lacheTyro = 0;
  private anim = 0;
  private contreMur = false;
  /** dégâts encaissés ce pas-ci (les effets de zone ne comptent qu'une fois) */
  private dejaBlesse = -1;

  constructor(
    readonly id: number,
    readonly siege: number,
    public membre: number,
    x: number,
    y: number,
  ) {
    this.corps = nouveauCorps(x, y, 10, 14);
  }

  get def(): DefHeros {
    return HEROS[this.membre]!;
  }

  get armeActuelle(): DefArme {
    return armeRamassee(this.arme) ?? this.def.arme;
  }

  // ——— Cible ———
  get x(): number {
    return this.corps.x;
  }
  get y(): number {
    return this.corps.y;
  }
  get w(): number {
    return this.corps.w;
  }
  get h(): number {
    return this.corps.h;
  }
  /** pour le recul des tirs */
  get vx(): number {
    return this.corps.vx;
  }
  set vx(v: number) {
    this.corps.vx = v;
  }
  get cx(): number {
    return this.corps.x + this.corps.w / 2;
  }
  get cy(): number {
    return this.corps.y + this.corps.h / 2;
  }

  vivant(): boolean {
    return !this.mort;
  }

  blesse(degats: number, ctx: Contexte, dx: number): void {
    if (this.mort || this.invulnerable > 0 || this.dejaBlesse === ctx.tick) return;
    this.dejaBlesse = ctx.tick;
    this.pv -= Math.max(1, Math.round(degats));
    this.invulnerable = INVULNERABLE;
    this.corps.vx = dx * 2.5;
    this.corps.vy = -2.5;
    this.tyro = null;
    this.echelle = false;
    ctx.son('aie', this.cx, this.cy);
    if (this.pv <= 0) this.meurt(ctx);
  }

  subitEffet(effet: 'hypnose' | 'eblouit'): void {
    if (this.mort) return;
    if (effet === 'hypnose') this.hypnose = 240;
    else this.ebloui = 60;
  }

  meurt(ctx: Contexte): void {
    if (this.mort) return;
    this.mort = true;
    this.pv = 0;
    this.solo = 0;
    this.tyro = null;
    this.echelle = false;
    ctx.son('mort', this.cx, this.cy);
    ctx.evenement({ k: 'bulle', qui: this.def.qui, texte: ctx.rng.choix(this.def.mort) });
  }

  /** Remet le héros en jeu (réapparition ou changement de membre). */
  reapparait(x: number, y: number, membre: number): void {
    Object.assign(this.corps, { x, y, vx: 0, vy: 0 });
    this.membre = membre;
    this.mort = false;
    this.pv = PV_HEROS;
    this.speciaux = Math.max(this.speciaux, SPECIAUX_DEPART);
    this.arme = 0;
    this.invulnerable = INVULNERABLE;
    this.hypnose = 0;
    this.ebloui = 0;
  }

  ramasseArme(i: number): void {
    const a = armeRamassee(i);
    if (!a) return;
    this.arme = i;
    this.munitions = a.munitions;
  }

  maj(ctx: Contexte, cmd: Commandes): void {
    this.commandes.avance(this.hypnose > 0 ? inverse(cmd) : cmd);
    if (this.mort) return;
    for (const k of ['invulnerable', 'ebloui', 'hypnose', 'recharge', 'lacheTyro', 'traverse'] as const)
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
      this.grimpe = GRIMPE_MAX;
    } else if (this.coyote > 0) this.coyote--;
    if (k.appuye(C.SAUT)) this.tamponSaut = 6;
    else if (this.tamponSaut > 0) this.tamponSaut--;

    // descendre d'une plateforme, ou attraper une échelle
    if (this.surEchelle(ctx, k.vertical) && (k.tenu(C.HAUT) || k.tenu(C.BAS)) && !k.tenu(C.SAUT)) {
      this.echelle = true;
      c.vx = 0;
      return;
    }
    if (k.tenu(C.BAS) && this.tamponSaut > 0 && c.auSol) {
      this.traverse = 10;
      this.tamponSaut = 0;
    }

    const contreMur = !c.auSol && h !== 0 && toucheMur(c, ctx.carte, h > 0 ? 1 : -1);
    this.contreMur = contreMur;
    if (this.tamponSaut > 0 && (this.coyote > 0 || contreMur)) {
      this.tamponSaut = 0;
      this.coyote = 0;
      if (contreMur && !c.auSol) {
        // saut contre le mur, à la Broforce
        c.vy = -SAUT_MUR;
        c.vx = -h * 2.4;
        this.dir = h > 0 ? -1 : 1;
        this.verrouHorizontal = 10;
      } else c.vy = -SAUT;
      ctx.son('saut', this.cx, this.cy);
    }
    if (contreMur && k.tenu(C.HAUT) && this.grimpe > 0) {
      this.grimpe--;
      c.vy = -1.6;
    } else if (contreMur && c.vy > 1.2) c.vy = 1.2;

    const gravite = c.vy < 0 && !k.tenu(C.SAUT) ? 2 : 1;
    if (this.slam) c.vy = Math.max(c.vy, 0) + 0.5;
    appliqueGravite(c, gravite);
    deplace(c, ctx.carte, this.traverse > 0);
    if (this.slam && c.auSol) this.atterrissageSlam(ctx);
    if (this.lacheTyro === 0) this.chercheTyrolienne(ctx);
  }

  private atterrissageSlam(ctx: Contexte): void {
    this.slam = false;
    const y = this.corps.y + this.corps.h - 4;
    for (const dx of [0, -22, 22, -44, 44]) ctx.explosion(this.cx + dx, y, 22, 5, 'heros');
    ctx.secoue(10);
    ctx.texte(this.cx, y - 24, 'SLAP !', '#9b5de5');
  }

  private surEchelle(ctx: Contexte, vertical: number): boolean {
    const tx = Math.floor(this.cx / TUILE);
    const pied = this.corps.y + this.corps.h + (vertical > 0 ? 2 : -2);
    return (
      ctx.carte.props(tx, Math.floor(this.cy / TUILE)).echelle ||
      ctx.carte.props(tx, Math.floor(pied / TUILE)).echelle
    );
  }

  private majEchelle(ctx: Contexte): void {
    const c = this.corps;
    const k = this.commandes;
    const v = k.vertical;
    if (k.appuye(C.SAUT) || !this.surEchelle(ctx, v)) {
      this.echelle = false;
      if (k.appuye(C.SAUT)) c.vy = -SAUT * 0.8;
      return;
    }
    // on se recentre sur l'échelle
    const centre = (Math.floor(this.cx / TUILE) + 0.5) * TUILE - c.w / 2;
    c.x += borne(centre - c.x, -1, 1);
    c.vx = k.horizontal * 0.8;
    c.vy = v * VITESSE_ECHELLE;
    if (k.horizontal) this.dir = k.horizontal > 0 ? 1 : -1;
    deplace(c, ctx.carte, true);
    if (v > 0 && c.auSol) this.echelle = false;
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
    if (lache || ctx.carte.solideEnPixel(mx, c.y + c.h / 2)) {
      this.tyro = null;
      this.lacheTyro = 20;
      if (k.appuye(C.SAUT)) c.vy = -SAUT * 0.8;
    }
  }

  private majTir(ctx: Contexte): void {
    const k = this.commandes;
    const bouche = { x: this.cx + this.dir * 7, y: this.corps.y + 7, dir: this.dir };
    if (this.solo > 0) {
      this.solo--;
      if (this.solo % 3 === 0) tire(ctx, bouche, SOLO, ctx.rng.entre(-0.5, 0.5));
      if (this.solo % 9 === 0) ctx.son('solo', this.cx, this.cy);
    }
    if (k.appuye(C.SPECIAL) && this.speciaux > 0 && !this.slam) {
      this.speciaux--;
      this.def.special.lance(ctx, bouche, this);
      ctx.son('special', this.cx, this.cy);
    }
    if (!k.tenu(C.TIR) || this.recharge > 0 || this.ebloui > 0) return;
    const a = this.armeActuelle;
    a.tir(ctx, bouche);
    this.recharge = a.cadence;
    ctx.son(a.son, this.cx, this.cy);
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
      e,
      f: (this.anim & 127) | (tire ? 128 : 0),
    };
  }
}
