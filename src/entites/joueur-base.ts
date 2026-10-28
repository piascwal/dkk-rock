import { HEROS_HAUTEUR, HEROS_LARGEUR, INVULNERABLE, PV_HEROS, SPECIAUX_DEPART } from '../config';
import { EtatCommandes } from '../jeu/commandes';
import type { Camp, Cible, Contexte, Tyrolienne } from '../jeu/contexte';
import { nouveauCorps, type Corps } from '../monde/physique';
import { armeRamassee, type Compagnon, type DefArme } from './armes';
import { HEROS, type DefHeros, type EtatSpecial } from './heros';

/** Un héros contrôlé par un joueur (local ou distant : la simulation ne fait pas la différence). */
export abstract class JoueurBase implements Cible, EtatSpecial {
  readonly camp: Camp = 'heros';
  readonly corps: Corps;
  readonly commandes = new EtatCommandes();
  dir: 1 | -1 = 1;
  pv = PV_HEROS;
  speciaux = SPECIAUX_DEPART;
  /** 0 = l'instrument, sinon index dans ARMES_RAMASSABLES + 1 */
  arme = 0;
  munitions = 0;
  /** le chauffage soufflant qui l'accompagne, tant que l'arme a des munitions */
  compagnon: Compagnon | null = null;
  mort = false;
  delaiReapparition = 0;
  invulnerable = INVULNERABLE;
  /** ticks d'invincibilité restants (le cœur d'or WOG) : aucun dégât, et l'aura se voit */
  invincible = 0;
  /** monté dans le van qui part : ni vu, ni touché, ni commandé */
  embarque = false;
  solo = 0;
  slam = false;
  /** ébloui par un selfie : ne peut plus tirer */
  ebloui = 0;
  /** hypnotisé par le DJ : commandes inversées */
  hypnose = 0;
  protected recharge = 0;
  protected echelle = false;
  protected tyro: Tyrolienne | null = null;
  protected anim = 0;
  /** la phase d'animation sur une échelle : elle n'avance que lorsque le joystick monte ou descend */
  protected animEchelle = 0;
  protected angle = 0;
  /** en battle royale : le héros qui l'a touché en dernier (son identifiant), à qui revient l'élimination */
  dernierTireur: number | null = null;
  /** dégâts encaissés ce pas-ci (les effets de zone ne comptent qu'une fois) */
  private dejaBlesse = -1;

  constructor(
    readonly id: number,
    readonly siege: number,
    public membre: number,
    x: number,
    y: number,
  ) {
    this.corps = nouveauCorps(x, y, HEROS_LARGEUR, HEROS_HAUTEUR);
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

  get surEchelle(): boolean {
    return this.echelle;
  }

  get surTyrolienne(): boolean {
    return this.tyro !== null;
  }

  vivant(): boolean {
    return !this.mort;
  }

  blesse(degats: number, ctx: Contexte, dx: number): void {
    if (this.mort || this.invulnerable > 0 || this.invincible > 0 || this.dejaBlesse === ctx.tick) return;
    this.dejaBlesse = ctx.tick;
    this.dernierTireur = ctx.tireur ?? null;
    this.pv -= Math.max(1, Math.round(degats));
    // en battle royale, aucune protection après un coup : le suivant touche aussi
    if (!ctx.arene) this.invulnerable = INVULNERABLE;
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
    // en battle royale, c'est le fil des éliminations qui l'annonce (voir jeu/arene.ts)
    if (!ctx.arene) ctx.evenement({ k: 'bulle', qui: this.def.qui, texte: ctx.rng.choix(this.def.mort) });
  }

  /** Remet le héros en jeu (réapparition ou changement de membre). */
  reapparait(x: number, y: number, membre: number): void {
    this.embarque = false;
    Object.assign(this.corps, { x, y, vx: 0, vy: 0 });
    this.membre = membre;
    this.mort = false;
    this.pv = PV_HEROS;
    this.speciaux = Math.max(this.speciaux, SPECIAUX_DEPART);
    this.arme = 0;
    this.compagnon = null;
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
}
