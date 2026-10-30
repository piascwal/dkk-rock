/**
 * Le mode essai : les niveaux refaits encore en essai (voir niveaux/refontes.ts) se jouent sur cet appareil, en solo, avant
 * d'être publiés aux joueurs. `?essai` (ou `?essai=1`) dans l'adresse l'allume, et l'appareil s'en souvient ; `?essai=0`
 * l'éteint. Un bandeau le rappelle en bas de l'écran.
 */
import { choisitVersions, versionsEnEssai } from '../niveaux';

const CLE = 'dkk-rock.essai';

/** Vrai si le mode essai est demandé (l'adresse d'abord, puis le souvenir de l'appareil). */
export function modeEssai(): boolean {
  const demande = new URLSearchParams(location.search).get('essai');
  try {
    if (demande === '0') localStorage.removeItem(CLE);
    else if (demande !== null) localStorage.setItem(CLE, '1');
    return localStorage.getItem(CLE) === '1';
  } catch {
    return demande !== null && demande !== '0';
  }
}

/** Le bandeau du mode essai, en bas à gauche de l'écran ; il ne capte aucun toucher. */
export function afficheBandeauEssai(): void {
  const b = document.createElement('div');
  b.id = 'bandeau-essai';
  b.textContent = 'ESSAI : niveaux refaits';
  document.body.append(b);
}

/** Avant de rejoindre une partie : les versions publiées des niveaux, celles de l'hôte (le mode essai revient en quittant). */
export function versionsDeLHote(): void {
  if (versionsEnEssai()) choisitVersions(false);
}

/** De retour en solo (après une partie rejointe) : le mode essai reprend ses niveaux refaits. */
export function versionsDuModeEssai(): void {
  if (modeEssai() !== versionsEnEssai()) choisitVersions(modeEssai());
}
