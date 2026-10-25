import { TEXTE_SUR, type ValideContenu } from '@piascwal/lan-kit';

/** Ce qu'un hôte annonce de sa partie aux autres appareils. */
export interface AnnonceDkk {
  nom: string;
  niveau: number;
  joueurs: number;
  /** une partie de battle royale (8 places), et non l'histoire (4) */
  arene?: boolean;
}

export const valideAnnonceDkk: ValideContenu<AnnonceDkk> = (o) => {
  const { nom, niveau, joueurs, arene } = o;
  if (typeof nom !== 'string' || !TEXTE_SUR.test(nom)) return null;
  if (typeof niveau !== 'number' || !Number.isInteger(niveau) || niveau < 0 || niveau > 255) return null;
  if (typeof joueurs !== 'number' || !Number.isInteger(joueurs) || joueurs < 1 || joueurs > 8) return null;
  return { nom, niveau, joueurs, ...(arene === true ? { arene: true } : {}) };
};
