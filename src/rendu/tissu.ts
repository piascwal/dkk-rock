import { T } from '../monde/tuiles';
import { px, type Peintre } from './atlas-pierres';

/**
 * Les tissus (monde/tuiles.ts : T.TISSU, T.TISSU_BLANC) : un tissage sur 16 px, où chaque motif se répète à l'identique d'une tuile à
 * l'autre, pour que des tuiles côte à côte ne laissent aucune couture. Le bord qui ondule est dessiné par rendu/bords-tuiles.ts.
 */

/** Un tissage de couleur `base` : des fils clairs et sombres en damier de deux pixels, quelques fils plus sombres espacés. */
function tissage(base: readonly [number, number, number], clair: number, sombre: number): Peintre {
  // la couleur, éclaircie (k > 0) ou assombrie (k < 0) d'autant
  const teinte = (k: number) => {
    const [r, g, b] = base.map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)));
    return `rgb(${r},${g},${b})`;
  };
  return (c) => {
    px(c, 0, 0, 16, 16, teinte(0));
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        if (((x >> 1) + (y >> 1)) % 2) px(c, x, y, 1, 1, teinte(clair));
        // un motif de 16 px, donc sans couture
        if ((x * 5 + y * 3) % 16 === 0) px(c, x, y, 1, 1, teinte(sombre));
      }
  };
}

export const PEINTRES_TISSU: Partial<Record<number, Peintre>> = {
  [T.TISSU]: tissage([138, 75, 60], 0.1, -0.18),
  // la voile : une toile crème, un tissage presque invisible
  [T.TISSU_BLANC]: tissage([244, 242, 234], 0.04, -0.07),
};
