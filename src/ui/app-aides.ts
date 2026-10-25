import { MAX_JOUEURS } from '../config';
import type { Bruitages } from '../audio/sons';
import type { Synthe } from '../audio/synthe';
import type { EtatVue, Evenement } from '../jeu/vue';
import type { Client } from '../reseau/client';
import type { Hote } from '../reseau/hote';
import { verifieVersion } from '../version';
import type { Bulles } from './dialogues';
import { afficheNouvelleVersion } from './maj';

/** Des morceaux de l'application (voir app.ts) qui n'ont besoin de rien d'autre que de ce qu'on leur passe. */

/** Les noms à afficher au-dessus des joueurs : ceux du salon (invité), ou le sien et ceux des invités (hôte). */
export function nomsDesJoueurs(client: Client | null, hote: Hote | null, pseudo: string): string[] {
  const noms: string[] = Array<string>(MAX_JOUEURS).fill('');
  if (client) for (const j of client.joueurs) noms[j.siege] = j.nom;
  else if (hote) {
    noms[0] = pseudo || 'DKK';
    for (const d of hote.distants.values()) noms[d.siege] = d.nom;
  }
  return noms;
}

/** Les sons (plus faibles au loin) et les bulles de dialogue d'une liste d'événements. */
export function joueEvenements(
  l: readonly Evenement[],
  v: EtatVue | null,
  siege: number,
  bruitages: Bruitages,
  bulles: Bulles,
): void {
  const moi = v?.joueurs[siege];
  for (const e of l) {
    if (e.k === 'son') {
      const d = moi && (e.x || e.y) ? Math.hypot(e.x - moi.x, e.y - moi.y) : 0;
      bruitages.joue(e.n, d);
    } else if (e.k === 'bulle') bulles.ajoute(e.qui, e.texte);
  }
}

/** À l'ouverture et au retour sur l'onglet (au plus une fois par minute) : une version plus récente est-elle publiée ? */
export function controleurDeVersion(cadre: HTMLElement): () => void {
  let derniere = 0;
  return () => {
    if (Date.now() - derniere < 60_000) return;
    derniere = Date.now();
    void verifieVersion(import.meta.env.BASE_URL).then((r) => {
      if (r.etat === 'nouvelle' && r.derniere) afficheNouvelleVersion(cadre, r.derniere);
    });
  };
}

/**
 * Ce que l'application écoute de la fenêtre : le premier geste (le son ne démarre qu'après lui), la taille de l'écran, Entrée
 * (tourne les pages), et l'arrière-plan (plus de son ; une partie seul se met en pause ; au retour, on regarde la version).
 */
export function ecouteLaFenetre(o: {
  synthe: Synthe;
  geste: () => void;
  recalibre: () => void;
  entree: () => unknown;
  cache: () => unknown;
  revient: () => void;
}): void {
  const geste = () => {
    o.synthe.demarre();
    o.geste();
  };
  window.addEventListener('pointerdown', geste);
  window.addEventListener('keydown', geste);
  window.addEventListener('pagehide', () => o.synthe.endort()); // iOS, appli installée : pagehide avant le gel
  window.addEventListener('resize', o.recalibre);
  window.addEventListener('orientationchange', o.recalibre);
  window.visualViewport?.addEventListener('resize', o.recalibre);
  window.addEventListener('keydown', (e) => e.code === 'Enter' && o.entree());
  document.addEventListener('visibilitychange', () => {
    // en arrière-plan : plus de son (téléphone : écran verrouillé, autre appli) ; au retour, il reprend
    if (document.hidden) o.synthe.endort();
    else o.synthe.demarre();
    if (document.hidden) o.cache();
    else o.revient();
  });
}
