import { codeDuLien, nettoiePseudo, type Annonce } from '@piascwal/lan-kit';
import { HEROS } from '../entites/heros';
import type { Progression, Sauvegarde } from '../jeu/sauvegarde';
import { NIVEAUX } from '../niveaux';
import { ARCS, niveauOuvert } from '../niveaux/arcs';
import { NIVEAU_DRIFT } from '../jeu/drift';
import type { MiniJeu } from '../jeu/mini-jeux';
import { NIVEAU_PLONGEON } from '../jeu/plongeon';
import { NIVEAU_REVE } from '../jeu/reve';
import { NIVEAU_AVION } from '../jeu/avion';
import { NIVEAU_KART } from '../jeu/kart';
import type { AnnonceDkk } from '../reseau/annonce';
import { Recherche } from '../reseau/client';
import type { Hote } from '../reseau/hote';
import { ajusteColonnes, bouton, el } from './elements';
import { ecranInviter, ecranRejoindre } from './menus-reseau';
import { ecranArene, type CarteArene } from './menus-arene';
import type { ReglesArene } from '../jeu/arene';
import { texteVersion } from '../version';
import { estInstallee, installe, peutInstaller, surIPhone } from './installation';
import { pleinEcran } from './plein-ecran';
import { ecranCarte } from './carte-choix';
import { compteSibylles } from '../jeu/sibylles';

/** Ce que les menus demandent à l'application. */
export interface Actions {
  readonly sauvegarde: Sauvegarde;
  enregistre(): void;
  lance(niveau: number, membre: number, reprise: Progression | null): void;
  /** lance un mini-jeu (le drift du pré du Clos, le plongeon du pont des Tuves), hors de l'histoire (on rejoue au podium) */
  lanceMiniJeu(quel: MiniJeu): void;
  rejoins(r: Recherche, a: Annonce<AnnonceDkk>, pseudo: string, membre: number): Promise<void>;
  reprend(): void;
  /** refait le niveau en cours (hôte seulement) : du départ, ou du dernier drapeau */
  recommence(depuisLeDebut: boolean): void;
  readonly aUnDrapeau: boolean;
  quitte(): void;
  ouvreHote(): Hote | null;
  readonly estClient: boolean;
  appliqueOptions(): void;
  /** l'éditeur de niveau (menu principal) */
  ouvreEditeur(): void;
  /** le battle royale : contre `ia` joueurs de l'ordinateur, ou (0) un salon en ligne */
  lanceArene(carte: CarteArene, regles: ReglesArene, ia: number): void;
  readonly estArene: boolean;
  diagnostic(): string;
}

/** Les écrans de menu, en HTML. Un seul écran à la fois dans `#ecran`. */
export class Menus {
  private minuteur: ReturnType<typeof setInterval> | null = null;
  recherche: Recherche | null = null;

  constructor(
    private readonly ecran: HTMLElement,
    private readonly a: Actions,
  ) {
    window.addEventListener('resize', () => ajusteColonnes(this.ecran));
  }

  montre(...enfants: HTMLElement[]): void {
    if (this.minuteur) clearInterval(this.minuteur);
    this.minuteur = null;
    document.body.classList.remove('titre-ouvert');
    this.ecran.replaceChildren(...enfants);
    ajusteColonnes(this.ecran); // des boutons en colonne, en plusieurs colonnes si l'écran est trop bas
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
    const boutons = el('div', '', 'boutons-menu une-colonne');
    boutons.append(
      bouton('Continuer', () => this.carte(), 'principal'),
      bouton('Rejoindre des amis', () => this.rejoindre()),
      bouton('Mini-jeux', () => this.miniJeux()),
      bouton('Battle royale', () => ecranArene(this, this.a)),
      bouton('Éditeur de niveau', () => this.a.ouvreEditeur()),
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
      el('p', texteVersion(), 'version version-coin'),
    );
    document.body.classList.add('titre-ouvert');
  }

  /** La carte du monde : on choisit un niveau débloqué (par défaut la partie en cours, sinon le dernier ouvert). */
  carte(): void {
    const s = this.a.sauvegarde;
    const ouverts = NIVEAUX.map((_, i) => i).filter((i) => niveauOuvert(i, s.faits));
    const depart = s.enCours?.niveau ?? ouverts[ouverts.length - 1] ?? 0;
    ecranCarte(
      (...enfants) => this.montre(...enfants),
      s.faits,
      (n) => compteSibylles(s, n),
      depart,
      // depuis le menu, on repart du début du niveau (les vies et le score restent) ; le dernier drapeau sert à la pause
      (n) => this.lanceNiveau(n, s.enCours?.niveau === n ? { ...s.enCours, drapeau: -1 } : null),
      () => this.titre(),
    );
  }

