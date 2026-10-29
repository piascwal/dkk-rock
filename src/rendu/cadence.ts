/**
 * Au plus une image dessinée par pas de la partie (60 par seconde) sur un écran à plus de 80 Hz (90, 120, 144...) : on ne
 * redessine pas deux fois la même scène, et ce que le rendu fait avancer à chaque image (neige, particules, décor animé) garde
 * sa vitesse. Un écran à 80 Hz ou moins (60, 72, 75 Hz, ou un appareil qui rame) dessine chaque image qu'il reçoit : le limiteur
 * n'y change rien, et ne risque pas de sauter une image à cause d'un peu de gigue. La fréquence de l'écran est la médiane des
 * derniers intervalles entre deux images.
 */
export function cadence(pas: number): (instant: number) => boolean {
  const recents: number[] = [];
  let reste = 0;
  let avant = 0;
  return (instant) => {
    const ecart = Math.min(250, avant ? instant - avant : pas);
    avant = instant;
    recents.push(ecart);
    if (recents.length > 12) recents.shift();
    const mediane = [...recents].sort((a, b) => a - b)[recents.length >> 1]!;
    // un écran à 80 Hz ou moins (ou à peine démarré) : tout est dessiné
    if (recents.length < 4 || mediane >= pas * 0.75) {
      reste = 0;
      return true;
    }
    reste += ecart;
    if (reste < pas * 0.9) return false;
    reste = Math.max(-pas / 2, Math.min(reste - pas, pas));
    return true;
  };
}
