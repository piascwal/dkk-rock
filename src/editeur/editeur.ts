import { TUILE } from '../config';
import { liberePortrait, verrouillePaysage } from '../ui/plein-ecran';
import type { DefNiveau } from '../niveaux/format';
import { catalogue, cleAGarder, lettreDe, type Choix } from './catalogue';
import { DessinEditeur, type Apercu, type Camera } from './dessin';
import { DocumentNiveau } from './document';
import './editeur.css';
import { menuPrincipal } from './fenetres';
import { bouton } from './bouton-icone';
import { placeDepart, retireDepart } from './departs';
import type { NomIcone } from './icones';
import { brancheGestes } from './gestes';
import { MenuRond } from './menu-rond';
import { Palette } from './palette';
import { Rognage } from './rognage';
import { Selection } from './selection';
import { TraceTyrolienne } from './tyroliennes-tracees';

/**
 * L'éditeur de niveau (menu principal → Éditeur de niveau), chargé seulement quand on l'ouvre : une carte qu'on peint au doigt ou à la
 * souris, avec les tuiles, les gens, les objets, le décor et les modules préconstruits du jeu ; on part d'une page blanche ou d'un
 * niveau existant, on l'essaie aussitôt, et on l'exporte (un fichier .json à envoyer, pour l'ajouter au jeu). Le brouillon se garde
 * tout seul dans le navigateur.
 */

export interface ActionsEditeur {
  /** joue le niveau ; `retour` rouvre l'éditeur à la fin du niveau ou quand on le quitte */
  teste(def: DefNiveau, retour: () => void): void;
  /** referme l'éditeur (retour aux options) */
  quitte(): void;
}

export type Outil = 'main' | 'pinceau' | 'rect' | 'gomme' | 'pipette' | 'selection';

export const OUTILS: readonly [Outil, NomIcone, string][] = [
  ['main', 'main', 'Déplacer (H)'],
  ['pinceau', 'pinceau', 'Pinceau (B)'],
  ['rect', 'rectangle', 'Rectangle plein (R)'],
  ['gomme', 'gomme', 'Gomme (E)'],
  ['pipette', 'pipette', 'Pipette : reprendre ce qui est sur la carte (I)'],
  ['selection', 'selection', 'Sélection : faire un module de ce rectangle (S)'],
];
const BROUILLON = 'dkk-editeur-brouillon';
export const ZOOM: [number, number] = [0.35, 6];

