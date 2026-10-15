import { TUILE } from '../../config';
import type { Cible, Contexte } from '../../jeu/contexte';
import { G } from '../../jeu/vue';
import { Projectile } from '../projectile';
import { DROP, HYPNOSE, LASER, ONDE_SOL } from '../projectiles-ennemis';
import { Boss } from './boss';
import { ENNEMIS_PAR_LETTRE } from './definitions';
import { Ennemi } from './ennemi';

/** Une des enceintes du DJ : tant qu'elles tiennent, il est protégé par les basses. */
export class Enceinte extends Boss {
  /** ticks depuis le dernier temps : la membrane gonfle d'un coup puis se dégonfle */
  private battement = 99;

  constructor(
    ctx: Contexte,
    x: number,
    y: number,
    private readonly dj: DjBoucle,
  ) {
    super(ctx, G.ENCEINTE, 30, x, y, 20, 30, 1000, 0);
  }

  override maj(ctx: Contexte): void {
    this.eveille = this.dj.eveille;
    this.anim++;
    if (this.flash > 0) this.flash--;
    if (!this.eveille) return;
    // poses de sa planche (outils/fixe-objets.py) : 0 au repos, 3 la plus gonflée
    this.battement = ctx.surLeTemps ? 0 : this.battement + 1;
    this.pose = Math.max(0, 3 - Math.floor(this.battement / 4));
    // une onde au sol sur chaque premier temps
    if (ctx.surLeTemps && ctx.numeroTemps % 4 === 0) {
      const pied = this.corps.y + this.corps.h - 6;
      for (const s of [-1, 1] as const)
        ctx.ajoute(new Projectile(ctx, ONDE_SOL, 'ennemis', this.cx + s * 14, pied, s * ONDE_SOL.vitesse, 0));
      ctx.son('boum', this.cx, this.cy);
    }
  }

  protected agit(): void {}

  protected meurt(ctx: Contexte): void {
    ctx.explosion(this.cx, this.cy, 40, 4, 'tous');
    ctx.ennemiVaincu(this.cx, this.cy, this.points, G.DJ);
    ctx.texte(this.cx, this.cy - 20, 'LARSEN FATAL', '#ff4fd8');
  }
}

/**
 * DJ Boucle, le grand méchant : il produit des beats volontairement
 * répétitifs pour hypnotiser les foules. Lasers en éventail, anneaux
 * d'hypnose (commandes inversées), danseurs en renfort, et, sous la moitié
 * de sa vie, LE DROP : une pluie de bombes.
 */
export class DjBoucle extends Boss {
  readonly enceintes: Enceinte[] = [];

  constructor(ctx: Contexte, x: number, y: number) {
    super(ctx, G.DJ, 160, x, y, 36, 30, 10000, 230);
    for (const s of [-1, 1]) {
      const e = new Enceinte(ctx, x + s * 7 * TUILE, y, this);
      this.enceintes.push(e);
      ctx.ajoute(e);
    }
  }

  protected override resistance(): number {
    return this.enceintes.some((e) => !e.fini) ? 0.35 : 1;
  }

  protected override reveille(ctx: Contexte): void {
    ctx.evenement({
      k: 'bulle',
      qui: 'DJ',
      texte: 'Bienvenue au club, les dinosaures. Ce soir, le morceau dure toute la nuit.',
    });
    ctx.son('sirene', this.cx, this.cy);
  }

  protected agit(ctx: Contexte, cible: Cible): void {
    this.dir = cible.x > this.cx ? 1 : -1;
    this.pose = ctx.numeroTemps % 2;
    if (!ctx.surLeTemps) return;
    const n = ctx.numeroTemps;
    const enrage = this.ratio < 0.5;
    if (n % 2 === 0) this.eventail(ctx, cible, enrage ? 7 : 5);
    if (n % 8 === 4) {
      const dx = cible.x - this.cx;
      const dy = cible.y - this.cy;
      const d = Math.hypot(dx, dy) || 1;
      ctx.ajoute(
        new Projectile(
          ctx,
          HYPNOSE,
          'ennemis',
          this.cx,
          this.cy,
          (dx / d) * HYPNOSE.vitesse,
          (dy / d) * HYPNOSE.vitesse,
        ),
      );
      ctx.son('hypnose', this.cx, this.cy);
    }
    if (n % 16 === 8) this.renforts(ctx);
    if (enrage && n % 16 === 0) this.leDrop(ctx, cible);
  }

  private eventail(ctx: Contexte, cible: Cible, nb: number): void {
    const base = Math.atan2(cible.y - this.cy, cible.x - this.cx);
    for (let i = 0; i < nb; i++) {
      const a = base + (i - (nb - 1) / 2) * 0.22;
      ctx.ajoute(
        new Projectile(ctx, LASER, 'ennemis', this.cx, this.cy - 6, Math.cos(a) * 3.2, Math.sin(a) * 3.2),
      );
    }
    ctx.son('laser', this.cx, this.cy);
  }

  private renforts(ctx: Contexte): void {
    const nb = ctx.cibles('ennemis').filter((c) => c instanceof Ennemi).length;
    if (nb >= 4) return;
    for (const s of [-1, 1]) {
      const e = new Ennemi(ctx, ENNEMIS_PAR_LETTRE.c!, this.cx + s * 4 * TUILE, this.corps.y);
      e.passeEnAlerte(ctx);
      ctx.ajoute(e);
    }
    ctx.texte(this.cx, this.corps.y - 16, 'TOUT LE MONDE SUR LA PISTE !', '#ff4fd8');
  }

  private leDrop(ctx: Contexte, cible: Cible): void {
    ctx.texte(this.cx, this.corps.y - 30, 'LE DROP ARRIVE...', '#ff4fd8');
    ctx.secoue(8);
    for (let i = 0; i < 7; i++) {
      const x = cible.x + (i - 3) * 36 + ctx.rng.entre(-10, 10);
      ctx.ajoute(new Projectile(ctx, DROP, 'ennemis', x, cible.y - 200 - ctx.rng.entre(0, 60), 0, 0));
    }
  }

  protected meurt(ctx: Contexte): void {
    for (const e of this.enceintes) if (!e.fini) e.blesse(999, ctx);
    ctx.explosion(this.cx, this.cy, 70, 0, 'heros');
    ctx.ennemiVaincu(this.cx, this.cy, this.points, G.DJ);
    ctx.secoue(30);
    ctx.evenement({ k: 'bulle', qui: 'DJ', texte: 'Attendez... ce riff... c’est en ré ? J’adore le ré...' });
  }
}
