import type { DocumentNiveau } from './document';

/**
 * Les tyroliennes tracées poteau par poteau (DefNiveau.tyroliennes) : rien n'est déduit, chaque tyrolienne garde ses poteaux dans
 * l'ordre où on les a posés. Elles peuvent donc se croiser, se chevaucher, commencer avant qu'une autre ne finisse.
 *
 * Avec l'objet « Tyrolienne » : on touche une case pour le premier poteau, puis chaque poteau suivant (toujours dans le même sens) ;
 * on retouche le dernier poteau pour finir. Toucher le bout d'une tyrolienne finie la reprend ; un poteau dans l'autre sens finit
 * la tyrolienne en cours et en commence une autre. La gomme retire un poteau.
 */

/** une tyrolienne : ses poteaux [colonne, rangée] (la case où l'on poserait `(`), dans l'ordre */
export type Trace = [number, number][];

/** Des tyroliennes lues d'ailleurs (un export, un niveau) : des listes de cases entières. */
export const lisTraces = (l: unknown): Trace[] =>
  (Array.isArray(l) ? l : []).flatMap((t: unknown) => {
    if (!Array.isArray(t)) return [];
    const p = t.filter(
      (c): c is [number, number] => Array.isArray(c) && Number.isInteger(c[0]) && Number.isInteger(c[1]),
    );
    return p.length ? [p.map(([x, y]): [number, number] => [x, y])] : [];
  });

const meme = (c: readonly [number, number] | undefined, x: number, y: number) =>
  !!c && c[0] === x && c[1] === y;

export class TraceTyrolienne {
  /** la tyrolienne en cours de tracé (l'une de doc.tyroliennes), ou null */
  private enCours: Trace | null = null;

  /** Le dernier poteau posé de la tyrolienne en cours (pour le dessin), ou null. */
  dernier(doc: DocumentNiveau): [number, number] | null {
    return this.trace(doc)?.at(-1) ?? null;
  }

  /** Un poteau posé sur la case (x, y). */
  poteau(doc: DocumentNiveau, x: number, y: number): void {
    const t = this.trace(doc);
    if (t && meme(t.at(-1), x, y)) return this.finit(doc);
    if (t && this.prolonge(t, x)) return doc.applique(() => t.push([x, y]));
    this.finit(doc);
    // le bout d'une tyrolienne finie : on la reprend de ce côté
    const reprise = doc.tyroliennes.find((o) => meme(o.at(-1), x, y) || meme(o[0], x, y));
    if (reprise) {
      if (meme(reprise[0], x, y)) doc.applique(() => reprise.reverse());
      this.enCours = reprise;
      return;
    }
    const neuve: Trace = [[x, y]];
    doc.applique(() => doc.tyroliennes.push(neuve));
    this.enCours = neuve;
  }

  /** La tyrolienne en cours est finie (on change d'outil ou d'objet) ; un poteau seul s'en va. */
  finit(doc: DocumentNiveau): void {
    const t = this.trace(doc);
    this.enCours = null;
    if (t && t.length < 2) doc.applique(() => doc.tyroliennes.splice(doc.tyroliennes.indexOf(t), 1));
  }

  /** La gomme : le poteau de la case s'en va, et sa tyrolienne si elle n'a plus qu'un poteau. */
  gomme(doc: DocumentNiveau, x: number, y: number): void {
    const t = doc.tyroliennes.find((o) => o.some(([px, py]) => px === x && py === y));
    if (!t) return;
    doc.applique(() => {
      t.splice(
        t.findIndex(([px, py]) => px === x && py === y),
        1,
      );
      if (t.length < 2 && t !== this.enCours) doc.tyroliennes.splice(doc.tyroliennes.indexOf(t), 1);
    });
  }

  /** la tyrolienne en cours, si elle est encore dans le document (une annulation a pu la retirer) */
  private trace(doc: DocumentNiveau): Trace | null {
    if (this.enCours && !doc.tyroliennes.includes(this.enCours)) this.enCours = null;
    return this.enCours;
  }

  /** Un poteau en colonne `x` continue-t-il la tyrolienne, dans son sens (le sens du premier tronçon) ? */
  private prolonge(t: Trace, x: number): boolean {
    const dernier = t.at(-1)![0];
    if (x === dernier) return false;
    return t.length < 2 || Math.sign(x - dernier) === Math.sign(dernier - t[0]![0]);
  }
}