  /** Les mini-jeux croisés en chemin, à rejouer : chacun s'ouvre quand on l'a rencontré dans l'histoire. */
  miniJeux(): void {
    const s = this.a.sauvegarde;
    const drift = niveauOuvert(NIVEAU_DRIFT, s.faits);
    const plongeon = niveauOuvert(NIVEAU_PLONGEON, s.faits);
    const record = `Record du pré : ${s.recordDrift.toFixed(1).replace('.', ',')} % de pelouse saccagée.`;
    const recordSaut = `Record du pont : ${s.recordPlongeon} % de précision.`;
    const reve = niveauOuvert(NIVEAU_REVE, s.faits);
    const recordReve = `Record du rêve : ${s.recordReve} points.`;
    const kart = niveauOuvert(NIVEAU_KART, s.faits);
    const avion = niveauOuvert(NIVEAU_AVION, s.faits);
    const recordAvion = `Record du tarmac : ${s.recordAvion} points.`;
    // une ligne par mini-jeu : son bouton à gauche, son record en face, à droite (voir .mini-jeux)
    const jeux = el('div', '', 'mini-jeux');
    jeux.append(
      drift
        ? bouton('Concours de drift — le pré du Clos', () => this.a.lanceMiniJeu('drift'), 'principal')
        : el('p', 'Concours de drift : se débloque après Saint-Cézaire.', 'aide'),
      drift && s.recordDrift > 0 ? el('p', record, 'aide') : el('span'),
      plongeon
        ? bouton('Plongeon — le pont des Tuves', () => this.a.lanceMiniJeu('plongeon'), 'principal')
        : el('p', 'Plongeon du pont des Tuves : se débloque après le pont.', 'aide'),
      plongeon && s.recordPlongeon > 0 ? el('p', recordSaut, 'aide') : el('span'),
      kart
        ? bouton(
            'Grand Prix de la Sarré — la surprise de Mat',
            () => this.a.lanceMiniJeu('kart'),
            'principal',
          )
        : el('p', 'Le Grand Prix de la Sarré : se débloque après Gréau.', 'aide'),
      el('span'),
      reve
        ? bouton('Le rêve de JBT — la pleine lune', () => this.a.lanceMiniJeu('reve'), 'principal')
        : el('p', 'Le rêve de JBT : se débloque après la Ville Autotunée.', 'aide'),
      reve && s.recordReve > 0 ? el('p', recordReve, 'aide') : el('span'),
      avion
        ? bouton('L’avion de JBG — dernier appel', () => this.a.lanceMiniJeu('avion'), 'principal')
        : el('p', 'L’avion de JBG : se débloque après le Club Infini.', 'aide'),
      avion && s.recordAvion > 0 ? el('p', recordAvion, 'aide') : el('span'),
      bouton('Retour', () => this.titre(), 'pleine'),
    );
    this.montre(
      el('h2', 'Mini-jeux'),
      el(
        'p',
        'Les mini-jeux croisés en chemin, à rejouer seul ou à plusieurs (Pause → Inviter des amis).',
        'aide',
      ),
      jeux,
    );
  }

  /** Redessine l'écran titre s'il est affiché (le bouton d'installation vient d'apparaître ou de disparaître). */
  rafraichitTitre(): void {
    if (this.ecran.querySelector('.logo')) this.titre();
  }

  /**
   * Lance un niveau : plus de choix de personnage, comme dans Broforce. On reprend avec le dernier membre joué ; une
   * partie neuve en tire un au hasard. Les autres attendent en cage (voir la cage, interactions.ts).
   */
  lanceNiveau(niveau: number, reprise: Progression | null = null): void {
    const membre = reprise ? this.a.sauvegarde.membre : Math.floor(Math.random() * HEROS.length);
    this.a.lance(niveau, membre, reprise);
  }

  /** Pour tester : tous les niveaux de tous les arcs, sans avoir à les débloquer. */
  niveaux(): void {
    const arcs = ARCS.map((arc) => {
      const liste = el('div', '', 'liste');
      arc.niveaux.forEach((i, pos) =>
        liste.append(bouton(`${pos + 1}. ${NIVEAUX[i]!.titre}`, () => this.lanceNiveau(i))),
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
    if (!this.a.estClient && this.a.estArene)
      boutons.append(bouton('Inviter des amis', () => this.inviter()));
    else if (!this.a.estClient) {
      if (this.a.aUnDrapeau)
        boutons.append(this.confirme('Recommencer au drapeau', () => this.a.recommence(false)));
      boutons.append(
        this.confirme('Recommencer le niveau', () => this.a.recommence(true)),
        bouton('Inviter des amis', () => this.inviter()),
      );
    }
    boutons.append(
      bouton('Options', () => this.options()),
      ...(document.fullscreenEnabled && !document.fullscreenElement && !estInstallee()
        ? [bouton('Plein écran', () => (pleinEcran(), this.a.reprend()))]
        : []),
      bouton('Quitter', () => this.a.quitte()),
    );
    this.montre(
      el('h2', 'Pause'),
      boutons,
      el('p', 'À plusieurs, la partie continue pendant la pause.', 'aide'),
      el('p', `${texteVersion()} · ${this.a.diagnostic()}`, 'version'),
    );
  }

  /** Un bouton qui demande une seconde pression (3 s pour confirmer) : on ne refait pas son niveau d'un doigt qui glisse. */
  private confirme(texte: string, action: () => void): HTMLButtonElement {
    let attente: ReturnType<typeof setTimeout> | null = null;
    const b = bouton(texte, () => {
      if (attente) {
        clearTimeout(attente);
        action();
        return;
      }
      b.textContent = 'Sûr ? Touchez encore';
      attente = setTimeout(() => {
        attente = null;
        b.textContent = texte;
      }, 3000);
    });
    return b;
  }

  inviter(): void {
    ecranInviter(this, this.a);
  }

  rejoindre(codeInitial = codeDuLien(location.hash) ?? ''): void {
    ecranRejoindre(this, this.a, codeInitial);
  }
}