export class Editeur {
  readonly racine = document.createElement('div');
  readonly toile = document.createElement('canvas');
  readonly dessin = new DessinEditeur();
  readonly palette: Palette;
  readonly rond: MenuRond;
  doc!: DocumentNiveau;
  cam: Camera = { x: 0, y: 0, zoom: 2 };
  outil: Outil = 'pinceau';
  choix: Choix;
  apercu: Apercu | null = null;
  /** la tyrolienne qu'on trace poteau par poteau */
  readonly trace = new TraceTyrolienne();
  /** rogner la carte en tirant ses bords, et ce qu'on fait d'une sélection (copier, module) */
  readonly rognage: Rognage;
  readonly selection: Selection;
  private readonly nom = document.createElement('span');
  private readonly boutonsOutils = new Map<Outil, HTMLButtonElement>();
  private readonly annuler: HTMLButtonElement;
  private readonly refaire: HTMLButtonElement;
  private readonly vignette = document.createElement('canvas');
  private readonly nomChoix = document.createElement('span');
  private readonly message = document.createElement('div');
  private demande = 0;
  private sauvegarde: ReturnType<typeof setTimeout> | null = null;
  private minuteurMessage: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly actions: ActionsEditeur) {
    this.racine.className = 'editeur';
    this.choix = catalogue('tuiles', 'garage').find((c) => c.cle === '#')!;
    const haut = document.createElement('header');
    haut.className = 'ed-haut';
    this.nom.className = 'ed-nom';
    this.annuler = bouton('annuler', '', 'Annuler (Ctrl+Z)', () => this.doc.annule());
    this.refaire = bouton('refaire', '', 'Refaire (Ctrl+Y)', () => this.doc.refait());
    haut.append(
      bouton('menu', '', 'Menu', () => menuPrincipal(this)),
      this.nom,
      this.annuler,
      this.refaire,
      bouton('tester', 'Tester', 'Jouer ce niveau', () => this.teste(), 'ed-bouton ed-principal'),
    );
    this.toile.className = 'ed-toile';
    const bas = document.createElement('footer');
    bas.className = 'ed-bas';
    const outils = document.createElement('div');
    outils.className = 'ed-outils';
    for (const [o, ic, titre] of OUTILS) {
      const b = bouton(ic, '', titre, () => this.choisitOutil(o));
      this.boutonsOutils.set(o, b);
      outils.append(b);
    }
    const choix = document.createElement('button');
    choix.className = 'ed-choix';
    choix.title = 'Choisir ce qu’on pose';
    this.vignette.width = 40;
    this.vignette.height = 40;
    choix.append(this.vignette, this.nomChoix);
    choix.addEventListener('click', () => this.palette.ouvre());
    const zoom = document.createElement('div');
    zoom.className = 'ed-outils';
    zoom.append(
      bouton('dezoomer', '', 'Dézoomer (-)', () => this.zoome(1 / 1.4)),
      bouton('zoomer', '', 'Zoomer (+)', () => this.zoome(1.4)),
    );
    bas.append(outils, choix, zoom);
    this.message.className = 'ed-message';
    this.message.hidden = true;
    this.racine.append(haut, this.toile, bas, this.message);
    this.palette = new Palette(this);
    this.rond = new MenuRond(this);
    this.rognage = new Rognage(this);
    this.selection = new Selection(this);
    document.body.append(this.racine);
    brancheGestes(this);
    new ResizeObserver(() => this.redessine()).observe(this.toile);
    this.remplace(this.brouillon() ?? DocumentNiveau.vierge());
    this.choisit(this.choix);
    this.choisitOutil('pinceau');
  }

  ouvre(): void {
    liberePortrait();
    document.body.classList.add('editeur-ouvert');
    this.racine.hidden = false;
    this.redessine();
  }

  ferme(): void {
    verrouillePaysage();
    document.body.classList.remove('editeur-ouvert');
    this.racine.hidden = true;
  }

  /** Change de niveau édité (page blanche, niveau du jeu, fichier importé). */
  remplace(doc: DocumentNiveau): void {
    this.doc = doc;
    this.rognage?.fin();
    this.selection?.ferme();
    doc.onChange = () => {
      this.redessine();
      this.majBoutons();
      if (this.sauvegarde) clearTimeout(this.sauvegarde);
      this.sauvegarde = setTimeout(() => this.garde(), 600);
    };
    this.dessin.regleTheme(doc.theme);
    this.cadre();
    this.choisit(this.choix);
    this.majBoutons();
    this.garde();
    this.redessine();
  }

  /** Recentre sur le départ, le sol vers le bas de l'écran. */
  cadre(): void {
    const l = this.doc.lignes();
    const y = l.findIndex((r) => r.includes('@'));
    const x = y >= 0 ? l[y]!.indexOf('@') : 0;
    this.cam.zoom = matchMedia('(pointer: coarse)').matches ? 1.75 : 2;
    const w = this.toile.clientWidth || 360;
    const h = this.toile.clientHeight || 600;
    this.cam.x = Math.max(-TUILE, x * TUILE - w / this.cam.zoom / 4);
    this.cam.y = (Math.max(0, y) + 3) * TUILE - (h / this.cam.zoom) * 0.7;
  }

  choisitOutil(o: Outil): void {
    if (o !== this.outil) this.trace.finit(this.doc);
    if (o !== 'selection') this.selection.ferme();
    this.outil = o;
    for (const [k, b] of this.boutonsOutils) b.classList.toggle('actif', k === o);
    this.apercu = null;
    this.redessine();
  }

  choisit(choix: Choix): void {
    if (choix.cle !== this.choix.cle) this.trace.finit(this.doc);
    // la lettre « a » change de nom selon la ville : on relit le choix dans le catalogue du thème
    const trouve =
      catalogue(choix.famille, this.doc?.theme ?? 'garage').find((c) => c.cle === choix.cle) ?? choix;
    this.choix = { ...trouve, variante: choix.variante };
    this.nomChoix.textContent =
      this.choix.variante === undefined ? this.choix.nom : `${this.choix.nom} ${this.choix.variante + 1}`;
    this.dessin.vignette(this.vignette.getContext('2d')!, this.choix, this.doc?.theme ?? 'garage', 40, 40);
    if (this.outil !== 'pinceau' && this.outil !== 'rect') this.choisitOutil('pinceau');
  }

  zoome(facteur: number, sx = this.toile.clientWidth / 2, sy = this.toile.clientHeight / 2): void {
    const z = Math.max(ZOOM[0], Math.min(ZOOM[1], this.cam.zoom * facteur));
    this.cam.x += sx / this.cam.zoom - sx / z;
    this.cam.y += sy / this.cam.zoom - sy / z;
    this.cam.zoom = z;
    this.redessine();
  }

  /** La case sous un point de l'écran (coordonnées du client). */
  caseSous(cx: number, cy: number): { x: number; y: number } {
    const r = this.toile.getBoundingClientRect();
    return {
      x: Math.floor((this.cam.x + (cx - r.left) / this.cam.zoom) / TUILE),
      y: Math.floor((this.cam.y + (cy - r.top) / this.cam.zoom) / TUILE),
    };
  }

  /** Ce que pose le pinceau (ou efface la gomme) sur une case, pendant un trait. */
  peint(x: number, y: number): void {
    if (this.outil === 'gomme') {
      this.doc.pose(x, y, ' ');
      this.doc.retireDecor(x, y);
      retireDepart(this.doc, x, y);
      this.trace.gomme(this.doc, x, y);
    } else if (/^J\d$/.test(this.choix.cle)) placeDepart(this.doc, Number(this.choix.cle[1]) - 1, x, y);
    else if (this.choix.famille === 'gens') {
      // un personnage : sa lettre sur la carte, et sa ville ou son apparence sur la case si la lettre seule ne suffit pas
      this.poseCaractere(x, y, lettreDe(this.choix.cle));
      this.doc.choisitGens(x, y, cleAGarder(this.choix.cle, this.doc.theme));
    } else if (this.choix.famille !== 'decor' && this.choix.famille !== 'modules')
      this.poseCaractere(x, y, this.choix.cle);
  }

  /** Remplit un rectangle avec ce qu'on pose (ou l'efface). */
  remplit(x0: number, y0: number, x1: number, y1: number): void {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.peint(x, y);
  }

  /** Le départ et le van sont uniques : en poser un ailleurs retire l'ancien. */
  poseCaractere(x: number, y: number, c: string): void {
    if (c === '@' || c === 'F')
      this.doc.lignes().forEach((l, yy) => [...l].forEach((o, xx) => o === c && this.doc.pose(xx, yy, ' ')));
    this.doc.pose(x, y, c);
  }

  dit(texte: string, erreur = false): void {
    this.message.textContent = texte;
    this.message.classList.toggle('erreur', erreur);
    this.message.hidden = false;
    if (this.minuteurMessage) clearTimeout(this.minuteurMessage);
    this.minuteurMessage = setTimeout(() => (this.message.hidden = true), 4500);
  }

  teste(): void {
    const v = this.doc.verifie();
    if (!v.ok && !confirm(`${v.message}\n\nTester quand même ?`)) return;
    try {
      const def = this.doc.versDef(`essai-${Date.now()}`);
      this.ferme();
      this.actions.teste(def, () => this.ouvre());
    } catch (e) {
      this.ouvre();
      this.dit((e as Error).message, true);
    }
  }

  redessine(): void {
    if (this.demande) return;
    this.demande = requestAnimationFrame(() => {
      this.demande = 0;
      const dpr = window.devicePixelRatio || 1;
      const w = this.toile.clientWidth;
      const h = this.toile.clientHeight;
      if (this.toile.width !== Math.round(w * dpr) || this.toile.height !== Math.round(h * dpr)) {
        this.toile.width = Math.round(w * dpr);
        this.toile.height = Math.round(h * dpr);
      }
      const ctx = this.toile.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.dessin.dessine(ctx, this.doc, this.cam, w, h, this.apercu, this.trace.dernier(this.doc));
      this.rognage.dessine(ctx);
    });
  }

  majBoutons(): void {
    this.nom.textContent = this.doc.nom;
    this.annuler.disabled = !this.doc.peutAnnuler;
    this.refaire.disabled = !this.doc.peutRefaire;
  }

  private garde(): void {
    try {
      localStorage.setItem(BROUILLON, JSON.stringify(this.doc.versJSON()));
    } catch {
      // stockage plein ou interdit (navigation privée) : le brouillon ne survivra pas, l'export reste possible
    }
  }

  private brouillon(): DocumentNiveau | null {
    try {
      const t = localStorage.getItem(BROUILLON);
      return t ? DocumentNiveau.depuisJSON(t) : null;
    } catch {
      return null;
    }
  }
}

let editeur: Editeur | null = null;

/** Ouvre l'éditeur (le même d'une fois sur l'autre : on retrouve son niveau et sa vue). */
export function ouvreEditeur(actions: ActionsEditeur): void {
  editeur ??= new Editeur(actions);
  editeur.ouvre();
}
