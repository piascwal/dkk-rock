import type { Cible, Contexte } from '../../jeu/contexte';
import { G } from '../../jeu/vue';
import { appliqueGravite, deplace } from '../../monde/physique';
import { Projectile } from '../projectile';
import { BOULE_NEIGE, GROSSE_BOULE, ONDE_SOL } from '../projectiles-ennemis';
import { Boss } from './boss';

/**
 * Le Yéti Alpha, gardien des cimes et de la techno minimale. Il saute sur le
 * premier temps de chaque mesure (avalanche à l'atterrissage) et fait rouler
 * une énorme boule sur le troisième.
 */
export class YetiAlpha extends Boss {
  private enLAir = false;

  constructor(ctx: Contexte, x: number, y: number) {
    super(ctx, G.YETI_ALPHA, 70, x, y, 28, 34, 3000, 220);
  }

  protected override reveille(ctx: Contexte): void {
    ctx.evenement({
      k: 'bulle',
      qui: 'YETI',
      texte: 'Vous entendez ? Rien. Juste le kick. C’est ÇA, la musique.',
    });
    ctx.son('rugissement', this.cx, this.cy);
  }

  protected agit(ctx: Contexte, cible: Cible): void {
    const c = this.corps;
    this.dir = cible.x > this.cx ? 1 : -1;
    if (ctx.surLeTemps) {
      const temps = ctx.numeroTemps % 4;
      if (temps === 0 && c.auSol) {
        c.vy = -6.5;
        c.vx = Math.max(-2.5, Math.min(2.5, (cible.x - this.cx) / 40));
        this.enLAir = true;
      } else if (temps === 2) {
        ctx.ajoute(
          new Projectile(ctx, GROSSE_BOULE, 'ennemis', this.cx + this.dir * 18, this.cy, this.dir * 2.6, -1),
        );
        ctx.son('rugissement', this.cx, this.cy);
      }
    }
    appliqueGravite(c);
    deplace(c, ctx.carte);
    if (c.auSol) c.vx *= 0.8;
    this.pose = c.auSol ? ctx.numeroTemps % 2 : 2;
    if (this.enLAir && c.auSol) {
      this.enLAir = false;
      ctx.secoue(14);
      ctx.son('boum', this.cx, this.cy);
      const pied = c.y + c.h - 6;
      for (const s of [-1, 1] as const)
        ctx.ajoute(new Projectile(ctx, ONDE_SOL, 'ennemis', this.cx + s * 16, pied, s * ONDE_SOL.vitesse, 0));
      // l'avalanche
      for (let i = 0; i < 3 + (this.ratio < 0.5 ? 2 : 0); i++) {
        const x = cible.x + ctx.rng.entre(-90, 90);
        ctx.ajoute(new Projectile(ctx, BOULE_NEIGE, 'ennemis', x, cible.y - 170 - i * 20, 0, 1));
      }
    }
  }

  protected meurt(ctx: Contexte): void {
    ctx.explosion(this.cx, this.cy, 50, 0, 'heros');
    ctx.ennemiVaincu(this.cx, this.cy, this.points);
    ctx.evenement({ k: 'bulle', qui: 'YETI', texte: 'Le minimal... c’était... l’espace... entre les...' });
    ctx.secoue(20);
  }
}
