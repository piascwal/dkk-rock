import { lienInvitation, nettoiePseudo, normaliseCode, texteLatence, type Annonce } from '@piascwal/lan-kit';
import { JOUEURS_HISTOIRE, MAX_JOUEURS } from '../config';
import { NIVEAUX } from '../niveaux';
import type { AnnonceDkk } from '../reseau/annonce';
import { Recherche } from '../reseau/client';
import { bouton, el } from './elements';
import type { Actions, Menus } from './menus';

/** L'hôte ouvre sa partie : Wi-Fi automatiquement, Internet avec un code. */
export function ecranInviter(m: Menus, a: Actions): void {
  const hote = a.ouvreHote();
  if (!hote) return m.pause();
  const statut = el('p', '', 'statut');
  // les messages du partage (le statut du Wi-Fi, lui, se rafraîchit chaque seconde)
  const info = el('p', '', 'aide');
  const codeEl = el('div', hote.code ?? '', 'code');
  const joueurs = el('div', '', 'liste');
  const lien = () => lienInvitation(location.href, hote.code ?? '');
  // le partage du système (Messages, WhatsApp...) s'ouvre par-dessus le jeu : on envoie le lien sans quitter l'application
  const partager = () => {
    if (!navigator.share) {
      void navigator.clipboard
        ?.writeText(lien())
        .then(() => (info.textContent = 'Lien copié : collez-le à vos amis.'));
      return;
    }
    navigator
      .share({ title: 'DKK : Rock Never Dies', text: `Rejoins ma partie ! Code ${hote.code}`, url: lien() })
      .catch((e: Error) => {
        // le navigateur refuse un partage trop longtemps après le toucher (le temps de créer le code) : un toucher de plus
        if (e.name === 'NotAllowedError') info.textContent = 'Code prêt : touchez « Partager le lien ».';
      });
  };
  const partage = bouton(hote.code ? 'Partager le lien' : 'Inviter par un lien', () => {
    if (hote.code) return partager();
    partage.disabled = true;
    info.textContent = 'Création du code...';
    hote.ouvreInternet().then(
      (code) => {
        codeEl.textContent = code;
        partage.disabled = false;
        partage.textContent = 'Partager le lien';
        partager();
      },
      () => {
        info.textContent = 'Impossible de joindre les serveurs de rencontre.';
        partage.disabled = false;
      },
    );
  });
  const rafraichit = () => {
    statut.textContent =
      hote.wifi === 'ouvert'
        ? 'Partie visible sur votre Wi-Fi.'
        : hote.wifi === 'erreur'
          ? 'Wi-Fi indisponible : envoyez un lien.'
          : 'Ouverture sur le Wi-Fi...';
    joueurs.replaceChildren(
      ...[...hote.distants.values()].map((d) =>
        el('div', `🎸 ${d.nom} — ${texteLatence(d.veille.latenceMs)}`),
      ),
    );
    if (!hote.distants.size) joueurs.append(el('div', 'Personne pour l’instant.', 'aide'));
  };
  hote.onChange = rafraichit;
  if (hote.wifi === 'ferme') void hote.ouvreWifi();
  m.montre(
    el('h2', 'Inviter des amis'),
    el(
      'p',
      'Sur le même Wi-Fi, vos amis voient la partie dans « Rejoindre des amis ». Sinon, envoyez-leur un lien : il ouvre le jeu et les fait entrer.',
      'aide',
    ),
    statut,
    codeEl,
    partage,
    info,
    joueurs,
    bouton('Retour au jeu', () => a.reprend(), 'principal'),
  );
  rafraichit();
  m.toutesLesSecondes(rafraichit);
}

/** Rejoindre une partie : liste du Wi-Fi, ou code d'un ami (aussi pré-rempli par un lien d'invitation). */
export function ecranRejoindre(m: Menus, a: Actions, codeInitial: string): void {
  const s = a.sauvegarde;
  const statut = el('p', 'Recherche sur le Wi-Fi...', 'statut');
  const liste = el('div', '', 'liste');
  const pseudo = el('input');
  pseudo.value = s.pseudo;
  pseudo.placeholder = 'Pseudo';
  pseudo.maxLength = 14;
  const code = el('input');
  code.value = codeInitial;
  code.placeholder = 'CODE-AMI';
  code.maxLength = 9;
  const nom = () => {
    s.pseudo = nettoiePseudo(pseudo.value, 'ROCKEUR');
    a.enregistre();
    return s.pseudo;
  };
  const tente = async (r: Recherche, an: Annonce<AnnonceDkk>) => {
    statut.textContent = `Connexion à ${an.nom}...`;
    try {
      await a.rejoins(r, an, nom(), s.membre);
    } catch (e) {
      statut.textContent = `Échec : ${(e as Error).message === 'complet' ? 'la partie est pleine' : 'connexion impossible'}.`;
    }
  };
  const parCode = bouton(
    'Rejoindre par code',
    () => {
      const c = normaliseCode(code.value);
      if (!c) return void (statut.textContent = 'Code invalide (8 caractères).');
      statut.textContent = 'Recherche du salon...';
      void Recherche.code(c).then(
        (r) => {
          const garde = setTimeout(() => (statut.textContent = 'Aucune partie avec ce code.'), 15_000);
          r.onMaj = () => {
            const an = [...r.annonces.values()][0];
            if (!an) return;
            clearTimeout(garde);
            r.onMaj = () => {};
            void tente(r, an);
          };
        },
        () => (statut.textContent = 'Serveurs de rencontre injoignables.'),
      );
    },
    'principal',
  );
  const ligne = el('div', '', 'ligne');
  ligne.append(pseudo, code, parCode);
  m.montre(
    el('h2', 'Rejoindre des amis'),
    ligne,
    statut,
    liste,
    bouton('Retour', () => m.titre()),
  );
  void Recherche.wifi().then(
    (r) => {
      m.recherche = r;
      statut.textContent = 'Parties sur votre Wi-Fi :';
      r.onMaj = () =>
        liste.replaceChildren(
          ...[...r.annonces.values()].map((an) =>
            bouton(
              `${an.nom} — ${an.arene ? 'Battle royale' : (NIVEAUX[an.niveau]?.titre ?? '')} (${an.joueurs}/${an.arene ? MAX_JOUEURS : JOUEURS_HISTOIRE})`,
              () => void tente(r, an),
            ),
          ),
        );
    },
    () => (statut.textContent = 'Wi-Fi indisponible : utilisez le code d’un ami.'),
  );
  if (codeInitial) parCode.click();
}
