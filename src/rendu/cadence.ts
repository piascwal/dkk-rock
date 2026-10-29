/**
 * Au plus une image dessinée par pas de la partie (60 par seconde) : sur un écran à 90 ou 120 Hz, on ne redessine pas deux fois
 * la même scène, et ce que le rendu fait avancer à chaque image (neige, particules, décor animé) garde sa vitesse.
 */
export function cadence(pas: number): (instant: number) => boolean {
  let reste = 0;
  let avant = 0;
  return (instant) => {
    reste += Math.min(250, instant - (avant || instant - pas));
    avant = instant;
    if (reste < pas * 0.9) return false;
    reste = Math.max(-pas / 2, Math.min(reste - pas, pas));
    return true;
  };
}
