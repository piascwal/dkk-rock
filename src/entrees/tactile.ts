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
      // un nouveau doigt remplace un joystick resté « tenu » par un doigt dont on n'a jamais vu la fin
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
      this.relacheJoystick();
    };
    for (const nom of ['pointerup', 'pointercancel', 'lostpointercapture'] as const)
      zone.addEventListener(nom, lache);
    // filets de sécurité : le navigateur « perd » parfois la fin d'un toucher (doigt qui glisse hors de l'écran,
    // geste système, notification, trois doigts...) ; sans eux le joystick ou un bouton reste enfoncé
    window.addEventListener('pointerup', lache);
    window.addEventListener('pointercancel', lache);
    const toutLacher = () => this.relache();
    window.addEventListener('blur', toutLacher);
    document.addEventListener('visibilitychange', toutLacher);
    for (const nom of ['touchend', 'touchcancel'] as const)
      window.addEventListener(nom, (e) => {
        if (e.touches.length === 0) toutLacher();
      });

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
        if (![...this.boutons.values()].includes(c)) b.classList.remove('appuye');
      };
      for (const nom of ['pointerup', 'pointercancel', 'lostpointercapture'] as const)
        b.addEventListener(nom, fin);
      window.addEventListener('pointerup', fin);
      window.addEventListener('pointercancel', fin);
    }
  }

  private relacheJoystick(): void {
    this.joystick = null;
    this.base.classList.remove('actif');
    this.manche.style.transform = '';
  }

  /**
   * Le bouton de tir montre l'arme ramassée (son icône, et ce qu'il lui reste de munitions) à la place de « TIR » ; l'instrument
   * du héros, lui, garde le libellé. `icone` : l'image de l'arme (null : pas d'arme).
   */
  arme(icone: { url: string; w: number; h: number } | null, munitions: number): void {
    const bouton = this.element.querySelector<HTMLElement>('.bouton.tir');
    if (!bouton || this.element.classList.contains('drift')) return; // au concours de drift : pas de tir
    const cle = icone ? `${icone.url}|${munitions}` : '';
    if (bouton.dataset.arme === cle) return;
    bouton.dataset.arme = cle;
    bouton.classList.toggle('avec-arme', !!icone);
    if (!icone) return void bouton.replaceChildren(document.createTextNode('TIR'));
    const img = document.createElement('img');
    img.className = 'icone-arme';
    img.src = icone.url;
    img.alt = '';
    const reste = document.createElement('span');
    reste.className = 'munitions';
    reste.textContent = `×${munitions}`;
    bouton.replaceChildren(img, reste);
  }

  /**
   * Au concours de drift, les boutons changent de rôle : SAUT donne les gaz (« GAZ »), le tir et le spécial n'ont rien à faire
   * (ils disparaissent), et le joystick reste affiché, son manche qui se balance (voir le CSS) : on le prend pour tourner. Hors
   * du concours, les libellés du jeu reviennent (et le tir, l'icône de l'arme ramassée).
   */
  pilote(oui: boolean): void {
    if (this.element.classList.contains('drift') === oui) return;
    this.element.classList.toggle('drift', oui);
    const saut = this.element.querySelector<HTMLElement>('.bouton.saut')!;
    const tir = this.element.querySelector<HTMLElement>('.bouton.tir')!;
    saut.textContent = oui ? 'GAZ' : 'SAUT';
    tir.classList.remove('avec-arme');
    tir.dataset.arme = 'drift'; // l'arme sera redessinée au retour en jeu
    tir.textContent = 'TIR';
    tir.hidden = oui;
    this.element.querySelector<HTMLElement>('.bouton.special')!.hidden = oui;
  }

  /** Lâche tout : joystick et boutons. */
  relache(): void {
    this.relacheJoystick();
    this.boutons.clear();
    for (const b of this.element.querySelectorAll('.bouton')) b.classList.remove('appuye');
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
    if (!visible) this.relache();
  }
}
