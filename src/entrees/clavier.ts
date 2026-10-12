import { C } from '../jeu/commandes';

/** Touches → commandes. ZQSD (AZERTY) et WASD (QWERTY) marchent toutes les deux, et les flèches. */
const TOUCHES: Record<string, number> = {
  ArrowLeft: C.GAUCHE,
  KeyA: C.GAUCHE,
  KeyQ: C.GAUCHE,
  ArrowRight: C.DROITE,
  KeyD: C.DROITE,
  ArrowUp: C.HAUT,
  KeyW: C.HAUT,
  KeyZ: C.HAUT,
  ArrowDown: C.BAS,
  KeyS: C.BAS,
  Space: C.SAUT,
  KeyK: C.SAUT,
  KeyJ: C.TIR,
  KeyX: C.TIR,
  ShiftLeft: C.TIR,
  KeyL: C.SPECIAL,
  KeyC: C.SPECIAL,
};

export class Clavier {
  private bits = 0;
  onPause: () => void = () => {};

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      const c = TOUCHES[e.code];
      if (c) {
        this.bits |= c;
        e.preventDefault();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') this.onPause();
    });
    window.addEventListener('keyup', (e) => {
      const c = TOUCHES[e.code];
      if (c) this.bits &= ~c;
    });
    window.addEventListener('blur', () => (this.bits = 0));
  }

  get commandes(): number {
    return this.bits;
  }
}

/** Manette standard (Gamepad API) : croix ou stick gauche, A saut, X tir, B ou Y spécial. */
export function commandesManette(): number {
  let bits = 0;
  for (const m of navigator.getGamepads?.() ?? []) {
    if (!m) continue;
    const b = (i: number) => m.buttons[i]?.pressed ?? false;
    const ax = m.axes[0] ?? 0;
    const ay = m.axes[1] ?? 0;
    if (b(14) || ax < -0.4) bits |= C.GAUCHE;
    if (b(15) || ax > 0.4) bits |= C.DROITE;
    if (b(12) || ay < -0.5) bits |= C.HAUT;
    if (b(13) || ay > 0.5) bits |= C.BAS;
    if (b(0)) bits |= C.SAUT;
    if (b(2) || b(7)) bits |= C.TIR;
    if (b(1) || b(3)) bits |= C.SPECIAL;
  }
  return bits;
}
