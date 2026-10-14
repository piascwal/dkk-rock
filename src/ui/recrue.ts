import type { Synthe } from '../audio/synthe';
import { ecritCentre } from '../rendu/police';
import { HAUTEUR_CASE, dessineCase } from './intro-comics';
import { joueRecrue } from './intro-son';
import { calibreToile } from './toile-plein-ecran';

/**
 * L'arrivée d'un nouveau membre du groupe, comme dans Broforce : la scène de jeu est coupée, sa case de BD entre en
 * glissant, avec son nom, son instrument et son cri, puis le jeu reprend. Au début de la partie (« À toi de jouer ! ») et
 * à chaque cage ouverte (« Libéré ! »). Un toucher ou une touche l'abrège, après un court instant.
 */
export type Motif = 'depart' | 'cage';

const TEXTES: Record<Motif, string> = { depart: 'À TOI DE JOUER !', cage: 'LIBÉRÉ !' };
/** Durée de l'animation (secondes) et délai avant de pouvoir la passer. */
const DUREE = 1.9;
const AVANT_SAUT = 0.55;

export class Recrue {
  private readonly ctx: CanvasRenderingContext2D;
  private w = 520;
  private debut = 0;
  private membre = 0;
  private motif: Motif = 'depart';
  private actif = false;
  private fin: () => void = () => {};

  constructor(
    private readonly toile: HTMLCanvasElement,
    private readonly synthe: Synthe,
  ) {
    this.ctx = toile.getContext('2d')!;
  }

  /** Vrai pendant l'animation : la partie attend (si on joue seul). */
  get enCours(): boolean {
    return this.actif;
  }

  joue(membre: number, motif: Motif, fin: () => void): void {
    if (this.actif) return;
    this.actif = true;
    this.membre = membre;
    this.motif = motif;
    this.fin = fin;
    this.debut = performance.now();
    this.toile.hidden = false;
    this.w = calibreToile(this.toile, this.ctx, HAUTEUR_CASE);
    window.addEventListener('resize', this.redimensionne);
    window.addEventListener('keydown', this.touche);
    this.toile.addEventListener('click', this.saute);
    joueRecrue(this.synthe, membre);
    requestAnimationFrame(this.image);
  }

  private redimensionne = (): void => {
    this.w = calibreToile(this.toile, this.ctx, HAUTEUR_CASE);
  };

  private touche = (e: KeyboardEvent): void => {
    if (e.code === 'Enter' || e.code === 'Escape' || e.code === 'Space') this.saute();
  };

  private saute = (): void => {
    if ((performance.now() - this.debut) / 1000 > AVANT_SAUT) this.termine();
  };

  private termine(): void {
    if (!this.actif) return;
    this.actif = false;
    this.toile.hidden = true;
    window.removeEventListener('resize', this.redimensionne);
    window.removeEventListener('keydown', this.touche);
    this.toile.removeEventListener('click', this.saute);
    this.fin();
  }

  private image = (): void => {
    if (!this.actif) return;
    const t = (performance.now() - this.debut) / 1000;
    const c = this.ctx;
    // la case occupe tout l'écran ; elle entre et sort en glissant (voir dessineCase)
    c.fillStyle = '#120914';
    c.fillRect(0, 0, this.w, HAUTEUR_CASE);
    dessineCase(c, this.w, this.membre, Math.min(1, t / DUREE), t);
    if (t > 0.25) ecritCentre(c, TEXTES[this.motif], this.w / 2, 16, '#ffd23f', 3);
    if (t >= DUREE) this.termine();
    else requestAnimationFrame(this.image);
  };
}
