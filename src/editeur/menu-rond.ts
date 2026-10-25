import { OUTILS, type Editeur } from './editeur';
import { icone, type NomIcone } from './icones';

/**
 * Le menu en rond : un doigt qui reste appuyé sur la carte fait apparaître les outils autour de lui (et la palette, et annuler).
 * On glisse le doigt vers l'un d'eux et on le lève pour le choisir ; ou on lève le doigt au centre, et on touche l'outil voulu
 * (toucher à côté referme le menu).
 */

interface Entree {
  nom: NomIcone;
  titre: string;
  action: () => void;
  actif: boolean;
}

const RAYON = 78;
/** en deçà, le doigt est encore au centre : rien n'est visé */
const CENTRE = 28;

export class MenuRond {
  private readonly fond = document.createElement('div');
  private boutons: HTMLButtonElement[] = [];
  private entrees: Entree[] = [];
  private centre = { x: 0, y: 0 };
  private vise = -1;

  constructor(private readonly ed: Editeur) {
    this.fond.className = 'ed-rond';
    this.fond.hidden = true;
    this.fond.addEventListener('pointerdown', (e) => e.target === this.fond && this.ferme());
    ed.racine.append(this.fond);
  }

  get ouvert(): boolean {
    return !this.fond.hidden;
  }

  /** Ouvre le menu autour d'un point de l'écran (coordonnées du client), sans sortir de l'écran. */
  ouvre(cx: number, cy: number): void {
    const ed = this.ed;
    this.entrees = [
      ...OUTILS.map(([o, nom, titre]) => ({
        nom,
        titre,
        action: () => ed.choisitOutil(o),
        actif: ed.outil === o,
      })),
      { nom: 'palette', titre: 'Choisir ce qu’on pose', action: () => ed.palette.ouvre(), actif: false },
      { nom: 'annuler', titre: 'Annuler', action: () => ed.doc.annule(), actif: false },
    ];
    const marge = RAYON + 30;
    this.centre = {
      x: Math.min(Math.max(cx, marge), innerWidth - marge),
      y: Math.min(Math.max(cy, marge), innerHeight - marge),
    };
    const pastille = document.createElement('div');
    pastille.className = 'ed-rond-centre';
    this.boutons = this.entrees.map((e, i) => {
      const b = document.createElement('button');
      b.className = 'ed-bouton ed-rond-bouton';
      b.classList.toggle('actif', e.actif);
      b.title = e.titre;
      b.setAttribute('aria-label', e.titre);
      b.append(icone(e.nom));
      const a = this.angle(i);
      b.style.left = `${this.centre.x + RAYON * Math.cos(a)}px`;
      b.style.top = `${this.centre.y + RAYON * Math.sin(a)}px`;
      b.addEventListener('click', () => this.choisit(i));
      return b;
    });
    pastille.style.left = `${this.centre.x}px`;
    pastille.style.top = `${this.centre.y}px`;
    this.fond.replaceChildren(pastille, ...this.boutons);
    this.fond.hidden = false;
    this.vise = -1;
    navigator.vibrate?.(12);
  }

  /** Le doigt encore posé glisse : l'outil dans sa direction s'allume. */
  survole(cx: number, cy: number): void {
    const [dx, dy] = [cx - this.centre.x, cy - this.centre.y];
    const n = this.entrees.length;
    this.vise =
      Math.hypot(dx, dy) < CENTRE
        ? -1
        : (Math.round((Math.atan2(dy, dx) + Math.PI / 2) / ((2 * Math.PI) / n)) + n) % n;
    this.boutons.forEach((b, i) => b.classList.toggle('vise', i === this.vise));
  }

  /** Le doigt se lève : l'outil visé est choisi ; au centre, le menu reste ouvert pour qu'on touche. */
  lache(cx: number, cy: number): void {
    this.survole(cx, cy);
    if (this.vise >= 0) this.choisit(this.vise);
  }

  ferme(): void {
    this.fond.hidden = true;
  }

  /** le premier en haut, puis dans le sens des aiguilles d'une montre */
  private angle(i: number): number {
    return -Math.PI / 2 + (i * 2 * Math.PI) / this.entrees.length;
  }

  private choisit(i: number): void {
    this.ferme();
    this.entrees[i]!.action();
  }
}
