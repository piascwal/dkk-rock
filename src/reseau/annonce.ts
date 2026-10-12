import { TEXTE_SUR, type ValideContenu } from '@piascwal/lan-kit';

/** Ce qu'un hôte annonce de sa partie aux autres appareils. */
export interface AnnonceDkk {
  nom: string;
  niveau: number;
  joueurs: number;
}

export const valideAnnonceDkk: ValideContenu<AnnonceDkk> = (o) => {
  const { nom, niveau, joueurs } = o;
  if (typeof nom !== 'string' || !TEXTE_SUR.test(nom)) return null;
  if (typeof niveau !== 'number' || !Number.isInteger(niveau) || niveau < 0 || niveau > 99) return null;
  if (typeof joueurs !== 'number' || !Number.isInteger(joueurs) || joueurs < 1 || joueurs > 4) return null;
  return { nom, niveau, joueurs };
};
