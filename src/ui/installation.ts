/**
 * L'application installable (PWA) : le service worker garde le jeu en cache (jouer hors ligne), et le navigateur
 * propose de l'installer. On retient sa proposition pour l'offrir au bon moment, par un bouton du menu.
 */
interface ProposeInstallation extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let proposition: ProposeInstallation | null = null;
let auChangement: () => void = () => {};

/** Enregistre le service worker (sur le site publié seulement) et écoute la proposition d'installation. */
export function prepareInstallation(base: string, quandChange: () => void): void {
  auChangement = quandChange;
  if (import.meta.env.PROD && 'serviceWorker' in navigator)
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {
      /* pas de cache hors ligne : le jeu marche quand même en ligne */
    });
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    proposition = e as ProposeInstallation;
    auChangement();
  });
  window.addEventListener('appinstalled', () => {
    proposition = null;
    auChangement();
  });
}

export const estInstallee = (): boolean =>
  matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Android, ordinateur : le navigateur sait installer ; iPhone : il faut passer par le menu Partager. */
export const peutInstaller = (): boolean => !!proposition;
export const surIPhone = (): boolean => /iPhone|iPad|iPod/.test(navigator.userAgent) && !estInstallee();

export async function installe(): Promise<void> {
  if (!proposition) return;
  await proposition.prompt();
  await proposition.userChoice;
  proposition = null;
  auChangement();
}
