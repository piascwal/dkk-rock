import { HAUTEUR_VUE, TUILE } from '../config';
import { borne } from '../moteur/maths';

/** Où le héros se tient dans la hauteur de la vue (en fraction depuis le haut) : plus bas que le milieu, on voit plus au-dessus. */
export const POSITION_HEROS = 0.58;

/** La caméra suit un point en douceur, avec une avance dans le sens de la course, et reste dans le niveau. */
export class Camera {
  x = 0;
  y = 0;
  private initialisee = false;

  suit(cx: number, cy: number, largeurVue: number, largeurMonde: number, hauteurMonde: number): void {
    const vx = cx - largeurVue / 2;
    const vy = cy - HAUTEUR_VUE * POSITION_HEROS;
    if (!this.initialisee) {
      this.x = vx;
      this.y = vy;
      this.initialisee = true;
    }
    this.x += (vx - this.x) * 0.12;
    this.y += (vy - this.y) * 0.1;
    this.x = borne(this.x, 0, Math.max(0, largeurMonde - largeurVue));
    this.y = borne(this.y, -TUILE * 5, Math.max(0, hauteurMonde - HAUTEUR_VUE));
  }

  /** Le prochain suivi recadre d'un coup (changement de niveau). */
  recadre(): void {
    this.initialisee = false;
  }
}
