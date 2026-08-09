export const ONBOARDING_TOUR_SEEN_KEY = 'gr4studio.onboarding_tour.seen';

export function shouldAutoStartOnboardingTour(storage: Pick<Storage, 'getItem'>): boolean {
  try {
    return storage.getItem(ONBOARDING_TOUR_SEEN_KEY) !== '1';
  } catch {
    // Storage unavailable (private mode, disabled cookies): do not nag on every load.
    return false;
  }
}

export function markOnboardingTourSeen(storage: Pick<Storage, 'setItem'>): void {
  try {
    storage.setItem(ONBOARDING_TOUR_SEEN_KEY, '1');
  } catch {
    // Ignore storage write failures; the tour simply replays on the next visit.
  }
}
