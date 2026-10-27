import { estInstallee } from './installation';

/**
 * Plein écran et paysage : demandés au premier toucher (le navigateur ne les accorde qu'après un geste). Sans effet
 * dans l'application installée (déjà en plein écran) et sur iPhone, où Safari ne le permet pas (installer l'application
 * depuis « Partager → Sur l'écran d'accueil » donne le plein écran).
 */
export function pleinEcran(): void {
  const d = document.documentElement;
  // l'application installée est déjà en plein écran : le redemander ferait réapparaître le message du navigateur
  if (estInstallee()) return;
  if (document.fullscreenElement || !document.fullscreenEnabled || !d.requestFullscreen) return;
  d.requestFullscreen({ navigationUI: 'hide' })
    .then(() => verrouillePaysage())
    .catch(() => {
      /* refusé ou non pris en charge : on joue dans la page */
    });
}

type Orientation = ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void };

/** Le jeu se joue en paysage (possible seulement en plein écran, et pas sur tous les navigateurs). */
export function verrouillePaysage(): void {
  if (document.fullscreenElement)
    (screen.orientation as Orientation | undefined)?.lock?.('landscape').catch(() => {});
}

/** L'éditeur de niveau se tient aussi en portrait, comme un téléphone qu'on tient d'une main : on rend l'écran libre. */
export function liberePortrait(): void {
  const o = screen.orientation as Orientation | undefined;
  // « any » prend le pas sur le paysage imposé par l'application installée ; sinon, on lâche simplement le verrou
  if (o?.lock) o.lock('any').catch(() => o.unlock?.());
  else o?.unlock?.();
}
