import { HAUTEUR_VUE } from '../config';
import { ZOOM_KART } from '../jeu/kart';
import { EFFETS_KART, type VueKart } from '../jeu/vue-kart';
import { annonceKart, ecranChoix, ecranPodium, hudKart } from './kart-ecrans';
import { FlottantsKart } from './kart-flottants';
import { dessineCaisses, dessineFlaque, dessineMonde, dessineVoiture } from './kart-piste';

/**
 * Le Grand Prix de la Sarré à l'écran, d'après la seule vue (comme chez un invité) : le choix des pilotes, la course vue d'en
 * haut (la caméra de la simulation, assez haut pour voir venir les virages), le podium. Voir kart-piste.ts et kart-ecrans.ts.
 */
export class RenduKart {
  private readonly flottants = new FlottantsKart();

  dessine(ctx: CanvasRenderingContext2D, v: VueKart, largeur: number, tick: number): void {
    this.flottants.maj(v);
    if (v.etape === 'choix') return ecranChoix(ctx, largeur, v, tick);
    if (v.etape === 'podium') return ecranPodium(ctx, largeur, v, tick);
    ctx.fillStyle = '#5a9640';
    ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
    ctx.save();
    // un coup de marteau sur une voiture de joueur fait trembler l'écran
    const s = this.flottants.secousse;
    if (s > 0) this.flottants.secousse--;
    ctx.translate(
      largeur / 2 + (s > 0 ? Math.round(Math.sin(tick * 2.3) * s * 0.4) : 0),
      HAUTEUR_VUE / 2 + (s > 0 ? Math.round(Math.cos(tick * 3.1) * s * 0.3) : 0),
    );
    ctx.scale(ZOOM_KART, ZOOM_KART);
    ctx.translate(-v.camX, -v.camY);
    ctx.imageSmoothingEnabled = true;
    dessineMonde(ctx);
    ctx.imageSmoothingEnabled = false;
    dessineCaisses(ctx, v.caisses, tick);
    for (const f of v.flaques) dessineFlaque(ctx, f.x, f.y);
    // les voitures au sol d'abord, celles en l'air (le ressort) par-dessus ; les éliminées ne sont plus là
    const enPiste = v.voitures.filter((x) => !(x.effets & EFFETS_KART.elimine));
    for (const x of enPiste) if (!(x.effets & EFFETS_KART.saut)) dessineVoiture(ctx, x, tick);
    for (const x of enPiste) if (x.effets & EFFETS_KART.saut) dessineVoiture(ctx, x, tick);
    this.flottants.dessine(ctx);
    ctx.restore();
    hudKart(ctx, largeur, v, tick);
    annonceKart(ctx, largeur, v);
  }
}
