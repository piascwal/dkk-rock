import type { Sauvegarde } from '../jeu/sauvegarde';
import type { EtatVue } from '../jeu/vue';
import type { Recrue } from './recrue';

/**
 * Une recrue : le membre que l'on joue vient de changer. Au début de la partie (premier tour de jeu) et quand une cage s'ouvre, on
 * coupe la scène pour le présenter ; le remplaçant d'un héros tombé arrive sans cérémonie.
 */
export class SuiviRecrue {
  /** le membre que l'on jouait à la dernière image, et si on était à terre : pour savoir qu'une recrue arrive */
  private membreVu: number | null = null;
  private etaitMort = false;

  constructor(
    private readonly recrue: () => Recrue,
    private readonly sauvegarde: Sauvegarde,
    private readonly enregistre: () => void,
    private readonly appliqueOptions: () => void,
  ) {}

  /** Une nouvelle partie : la première recrue sera présentée. */
  oublie(): void {
    this.membreVu = null;
  }

  maj(v: EtatVue, siege: number): void {
    const moi = v.joueurs[siege];
    // en battle royale, pas d'animation de recrue : la manche démarre tout de suite
    if (v.phase !== 'jeu' || !moi?.present || v.arene) return;
    const avant = this.membreVu;
    const mort = this.etaitMort;
    this.membreVu = moi.membre;
    this.etaitMort = moi.mort;
    if (this.sauvegarde.membre !== moi.membre) {
      this.sauvegarde.membre = moi.membre;
      this.enregistre();
    }
    if (avant === null) this.recrue().joue(moi.membre, 'depart', () => this.appliqueOptions());
    else if (avant !== moi.membre && !mort && !moi.mort) this.recrue().joue(moi.membre, 'cage', () => {});
  }
}
