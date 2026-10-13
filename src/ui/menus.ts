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
import { installe, peutInstaller, surIPhone } from './installation';
import { ecranCarte } from './carte-choix';

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
  diagnostic(): string;
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
    const boutons = el('div', '', 'boutons-menu');
    boutons.append(
      bouton('Continuer', () => this.carte(), 'principal'),
      bouton('Rejoindre des amis', () => this.rejoindre()),
      bouton('Options', () => this.options()),
    );
    if (peutInstaller())
      boutons.append(bouton('Installer le jeu', () => void installe().then(() => this.rafraichitTitre())));
    this.montre(
      el('h1', 'DKK', 'logo'),
      el('p', 'ROCK NEVER DIES', 'slogan'),
      boutons,
      surIPhone()
        ? el(
            'p',
            'Pour installer le jeu (plein écran, hors ligne) : Partager → Sur l’écran d’accueil.',
            'aide',
          )
        : el('span'),
      el('p', texteVersion(), 'version'),
    );
  }

  /** La carte du monde : on choisit un niveau débloqué (par défaut la partie en cours, sinon le dernier ouvert). */
  carte(): void {
    const s = this.a.sauvegarde;
    const ouverts = NIVEAUX.map((_, i) => i).filter((i) => niveauOuvert(i, s.faits));
    const depart = s.enCours?.niveau ?? ouverts[ouverts.length - 1] ?? 0;
    ecranCarte(
      (...enfants) => this.montre(...enfants),
      s.faits,
      depart,
      (n) => this.rockers(n, s.enCours?.niveau === n ? s.enCours : null),
      () => this.titre(),
    );
  }

  /** Redessine l'écran titre s'il est affiché (le bouton d'installation vient d'apparaître ou de disparaître). */
  rafraichitTitre(): void {
    if (this.ecran.querySelector('.logo')) this.titre();
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

  /** Pour tester : tous les niveaux de tous les arcs, sans avoir à les débloquer. */
  niveaux(): void {
    const arcs = ARCS.map((arc) => {
      const liste = el('div', '', 'liste');
      arc.niveaux.forEach((i, pos) =>
        liste.append(bouton(`${pos + 1}. ${NIVEAUX[i]!.titre}`, () => this.rockers(i))),
      );
      return [el('h2', arc.titre), liste];
    });
    this.montre(
      el('p', 'Tous les niveaux, pour tester.', 'aide'),
      ...arcs.flat(),
      bouton('Retour', () => this.options()),
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
    const qualites = { auto: 'automatique', max: 'maximale', eco: 'économe' } as const;
    const suivante = { auto: 'max', max: 'eco', eco: 'auto' } as const;
    const qualite = bouton(`Affichage : ${qualites[s.qualite]}`, () => {
      s.qualite = suivante[s.qualite];
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
    const tests = bouton('Choisir un niveau (test)', () => this.niveaux());
    this.montre(
      el('h2', 'Options'),
      bascule('Bruitages', 'son'),
      bascule('Musique', 'musique'),
      qualite,
      el('p', `Affichage actuel : ${this.a.diagnostic()}`, 'aide'),
      pseudo,
      efface,
      tests,
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
      el('p', `${texteVersion()} · ${this.a.diagnostic()}`, 'version'),
    );
  }

  inviter(): void {
    ecranInviter(this, this.a);
  }

  rejoindre(codeInitial = codeDuLien(location.hash) ?? ''): void {
    ecranRejoindre(this, this.a, codeInitial);
  }
}
