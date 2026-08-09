import { describe, expect, it } from 'vitest';
import {
  buildOnboardingTourSteps,
  selectRenderedTourSteps,
  tourAnchorSelector,
} from './onboarding-tour-steps';

describe('onboarding tour steps', () => {
  it('builds an ordered tour that opens with an unanchored welcome step', () => {
    const steps = buildOnboardingTourSteps();

    expect(steps.length).toBeGreaterThan(1);
    expect(steps[0].element).toBeUndefined();
    expect(steps.every((step) => step.popover?.title && step.popover?.description)).toBe(true);
  });

  it('anchors every non-welcome step to a data-tour selector', () => {
    const anchored = buildOnboardingTourSteps().slice(1);

    expect(anchored.every((step) => typeof step.element === 'string')).toBe(true);
    expect(anchored.map((step) => step.element)).toEqual([
      tourAnchorSelector('block-catalog'),
      tourAnchorSelector('graph-canvas'),
      tourAnchorSelector('inspector'),
      tourAnchorSelector('view-switcher'),
      tourAnchorSelector('run-controls'),
      tourAnchorSelector('document-actions'),
    ]);
  });

  it('keeps unanchored steps and anchored steps that are rendered', () => {
    const steps = buildOnboardingTourSteps();
    const selected = selectRenderedTourSteps(steps, () => true);

    expect(selected).toEqual(steps);
  });

  it('drops steps whose anchor is not rendered', () => {
    const steps = buildOnboardingTourSteps();
    const runControlsSelector = tourAnchorSelector('run-controls');

    const selected = selectRenderedTourSteps(steps, (selector) => selector !== runControlsSelector);

    expect(selected).toHaveLength(steps.length - 1);
    expect(selected.some((step) => step.element === runControlsSelector)).toBe(false);
    expect(selected[0].element).toBeUndefined();
  });
});
