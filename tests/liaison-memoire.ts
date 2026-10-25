import type { Liaison } from '@piascwal/lan-kit';

/**
 * Deux bouts de liaison reliés en mémoire, qui se comportent comme une
 * Liaison de lan-kit une fois ouverte (JSON sur `ctrl`, binaire sur `jeu`).
 */
interface Bout {
  onCtrl: (m: unknown) => void;
  onJeu: (d: ArrayBuffer) => void;
  onFerme: () => void;
  autre: Bout | null;
  ferme_: boolean;
  envoieCtrl(m: unknown): void;
  envoieJeu(d: ArrayBuffer): void;
  ferme(): void;
}

export function paire(): [Liaison, Liaison] {
  const bout = (): Bout => ({
    onCtrl: (_m: unknown) => {},
    onJeu: (_d: ArrayBuffer) => {},
    onFerme: () => {},
    autre: null,
    ferme_: false,
    envoieCtrl(m: unknown) {
      const copie = JSON.parse(JSON.stringify(m));
      queueMicrotask(() => this.autre?.onCtrl(copie));
    },
    envoieJeu(d: ArrayBuffer) {
      const copie = d.slice(0);
      queueMicrotask(() => this.autre?.onJeu(copie));
    },
    ferme() {
      if (this.ferme_) return;
      this.ferme_ = true;
      this.onFerme();
      this.autre?.ferme();
    },
  });
  const a = bout();
  const b = bout();
  a.autre = b;
  b.autre = a;
  return [a as unknown as Liaison, b as unknown as Liaison];
}
