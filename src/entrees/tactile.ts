import { C } from '../jeu/commandes';

const ZONE_MORTE = 12;

/**
 * Commandes tactiles : un joystick qui apparaît sous le pouce gauche, trois
 * boutons sous le pouce droit (saut, tir, spécial). Plusieurs doigts à la fois.
 */
export class Tactile {
  private joystick: { id: number; x: number; y: number; dx: number; dy: number } | null = null;
  private readonly boutons = new Map<number, number>();
  readonly element: HTMLElement;
  private readonly base: HTMLElement;
  private readonly manche: HTMLElement;

  constructor(parent: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'tactile';
    this.element.innerHTML = `
      <div class="zone-joystick"><div class="joystick-base"><div class="joystick-manche"></div></div></div>
      <div class="boutons">
        <button class="bouton special" data-c="${C.SPECIAL}" aria-label="Spécial">★</button>
        <button class="bouton tir" data-c="${C.TIR}" aria-label="Tir">TIR</button>
        <button class="bouton saut" data-c="${C.SAUT}" aria-label="Saut">SAUT</button>
      </div>`;
    parent.appendChild(this.element);
    this.base = this.element.querySelector('.joystick-base')!;
    this.manche = this.element.querySelector('.joystick-manche')!;

    const zone = this.element.querySelector<HTMLElement>('.zone-joystick')!;
    zone.addEventListener('pointerdown', (e) => {
      if (this.joystick) return;
      zone.setPointerCapture(e.pointerId);
      this.joystick = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
      this.base.style.left = `${e.clientX}px`;
      this.base.style.top = `${e.clientY}px`;
      this.base.classList.add('actif');
      this.place();
    });
    zone.addEventListener('pointermove', (e) => {
      const j = this.joystick;
      if (!j || j.id !== e.pointerId) return;
      j.dx = e.clientX - j.x;
      j.dy = e.clientY - j.y;
      this.place();
    });
    const lache = (e: PointerEvent) => {
      if (this.joystick?.id !== e.pointerId) return;
      this.joystick = null;
      this.base.classList.remove('actif');
    };
    zone.addEventListener('pointerup', lache);
    zone.addEventListener('pointercancel', lache);

    for (const b of this.element.querySelectorAll<HTMLElement>('.bouton')) {
      const c = Number(b.dataset.c);
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        this.boutons.set(e.pointerId, c);
        b.classList.add('appuye');
        navigator.vibrate?.(8);
      });
      const fin = (e: PointerEvent) => {
        this.boutons.delete(e.pointerId);
        b.classList.remove('appuye');
      };
      b.addEventListener('pointerup', fin);
      b.addEventListener('pointercancel', fin);
    }
  }

  private place(): void {
    const j = this.joystick;
    if (!j) return;
    const n = Math.hypot(j.dx, j.dy);
    const k = n > 40 ? 40 / n : 1;
    this.manche.style.transform = `translate(${j.dx * k}px, ${j.dy * k}px)`;
  }

  get commandes(): number {
    let bits = 0;
    for (const c of this.boutons.values()) bits |= c;
    const j = this.joystick;
    if (j && Math.hypot(j.dx, j.dy) > ZONE_MORTE) {
      const a = Math.atan2(j.dy, j.dx);
      const cx = Math.cos(a);
      const cy = Math.sin(a);
      if (cx < -0.38) bits |= C.GAUCHE;
      if (cx > 0.38) bits |= C.DROITE;
      if (cy < -0.6) bits |= C.HAUT;
      if (cy > 0.6) bits |= C.BAS;
    }
    return bits;
  }

  montre(visible: boolean): void {
    this.element.hidden = !visible;
  }
}
