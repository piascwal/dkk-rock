import { HEROS } from '../entites/heros';
import { armeRamassee } from '../entites/armes';
import type { EtatVue } from '../jeu/vue';

/** Le HUD (HTML) : un cartouche par joueur, les vies et le score, la barre du boss. Mis à jour seulement quand il change. */
export class Hud {
  private dernier = '';

  constructor(private readonly element: HTMLElement) {}

  maj(v: EtatVue, siegeLocal: number, noms: string[]): void {
    const joueurs = v.joueurs
      .map((j, s) => {
        if (!j.present) return '';
        const h = HEROS[j.membre]!;
        const arme = armeRamassee(j.arme);
        const nom = noms[s] && v.joueurs.filter((x) => x.present).length > 1 ? ` · ${noms[s]}` : '';
        return `<div class="hud-joueur${j.mort ? ' mort' : ''}" style="--couleur:${h.couleur}">
          ${s === siegeLocal ? '▶ ' : ''}${h.nom}${echappe(nom)}
          <span class="coeurs">${'♥'.repeat(Math.max(0, j.pv))}</span>
          <span class="etoiles">${'★'.repeat(Math.min(6, j.speciaux))}</span>
          ${arme ? `<br>${arme.icone} ${arme.nom} ×${j.munitions}` : ''}
        </div>`;
      })
      .join('');
    const boss =
      v.boss >= 0 ? `<div id="barre-boss"><div style="width:${Math.round(v.boss * 100)}%"></div></div>` : '';
    const html = `<div class="hud-joueurs">${joueurs}</div>
      <div class="hud-droite">🎸 × ${v.vies}<br>${v.score.toLocaleString('fr-FR')}</div>${boss}`;
    if (html === this.dernier) return;
    this.dernier = html;
    this.element.innerHTML = html;
  }
}

/** Échappe un texte venu d'ailleurs (pseudo d'un joueur distant) avant de le mettre dans du HTML. */
export const echappe = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
