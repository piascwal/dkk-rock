import type { Cible, Contexte } from '../../jeu/contexte';
import { G } from '../../jeu/vue';
import { appliqueGravite, deplace } from '../../monde/physique';
import { Projectile } from '../projectile';
import { ONDE_SOL } from '../projectiles-ennemis';
import { Boss } from './boss';
import { ENNEMIS_PAR_LETTRE } from './definitions';
import { Ennemi } from './ennemi';

/**
 * Le Champion du FISE, vainqueur de la Pro Series et roi du BMX. Il roule sur le temps : au premier temps de la mesure, il
 * s'élance en ligne droite sur le héros (il le blesse au contact et rebondit sur les murs) ; au troisième, il saute en
 * figure et, en retombant, lance deux ondes au ras du sol. Aux deux tiers puis au tiers de sa vie, il appelle deux riders.
 */
/** Les poses de sa planche (lignes ANIM) : il roule (0) ou il est en figure, en l'air (10). */
const POSE = { ROULE: 0, FIGURE: 10 } as const;
const VITESSE_ELAN = 3.6;
const DUREE_ELAN = 42;
const SAUT = -7.5;

export class Champion extends Boss {
  private elan = 0;
  private enLAir = false;
  /** les appels de renfort déjà faits (aux deux tiers, puis au tiers de sa vie) */
  private appels = 0;

  constructor(ctx: Contexte, x: number, y: number) {
    super(ctx, G.CHAMPION, 60, x, y, 24, 34, 3500, 240);
  }

  protected override reveille(ctx: Contexte): void {
    ctx.evenement({
      k: 'bulle',
      qui: 'NARRATEUR',
      texte:
        'Le Champion du FISE entre en piste, sous les huées du public (qui l’adore). Il n’aime pas les rockers.',
    });
    ctx.son('alerte', this.cx, this.cy);
  }

  protected agit(ctx: Contexte, cible: Cible): void {
    const c = this.corps;
    if (ctx.surLeTemps) {
      const temps = ctx.numeroTemps % 4;
      if (temps === 0 && c.auSol) {
        this.dir = cible.x > this.cx ? 1 : -1;
        this.elan = DUREE_ELAN;
        ctx.son('derapage', this.cx, this.cy);
      } else if (temps === 2 && c.auSol) {
        this.dir = cible.x > this.cx ? 1 : -1;
        c.vy = SAUT;
        c.vx = Math.max(-3, Math.min(3, (cible.x - this.cx) / 35));
        this.enLAir = true;
        this.elan = 0;
        ctx.son('saut', this.cx, this.cy);
      }
    }
    if (this.elan > 0) {
      this.elan--;
      c.vx = this.dir * VITESSE_ELAN;
    } else if (c.auSol) c.vx *= 0.85;
    // un mur : il fait demi-tour, élan gardé
    if (c.mur && c.auSol) {
      this.dir = -this.dir as 1 | -1;
      c.vx = this.dir * VITESSE_ELAN;
    }
    appliqueGravite(c);
    deplace(c, ctx.carte);
    this.pose = c.auSol ? POSE.ROULE : POSE.FIGURE;
    if (this.enLAir && c.auSol) {
      this.enLAir = false;
      ctx.secoue(12);
      ctx.son('boum', this.cx, this.cy);
      const pied = c.y + c.h - 6;
      for (const s of [-1, 1] as const)
        ctx.ajoute(new Projectile(ctx, ONDE_SOL, 'ennemis', this.cx + s * 14, pied, s * ONDE_SOL.vitesse, 0));
    }
    // des renforts : deux riders, des deux côtés de la piste
    if (this.appels < 2 && this.ratio < 1 - 0.34 * (this.appels + 1)) {
      this.appels++;
      const def = ENNEMIS_PAR_LETTRE[this.appels === 1 ? 's' : 'x']!;
      for (const s of [-1, 1]) ctx.ajoute(new Ennemi(ctx, def, this.cx + s * 90, c.y - 24));
      ctx.evenement({ k: 'bulle', qui: 'NARRATEUR', texte: 'Le Champion appelle ses amis : des riders !' });
    }
  }

  protected meurt(ctx: Contexte): void {
    ctx.explosion(this.cx, this.cy, 50, 0, 'heros');
    ctx.ennemiVaincu(this.cx, this.cy, this.points, G.CHAMPION);
    ctx.evenement({
      k: 'bulle',
      qui: 'NARRATEUR',
      texte: 'Le Champion met pied à terre, ôte son casque et demande un autographe. Au groupe.',
    });
    ctx.secoue(18);
  }
}
