import { HEROS } from '../entites/heros';
import { joueursConseilles } from '../jeu/arene';
import type { EtatVue } from '../jeu/vue';
import type { Partie } from '../jeu/partie';
import { NIVEAUX, niveauLu } from '../niveaux';
import { COULEURS_SIEGES } from '../rendu/indicateurs';
import { el } from './elements';
import { nomArene } from './noms-arene';

/**
 * Ce que le battle royale montre par-dessus le jeu (en HTML, d'après la seule vue : pareil chez l'hôte et chez les invités) :
 * - le salon : la carte et pour combien de joueurs elle est faite, qui est là, inviter, lancer (l'hôte) ;
 * - le compte à rebours, en grand ;
 * - la fin : le classement, rejouer ou quitter.
 */

export interface ActionsArene {
  /** lancer la partie (salon) ou une nouvelle manche (fin) */
  suivant(): void;
  inviter(): void;
  quitte(): void;
  /** la partie, chez l'hôte : il y comble le salon avec des joueurs de l'ordinateur */
  partie(): Partie | null;
}

export class PanneauArene {
  private readonly element = el('div', '', 'arene-panneau');
  private readonly compte = el('div', '', 'arene-compte');
  private dernier = '';
  private conseil: { niveau: number; texte: string } | null = null;

  constructor(
    parent: HTMLElement,
    private readonly a: ActionsArene,
  ) {
    this.element.hidden = true;
    this.compte.hidden = true;
    parent.append(this.element, this.compte);
  }

  maj(v: EtatVue | null, siegeLocal: number, hote: boolean, noms: readonly string[]): void {
    const ar = v?.phase === 'jeu' ? v.arene : undefined;
    const compte = ar?.etape === 'compte' ? String(3 - Math.floor(ar.minuteur / 60)) : '';
    this.compte.hidden = !compte;
    if (this.compte.textContent !== compte) this.compte.textContent = compte;
    const montre = !!ar && (ar.etape === 'salon' || ar.etape === 'fin');
    // on ne refait le panneau que s'il change (les boutons restent cliquables)
    const cle = montre
      ? JSON.stringify([ar.etape, ar.rangs, ar.eliminations, v!.joueurs.map((j) => j.present), noms, hote])
      : '';
    if (cle === this.dernier) return;
    this.dernier = cle;
    this.element.hidden = !montre;
    if (!montre) return;
    // le pseudo, jamais le nom du personnage (il change à chaque manche)
    const nom = (s: number) => `${nomArene(noms, s)}${s === siegeLocal ? ' (vous)' : ''}`;
    const pastille = (s: number, texte: string) => {
      const ligne = el('div', texte, 'arene-joueur');
      ligne.style.setProperty('--couleur', COULEURS_SIEGES[s % COULEURS_SIEGES.length]!);
      return ligne;
    };
    const presents = v!.joueurs.flatMap((j, s) => (j.present ? [s] : []));
    if (ar.etape === 'salon') {
      const boutons = el('div', '', 'arene-boutons');
      if (hote)
        boutons.append(
          this.bouton('Inviter des amis', () => this.a.inviter()),
          this.bouton('+ IA', () => this.a.partie()?.ajouteIA(Math.floor(Math.random() * HEROS.length))),
          this.bouton('− IA', () => this.a.partie()?.retireIA()),
          this.bouton(`Lancer la partie (${presents.length})`, () => this.a.suivant(), true),
        );
      this.element.replaceChildren(
        el('h3', 'Salon du battle royale'),
        el('p', `${NIVEAUX[v!.niveau]?.titre ?? ''} — ${this.conseilDe(v!.niveau)}`, 'aide'),
        ...presents.map((s) => pastille(s, nom(s))),
        hote
          ? el(
              'p',
              'Vos amis vous rejoignent par « Rejoindre des amis ». Lancez quand tout le monde est là.',
              'aide',
            )
          : el('p', 'En attente que l’hôte lance la partie… Échauffez-vous !', 'aide'),
        boutons,
      );
      return;
    }
    const classement = [...presents].sort((x, y) => (ar.rangs[x] || 99) - (ar.rangs[y] || 99));
    const gagnant = classement.find((s) => ar.rangs[s] === 1);
    const boutons = el('div', '', 'arene-boutons');
    boutons.append(
      this.bouton('Rejouer', () => this.a.suivant(), true),
      this.bouton('Quitter', () => this.a.quitte()),
    );
    this.element.replaceChildren(
      el('h3', gagnant === undefined ? 'Fin de la manche' : `${nom(gagnant)} gagne !`),
      ...classement.map((s) =>
        pastille(
          s,
          `${ar.rangs[s] || '–'}. ${nom(s)} — ${ar.eliminations[s]} élimination${ar.eliminations[s]! > 1 ? 's' : ''}`,
        ),
      ),
      boutons,
    );
  }

  private conseilDe(niveau: number): string {
    if (this.conseil?.niveau !== niveau) {
      const [min, max] = joueursConseilles(niveauLu(niveau));
      this.conseil = { niveau, texte: `carte pour ${min === max ? min : `${min} à ${max}`} joueurs` };
    }
    return this.conseil.texte;
  }

  private bouton(texte: string, action: () => void, principal = false): HTMLButtonElement {
    const b = el('button', texte, `fin-bouton${principal ? ' principal' : ''}`);
    b.addEventListener('click', action);
    return b;
  }
}
