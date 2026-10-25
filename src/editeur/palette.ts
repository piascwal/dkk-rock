import { catalogue, FAMILLES, type Choix, type Famille } from './catalogue';
import type { Editeur } from './editeur';
import { icone } from './icones';

/**
 * La palette : un panneau qui monte du bas de l'écran (le pouce y arrive sur un téléphone), un onglet par famille, une recherche,
 * et une grille de grandes vignettes dessinées par le rendu de l'éditeur (gardées en mémoire, par thème). Toucher une vignette la
 * choisit et referme le panneau.
 */

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export class Palette {
  private readonly panneau = document.createElement('div');
  private readonly onglets = new Map<Famille, HTMLButtonElement>();
  private readonly filtre = document.createElement('input');
  private readonly grille = document.createElement('div');
  private readonly vignettes = new Map<string, HTMLCanvasElement>();
  private famille: Famille = 'tuiles';

  constructor(private readonly ed: Editeur) {
    this.panneau.className = 'ed-palette';
    this.panneau.hidden = true;
    const tete = document.createElement('div');
    tete.className = 'ed-onglets';
    for (const [f, nom] of FAMILLES) {
      const b = document.createElement('button');
      b.className = 'ed-onglet';
      b.textContent = nom;
      b.addEventListener('click', () => this.montre(f));
      this.onglets.set(f, b);
      tete.append(b);
    }
    const ferme = document.createElement('button');
    ferme.className = 'ed-onglet ed-fermer';
    ferme.append(icone('fermer'));
    ferme.title = 'Fermer';
    ferme.setAttribute('aria-label', 'Fermer');
    ferme.addEventListener('click', () => this.ferme());
    tete.append(ferme);
    this.filtre.className = 'ed-filtre';
    this.filtre.type = 'search';
    this.filtre.placeholder = 'Chercher…';
    this.filtre.addEventListener('input', () => this.remplit());
    this.grille.className = 'ed-grille';
    this.panneau.append(tete, this.filtre, this.grille);
    ed.racine.append(this.panneau);
  }

  ouvre(): void {
    this.panneau.hidden = false;
    this.montre(this.ed.choix.famille);
  }

  ferme(): void {
    this.panneau.hidden = true;
  }

  /** Les vignettes des modules à soi sont à refaire (un module créé, importé ou supprimé). */
  oublie(): void {
    for (const k of this.vignettes.keys()) if (k.includes('|modules|perso-')) this.vignettes.delete(k);
    if (!this.panneau.hidden) this.remplit();
  }

  private montre(f: Famille): void {
    this.famille = f;
    for (const [k, b] of this.onglets) b.classList.toggle('actif', k === f);
    this.filtre.value = '';
    this.remplit();
    this.grille.scrollTop = 0;
  }

  private remplit(): void {
    const q = sansAccent(this.filtre.value.trim());
    const theme = this.ed.doc.theme;
    this.grille.replaceChildren();
    let groupe = '';
    for (const c of catalogue(this.famille, theme)) {
      if (q && !sansAccent(c.nom).includes(q) && c.cle !== q) continue;
      if (c.groupe && c.groupe !== groupe) {
        groupe = c.groupe;
        const g = document.createElement('div');
        g.className = 'ed-groupe';
        g.textContent = groupe;
        this.grille.append(g);
      }
      this.grille.append(this.item(c, theme));
    }
  }

  private item(c: Choix, theme: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = 'ed-item';
    b.classList.toggle('actif', c.famille === this.ed.choix.famille && c.cle === this.ed.choix.cle);
    const cle = `${theme}|${c.famille}|${c.cle}`;
    let toile = this.vignettes.get(cle);
    if (!toile) {
      toile = document.createElement('canvas');
      toile.width = 96;
      toile.height = 72;
      this.ed.dessin.vignette(toile.getContext('2d')!, c, this.ed.doc.theme, 96, 72);
      this.vignettes.set(cle, toile);
    }
    const nom = document.createElement('span');
    nom.textContent = c.nom;
    b.append(toile, nom);
    b.title = c.famille === 'objets' || c.famille === 'tuiles' ? `${c.nom} (« ${c.cle} »)` : c.nom;
    b.addEventListener('click', () => {
      this.ed.choisit(c);
      this.ferme();
    });
    return b;
  }
}
