import { C } from '../jeu/commandes';
import { AU_BALAYAGE, BOUTON_MINI_JEU, SANS_JOYSTICK } from '../jeu/mini-jeux';
import type { Phase } from '../jeu/vue';

const ZONE_MORTE = 12;
/** Le balayage (l'avion de JBG) : la distance qui en fait un geste, et ce que dure l'appui qu'il produit (ms). */
const BALAYAGE = 22;
const IMPULSION = 90;

/**
 * Commandes tactiles : un joystick qui apparaît sous le pouce gauche, trois
 * boutons sous le pouce droit (saut, tir, spécial). Plusieurs doigts à la fois.
 */
export class Tactile {
  private joystick: { id: number; x: number; y: number; dx: number; dy: number } | null = null;
  private readonly boutons = new Map<number, number>();
  /** les doigts posés sur l'écran quand il tient lieu de bouton (voir `pilote`) */
  private readonly doigtsEcran = new Set<number>();
  /** au balayage : le départ de chaque doigt, et s'il a déjà fait son geste ; les appuis brefs que produisent les gestes */
  private readonly gestes = new Map<number, { x: number; y: number; fait: boolean }>();
  private impulsions: { bit: number; fin: number }[] = [];
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
      if (this.element.classList.contains('balayage')) {
        try {
          zone.setPointerCapture(e.pointerId);
        } catch {
          // un toucher que le navigateur ne suit déjà plus : le geste se lira sans capture
        }
        this.gestes.set(e.pointerId, { x: e.clientX, y: e.clientY, fait: false });
        return;
      }
      // sans joystick (le rêve de JBT) : toucher l'écran, n'importe où, fait l'action du bouton SAUT, tant que le doigt reste
      if (this.element.classList.contains('appui-ecran')) {
        zone.setPointerCapture(e.pointerId);
        this.boutons.set(e.pointerId, C.SAUT);
        this.doigtsEcran.add(e.pointerId);
        this.element.querySelector('.bouton.saut')!.classList.add('appuye');
        return;
      }
      // un nouveau doigt remplace un joystick resté « tenu » par un doigt dont on n'a jamais vu la fin
      zone.setPointerCapture(e.pointerId);
      this.joystick = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
      this.base.style.left = `${e.clientX}px`;
      this.base.style.top = `${e.clientY}px`;
      this.base.classList.add('actif');
      this.place();
    });
    zone.addEventListener('pointermove', (e) => {
      const g = this.gestes.get(e.pointerId);
      if (g && !g.fait) {
        const dx = e.clientX - g.x;
        const dy = e.clientY - g.y;
        if (Math.hypot(dx, dy) > BALAYAGE) {
          g.fait = true;
          const horizontal = Math.abs(dx) > Math.abs(dy);
          this.impulsion(horizontal ? (dx < 0 ? C.GAUCHE : C.DROITE) : dy < 0 ? C.HAUT : C.BAS);
        }
      }
      const j = this.joystick;
      if (!j || j.id !== e.pointerId) return;
      j.dx = e.clientX - j.x;
      j.dy = e.clientY - j.y;
      this.place();
    });
    const lache = (e: PointerEvent) => {
      const g = this.gestes.get(e.pointerId);
      if (g) {
        this.gestes.delete(e.pointerId);
        if (!g.fait && e.type === 'pointerup') this.impulsion(C.SAUT); // un simple toucher : le saut
      }
      if (this.doigtsEcran.delete(e.pointerId)) {
        this.boutons.delete(e.pointerId);
        if (![...this.boutons.values()].includes(C.SAUT))
          this.element.querySelector('.bouton.saut')!.classList.remove('appuye');
      }
      if (this.joystick?.id !== e.pointerId) return;
      this.relacheJoystick();
    };
    for (const nom of ['pointerup', 'pointercancel', 'lostpointercapture'] as const)
      zone.addEventListener(nom, lache);
    // filets de sécurité : le navigateur « perd » parfois la fin d'un toucher (doigt qui glisse hors de l'écran,
    // geste système, notification, trois doigts...) ; sans eux le joystick ou un bouton reste enfoncé
    window.addEventListener('pointerup', lache);
    window.addEventListener('pointercancel', lache);
    // à la souris (les commandes tactiles sont cachées), le clic tient lieu du bouton de la même façon, hors des menus
    parent.addEventListener('pointerdown', (e) => {
      const cible = e.target as HTMLElement;
      if (e.pointerType !== 'mouse' || !this.element.classList.contains('appui-ecran')) return;
      if (!this.element.hidden || cible.closest('button, input, select, a, #ecran, #histoire')) return;
      this.boutons.set(e.pointerId, C.SAUT);
      this.doigtsEcran.add(e.pointerId);
    });
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

  /** Un appui bref (un geste du balayage) : assez long pour qu'au moins un pas du jeu le voie. */
  private impulsion(bit: number): void {
    this.impulsions.push({ bit, fin: performance.now() + IMPULSION });
    navigator.vibrate?.(8);
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
    if (!bouton || this.element.classList.contains('mini-jeu')) return; // dans un mini-jeu : pas de tir
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
   * Dans un mini-jeu, les boutons changent de rôle : SAUT prend le libellé du mini-jeu (« GAZ » au drift, « PLONGE » au plongeon),
   * le tir et le spécial n'ont rien à faire (ils disparaissent), et le joystick reste affiché, son manche qui se balance (voir le
   * CSS) : on le prend pour tourner ou se diriger. `libelle` null : hors mini-jeu, les libellés du jeu reviennent (et le tir,
   * l'icône de l'arme ramassée). Sans joystick du tout (SANS_JOYSTICK : le rêve de JBT), un toucher n'importe où sur l'écran vaut
   * le bouton : on tient pour voler.
   */
  pilote(phase: Phase): void {
    const saut = this.element.querySelector<HTMLElement>('.bouton.saut')!;
    const libelle = BOUTON_MINI_JEU[phase] ?? null;
    const oui = libelle !== null;
    const ecran = oui && SANS_JOYSTICK.has(phase);
    const balayage = oui && AU_BALAYAGE.has(phase);
    if (
      this.element.classList.contains('mini-jeu') === oui &&
      this.element.classList.contains('appui-ecran') === ecran &&
      this.element.classList.contains('balayage') === balayage &&
      saut.textContent === (libelle ?? 'SAUT')
    )
      return;
    this.element.classList.toggle('mini-jeu', oui);
    this.element.classList.toggle('appui-ecran', ecran);
    this.element.classList.toggle('balayage', balayage);
    if (ecran || balayage) this.relacheJoystick();
    const tir = this.element.querySelector<HTMLElement>('.bouton.tir')!;
    saut.textContent = libelle ?? 'SAUT';
    tir.classList.remove('avec-arme');
    tir.dataset.arme = 'mini-jeu'; // l'arme sera redessinée au retour en jeu
    tir.textContent = 'TIR';
    tir.hidden = oui;
    this.element.querySelector<HTMLElement>('.bouton.special')!.hidden = oui;
  }

  /** Lâche tout : joystick et boutons. */
  relache(): void {
    this.relacheJoystick();
    this.boutons.clear();
    this.doigtsEcran.clear();
    this.gestes.clear();
    this.impulsions = [];
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
    const maintenant = performance.now();
    this.impulsions = this.impulsions.filter((i) => i.fin > maintenant);
    for (const i of this.impulsions) bits |= i.bit;
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
