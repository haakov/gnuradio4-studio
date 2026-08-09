import { describe, expect, it, vi } from 'vitest';
import {
  markOnboardingTourSeen,
  ONBOARDING_TOUR_SEEN_KEY,
  shouldAutoStartOnboardingTour,
} from './onboarding-tour-state';

describe('onboarding tour state', () => {
  it('auto-starts only when the tour has never been seen', () => {
    expect(shouldAutoStartOnboardingTour({ getItem: vi.fn().mockReturnValue(null) })).toBe(true);
    expect(shouldAutoStartOnboardingTour({ getItem: vi.fn().mockReturnValue('1') })).toBe(false);
  });

  it('does not auto-start when storage reads throw', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('storage disabled');
      }),
    };
    expect(shouldAutoStartOnboardingTour(storage)).toBe(false);
  });

  it('writes the seen flag', () => {
    const storage = { setItem: vi.fn() };
    markOnboardingTourSeen(storage);
    expect(storage.setItem).toHaveBeenCalledWith(ONBOARDING_TOUR_SEEN_KEY, '1');
  });

  it('ignores storage write failures', () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error('quota exceeded');
      }),
    };
    expect(() => markOnboardingTourSeen(storage)).not.toThrow();
  });
});
