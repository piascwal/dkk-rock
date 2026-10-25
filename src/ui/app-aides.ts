import { MAX_JOUEURS } from '../config';
import type { Bruitages } from '../audio/sons';
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
