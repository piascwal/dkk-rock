import type { EtatVue } from '../jeu/vue';
import { NOUVEAUTES, type Nouveaute } from '../niveaux/nouveautes';
import { DESSINS_ENNEMIS_NOUVEAUX, DESSINS_OBJETS_NOUVEAUX } from '../rendu/dessins-nouveautes';
import { pinceau } from '../rendu/pinceau';

/**
 * La première fois qu'on voit une nouveauté (voir niveaux/nouveautes.ts) : un bandeau la présente, son dessin en grand, son nom
 * et ce qu'elle fait en une ligne. Seul, la partie attend (comme pour l'entrée d'un boss, qui porte ce bandeau : entree-boss.ts) ;
 * un toucher ou une touche l'abrège. Une fois par nouveauté et par ouverture du jeu. Ne lit que la vue.
 */

/** Durée (ms), et délai avant de pouvoir passer. */
const DUREE = 3200;
const AVANT_SAUT = 500;
/** À quelle distance d'un héros (pixels du monde) elle compte comme vue. */
const PRES = { x: 150, y: 90 };

export class Decouverte {
  private readonly boite = document.createElement('div');
  private readonly vues = new Set<number>();
  private debut = 0;
  private actif = false;
  private fin = 0;

  constructor() {
    this.boite.className = 'decouverte';
    this.boite.hidden = true;
    document.body.append(this.boite);
  }

  get enCours(): boolean {
    return this.actif;
  }

  maj(v: EtatVue): void {
    if (this.actif || v.phase !== 'jeu') return;
    const heros = v.joueurs.filter((j) => j.present && !j.mort);
    for (const n of NOUVEAUTES) {
      if (this.vues.has(n.genre)) continue;
      const e = v.entites.find(
        (o) =>
          o.g === n.genre && heros.some((h) => Math.abs(h.x - o.x) < PRES.x && Math.abs(h.y - o.y) < PRES.y),
      );
      if (!e) continue;
      this.vues.add(n.genre);
      this.montre(n);
      return;
    }
  }

  private montre(n: Nouveaute): void {
    const toile = document.createElement('canvas');
    [toile.width, toile.height] = [160, 160];
    const ctx = toile.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(80, 140);
    ctx.scale(5, 5);
    (DESSINS_ENNEMIS_NOUVEAUX[n.genre] ?? DESSINS_OBJETS_NOUVEAUX[n.genre])?.(pinceau(ctx), 0, 0);
    const texte = document.createElement('div');
    for (const [classe, s] of [
      ['decouverte-nouveau', 'NOUVEAU !'],
      ['decouverte-nom', n.nom],
      ['decouverte-astuce', n.astuce],
    ] as const) {
      const p = document.createElement('p');
      p.className = classe;
      p.textContent = s;
      texte.append(p);
    }
    this.boite.replaceChildren(toile, texte);
    this.boite.hidden = false;
    this.actif = true;
    this.debut = performance.now();
    this.fin = window.setTimeout(this.termine, DUREE);
    window.addEventListener('keydown', this.saute, true);
    window.addEventListener('pointerdown', this.saute, true);
  }

  private saute = (): void => {
    if (performance.now() - this.debut > AVANT_SAUT) this.termine();
  };

  private termine = (): void => {
    clearTimeout(this.fin);
    this.actif = false;
    this.boite.hidden = true;
    window.removeEventListener('keydown', this.saute, true);
    window.removeEventListener('pointerdown', this.saute, true);
  };
}
