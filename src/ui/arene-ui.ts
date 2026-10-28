import { joueursConseilles } from '../jeu/arene';
import type { EtatVue } from '../jeu/vue';
import type { Partie } from '../jeu/partie';
import { NIVEAUX, niveauLu } from '../niveaux';
import { couleurDuSiege } from '../rendu/couleurs-arene';
import { equipeDeLaCase, NOMS_EQUIPES } from '../jeu/equipes';
import { contenuSalon } from './salon-arene';
import { el } from './elements';
import { nomArene } from './noms-arene';
import { EcranVersus } from './versus';
import { FilElimination } from './fil-elim';
import type { Evenement } from '../jeu/vue';
import type { VueArene } from '../jeu/arene';

/**
 * Ce que le battle royale montre par-dessus le jeu (en HTML, d'après la seule vue : pareil chez l'hôte et chez les invités) :
 * - le salon : la carte et pour combien de joueurs elle est faite, qui est là, inviter, lancer (l'hôte) ;
 * - le compte à rebours, sur l'écran « VERSUS » (voir versus.ts) ;
 * - la fin : le classement, rejouer ou quitter.
 */

export interface ActionsArene {
  /** lancer la partie (salon) ou une nouvelle manche (fin) */
  suivant(): void;
  inviter(): void;
  quitte(): void;
  /** la partie, chez l'hôte : il y comble le salon avec des joueurs de l'ordinateur */
  partie(): Partie | null;
  /** au salon : prendre la case `n` (chez un invité, la demande part à l'hôte) */
  place(n: number): void;
}

export class PanneauArene {
  private readonly element = el('div', '', 'arene-panneau');
  private readonly versus: EcranVersus;
  /** le fil des éliminations, et de quoi y nommer les joueurs (la dernière vue, les pseudos, son siège) */
  private readonly fil: FilElimination;
  private derniere: { ar?: VueArene; noms: readonly string[]; siege: number } = { noms: [], siege: 0 };
  private dernier = '';
  private conseil: { niveau: number; texte: string } | null = null;

  constructor(
    parent: HTMLElement,
    private readonly a: ActionsArene,
  ) {
    this.element.hidden = true;
    parent.append(this.element);
    this.versus = new EcranVersus(parent);
    this.fil = new FilElimination(parent);
  }

  maj(v: EtatVue | null, siegeLocal: number, hote: boolean, noms: readonly string[]): void {
    const ar = v?.phase === 'jeu' ? v.arene : undefined;
    this.versus.maj(v, siegeLocal, noms);
    this.derniere = { ar: v?.arene, noms, siege: siegeLocal };
    const montre = !!ar && (ar.etape === 'salon' || ar.etape === 'fin');
    // on ne refait le panneau que s'il change (les boutons restent cliquables)
    const ia = this.a.partie()?.arene?.ia?.sieges ?? [];
    const cle = montre
      ? JSON.stringify([
          ar.etape,
          ar.rangs,
          ar.eliminations,
          v!.joueurs.map((j) => j.present),
          noms,
          hote,
          ar.equipes,
          ar.places,
          ia,
        ])
      : '';
    if (cle === this.dernier) return;
    this.dernier = cle;
    this.element.hidden = !montre;
    if (!montre) return;
    // le pseudo, jamais le nom du personnage (il change à chaque manche)
    const nom = (s: number) => `${nomArene(noms, s)}${s === siegeLocal ? ' (vous)' : ''}`;
    const pastille = (s: number, texte: string) => {
      const ligne = el('div', texte, 'arene-joueur');
      ligne.style.setProperty('--couleur', couleurDuSiege(ar, s));
      return ligne;
    };
    const presents = v!.joueurs.flatMap((j, s) => (j.present ? [s] : []));
    if (ar.etape === 'salon') {
      const boutons = el('div', '', 'arene-boutons');
      if (hote)
        boutons.append(
          this.bouton('Inviter des amis', () => this.a.inviter()),
          this.bouton(`Lancer la partie (${presents.length})`, () => this.a.suivant(), true),
        );
      this.element.replaceChildren(
        el('h3', 'Salon du battle royale'),
        el('p', `${NIVEAUX[v!.niveau]?.titre ?? ''} — ${this.conseilDe(v!.niveau)}`, 'aide'),
        ...contenuSalon({
          ar,
          presents: v!.joueurs.map((j) => j.present),
          noms,
          siegeLocal,
          hote,
          partie: this.a.partie(),
          place: (n) => this.a.place(n),
          bouton: (t, f, p) => this.bouton(t, f, p),
        }),
        hote
          ? el(
              'p',
              '« Venir » : prendre une case libre. Lancez quand tout le monde est là.',
              'aide salon-aide',
            )
          : el('p', '« Venir » : prendre une case libre. L’hôte lance la partie.', 'aide salon-aide'),
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
      el(
        'h3',
        gagnant === undefined
          ? 'Fin de la manche'
          : ar.equipes
            ? `L’équipe ${NOMS_EQUIPES[equipeDeLaCase(ar.places[gagnant] ?? 0)]} gagne !`
            : `${nom(gagnant)} gagne !`,
      ),
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

  /** Une élimination annoncée par la partie : une ligne au fil. */
  elimination(e: Extract<Evenement, { k: 'elim' }>): void {
    const { ar, noms, siege } = this.derniere;
    this.fil.ajoute(e, noms, siege, ar);
  }

  /** On change de partie : le fil se vide. */
  videFil(): void {
    this.fil.vide();
  }

  private bouton(texte: string, action: () => void, principal = false): HTMLButtonElement {
    const b = el('button', texte, `fin-bouton${principal ? ' principal' : ''}`);
    b.addEventListener('click', action);
    return b;
  }
}
