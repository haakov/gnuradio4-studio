import { useCallback, useEffect, useRef } from 'react';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { buildOnboardingTourSteps, selectRenderedTourSteps } from './onboarding-tour-steps';
import { markOnboardingTourSeen, shouldAutoStartOnboardingTour } from './onboarding-tour-state';

export type UseOnboardingTourResult = {
  startTour: () => void;
};

/**
 * Drives the first-run onboarding tour. Auto-starts once per browser profile;
 * `startTour` replays it on demand from the header button.
 */
export function useOnboardingTour(): UseOnboardingTourResult {
  const driverRef = useRef<Driver | null>(null);

  const startTour = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }

    driverRef.current?.destroy();

    const steps = selectRenderedTourSteps(
      buildOnboardingTourSteps(),
      (selector) => document.querySelector(selector) !== null,
    );
    if (steps.length === 0) {
      return;
    }

    const instance = driver({
      steps,
      popoverClass: 'gr4-tour',
      showProgress: true,
      progressText: '{{current}} / {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      stagePadding: 4,
      stageRadius: 6,
      overlayColor: '#020617',
      overlayOpacity: 0.68,
      // The shell owns scrolling; letting driver.js scroll would fight the panel layout.
      smoothScroll: false,
      // Highlighted panels stay read-only during the tour so a stray click
      // cannot mutate the graph mid-step.
      disableActiveInteraction: true,
      onDestroyed: () => {
        if (typeof window !== 'undefined') {
          markOnboardingTourSeen(window.localStorage);
        }
      },
    });

    driverRef.current = instance;
    instance.drive();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!shouldAutoStartOnboardingTour(window.localStorage)) {
      return;
    }

    // Defer past the first paint so panel anchors exist before we measure them.
    const timer = window.setTimeout(startTour, 400);
    return () => window.clearTimeout(timer);
  }, [startTour]);

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, []);

  return { startTour };
}
