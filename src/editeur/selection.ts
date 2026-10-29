import { creeModule } from './fenetres-modules';
import type { Editeur } from './editeur';
import { copieDansLePressePapier, extraisModule, ID_PRESSE_PAPIER, pressePapier } from './modules-perso';

/**
 * Ce qu'on fait d'un rectangle choisi avec l'outil sélection : une barre en bas propose de le **copier** (il entre dans le
 * presse-papier, qui se pose comme un module : on touche la carte pour le coller, autant de fois qu'on veut) ou de l'**enregistrer
 * comme module** (il rejoint « Mes modules »). Au clavier : Ctrl+C copie, Ctrl+V reprend la copie.
 */

export class Selection {
  rect: [number, number, number, number] | null = null;
  private readonly barre = document.createElement('div');
  private readonly taille = document.createElement('span');

  constructor(private readonly ed: Editeur) {
    this.barre.className = 'ed-rognage ed-selection';
    this.barre.hidden = true;
    const bouton = (texte: string, titre: string, action: () => void, classe = '') => {
      const b = document.createElement('button');
      b.className = `ed-bouton ${classe}`;
      b.textContent = texte;
      b.title = titre;
      b.addEventListener('click', action);
      return b;
    };
    this.barre.append(
      this.taille,
      bouton('Copier', 'Copier : on pourra le coller ailleurs', () => this.copie(), 'ed-principal'),
      bouton('Module', 'Enregistrer comme module (dans Mes modules)', () => this.module()),
      bouton('✕', 'Fermer', () => this.ferme()),
    );
    ed.racine.append(this.barre);
  }

  /** Un rectangle vient d'être choisi : on propose quoi en faire. */
  propose(rect: [number, number, number, number]): void {
    const [x0, y0, x1, y1] = rect;
    this.rect = [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)];
    this.taille.textContent = `${this.rect[2] - this.rect[0] + 1} × ${this.rect[3] - this.rect[1] + 1} cases`;
    this.barre.hidden = false;
  }

  ferme(): void {
    if (!this.rect) return;
    this.rect = null;
    this.barre.hidden = true;
    this.ed.apercu = null;
    this.ed.redessine();
  }

  /** Copier : le rectangle entre dans le presse-papier, et l'on est prêt à le coller. */
  copie(): void {
    const { ed, rect } = this;
    if (!rect) return;
    const m = extraisModule(ed.doc, rect, '');
    copieDansLePressePapier(m);
    this.ferme();
    ed.palette.oublie();
    this.colle();
    ed.dit(
      `Copié : ${m.lignes[0]!.length} × ${m.lignes.length} cases. Touchez la carte pour le coller, autant de fois que vous voulez.`,
    );
  }

  /** Coller : le presse-papier devient ce qu'on pose (le bas de la copie sur la rangée touchée). */
  colle(): void {
    const m = pressePapier();
    if (!m) return this.ed.dit('Rien à coller : sélectionnez un morceau de carte, puis « Copier ».', true);
    this.ed.choisit({ famille: 'modules', cle: ID_PRESSE_PAPIER, nom: m.nom, groupe: m.famille });
  }

  /** Enregistrer comme module : la fenêtre pour le nommer. */
  module(): void {
    const { rect } = this;
    if (!rect) return;
    this.ferme();
    creeModule(this.ed, rect);
  }
}
