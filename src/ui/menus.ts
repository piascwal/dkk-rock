import { codeDuLien, nettoiePseudo, type Annonce } from '@piascwal/lan-kit';
import { HEROS } from '../entites/heros';
import type { Progression, Sauvegarde } from '../jeu/sauvegarde';
import { NIVEAUX } from '../niveaux';
import { ARCS, niveauOuvert } from '../niveaux/arcs';
import type { AnnonceDkk } from '../reseau/annonce';
import { Recherche } from '../reseau/client';
import type { Hote } from '../reseau/hote';
import { bouton, el } from './elements';
import { ecranInviter, ecranRejoindre } from './menus-reseau';
import { QUI_DES_MEMBRES, portrait } from './portraits';
import { texteVersion } from '../version';

/** Ce que les menus demandent à l'application. */
export interface Actions {
  readonly sauvegarde: Sauvegarde;
  enregistre(): void;
  lance(niveau: number, membre: number, reprise: Progression | null): void;
  rejoins(r: Recherche, a: Annonce<AnnonceDkk>, pseudo: string, membre: number): Promise<void>;
  reprend(): void;
  quitte(): void;
  ouvreHote(): Hote | null;
  readonly estClient: boolean;
  appliqueOptions(): void;
}

/** Les écrans de menu, en HTML. Un seul écran à la fois dans `#ecran`. */
export class Menus {
  private minuteur: ReturnType<typeof setInterval> | null = null;
  recherche: Recherche | null = null;

  constructor(
    private readonly ecran: HTMLElement,
    private readonly a: Actions,
  ) {}

  montre(...enfants: HTMLElement[]): void {
    if (this.minuteur) clearInterval(this.minuteur);
    this.minuteur = null;
    this.ecran.replaceChildren(...enfants);
  }

  /** Rafraîchit l'écran courant chaque seconde (jusqu'au prochain écran). */
  toutesLesSecondes(f: () => void): void {
    this.minuteur = setInterval(f, 1000);
  }

  ferme(): void {
    this.montre();
    this.recherche?.ferme();
    this.recherche = null;
  }

  get ouvert(): boolean {
    return this.ecran.childElementCount > 0;
  }

  titre(): void {
    const s = this.a.sauvegarde;
    const boutons = el('div', '', 'boutons-menu');
    if (s.enCours) {
      const n = NIVEAUX[s.enCours.niveau];
      boutons.append(
        bouton(
          `Continuer — ${n?.titre ?? ''}`,
          () => this.a.lance(s.enCours!.niveau, s.membre, s.enCours),
          'principal',
        ),
      );
    }
    boutons.append(
      bouton('Nouvelle partie', () => this.rockers(0), s.enCours ? '' : 'principal'),
      bouton('Choisir un niveau', () => this.niveaux()),
      bouton('Rejoindre des amis', () => this.rejoindre()),
      bouton('Options', () => this.options()),
    );
    this.montre(
      el('h1', 'DKK', 'logo'),
      el('p', 'ROCK NEVER DIES', 'slogan'),
      boutons,
      el(
        'p',
        'Clavier : flèches ou ZQSD, Espace saut, J tir, L spécial, Échap pause. Manette acceptée. Jusqu’à 4 joueurs.',
        'aide',
      ),
      el('p', texteVersion(), 'version'),
    );
  }

  rockers(niveau: number, reprise: Progression | null = null): void {
    const liste = el('div', '', 'rockers');
    HEROS.forEach((h, i) => {
      const b = bouton(
        '',
        () => {
          this.a.sauvegarde.membre = i;
          this.a.enregistre();
          this.a.lance(niveau, i, reprise);
        },
        `rocker${i === this.a.sauvegarde.membre ? ' choisi' : ''}`,
      );
      b.style.setProperty('--couleur', h.couleur);
      const img = el('img');
      img.src = portrait(QUI_DES_MEMBRES[i]!);
      img.alt = '';
      b.append(img, el('strong', h.nom), el('span', h.instrument), el('span', h.description));
      liste.append(b);
    });
    this.montre(
      el('h2', 'Qui ouvre le bal ?'),
      liste,
      el(
        'p',
        'Les autres attendent en cage. Libérez-les en chemin : une vie de plus, et vous prenez leur place.',
        'aide',
      ),
      bouton('Retour', () => this.titre()),
    );
  }

  niveaux(): void {
    const faits = this.a.sauvegarde.faits;
    const arcs = ARCS.map((arc) => {
      const liste = el('div', '', 'liste');
      const ouvert = arc.apres === undefined || faits.includes(arc.apres);
      if (!ouvert)
        liste.append(
          el('p', `Terminez « ${NIVEAUX[arc.apres!]?.titre ?? ''} » pour ouvrir cet arc.`, 'aide'),
        );
      else
        arc.niveaux.forEach((i, pos) => {
          const b = bouton(`${pos + 1}. ${NIVEAUX[i]!.titre}`, () => this.rockers(i));
          b.disabled = !niveauOuvert(i, faits);
          liste.append(b);
        });
      return [el('h2', arc.titre), liste];
    });
    this.montre(
      ...arcs.flat(),
      bouton('Retour', () => this.titre()),
    );
  }

  options(): void {
    const s = this.a.sauvegarde;
    const pseudo = el('input');
    pseudo.value = s.pseudo;
    pseudo.maxLength = 14;
    pseudo.placeholder = 'Votre pseudo';
    pseudo.addEventListener('change', () => {
      s.pseudo = nettoiePseudo(pseudo.value, '');
      pseudo.value = s.pseudo;
      this.a.enregistre();
    });
    const bascule = (texte: string, cle: 'son' | 'musique') =>
      bouton(`${texte} : ${s[cle] ? 'oui' : 'non'}`, () => {
        s[cle] = !s[cle];
        this.a.enregistre();
        this.a.appliqueOptions();
        this.options();
      });
    const efface = bouton('Effacer la sauvegarde', () => {
      if (!confirm('Effacer la progression ?')) return;
      s.enCours = null;
      s.faits = [];
      this.a.enregistre();
      this.titre();
    });
    this.montre(
      el('h2', 'Options'),
      bascule('Bruitages', 'son'),
      bascule('Musique', 'musique'),
      pseudo,
      efface,
      bouton('Retour', () => this.titre()),
    );
  }

  pause(): void {
    const boutons = el('div', '', 'boutons-menu');
    boutons.append(bouton('Reprendre', () => this.a.reprend(), 'principal'));
    if (!this.a.estClient) boutons.append(bouton('Inviter des amis', () => this.inviter()));
    boutons.append(
      bouton('Options', () => this.options()),
      bouton('Quitter', () => this.a.quitte()),
    );
    this.montre(
      el('h2', 'Pause'),
      boutons,
      el('p', 'À plusieurs, la partie continue pendant la pause.', 'aide'),
      el('p', texteVersion(), 'version'),
    );
  }

  inviter(): void {
    ecranInviter(this, this.a);
  }

  rejoindre(codeInitial = codeDuLien(location.hash) ?? ''): void {
    ecranRejoindre(this, this.a, codeInitial);
  }
}
