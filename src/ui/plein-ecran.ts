/**
 * Plein écran et paysage : demandés au premier toucher (le navigateur ne les accorde qu'après un geste). Sans effet
 * dans l'application installée (déjà en plein écran) et sur iPhone, où Safari ne le permet pas (installer l'application
 * depuis « Partager → Sur l'écran d'accueil » donne le plein écran).
 */
export function pleinEcran(): void {
  const d = document.documentElement;
  if (document.fullscreenElement || !document.fullscreenEnabled || !d.requestFullscreen) return;
  d.requestFullscreen({ navigationUI: 'hide' })
    .then(() =>
      (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'),
    )
    .catch(() => {
      /* refusé ou non pris en charge : on joue dans la page */
    });
}
