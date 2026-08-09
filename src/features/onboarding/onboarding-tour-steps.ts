import type { DriveStep } from 'driver.js';

/**
 * Anchors are declared as `data-tour` attributes on the Studio shell so the tour
 * never depends on Tailwind class names or DOM structure.
 */
export type OnboardingTourAnchor =
  | 'block-catalog'
  | 'graph-canvas'
  | 'inspector'
  | 'view-switcher'
  | 'run-controls'
  | 'document-actions';

export function tourAnchorSelector(anchor: OnboardingTourAnchor): string {
  return `[data-tour="${anchor}"]`;
}

/**
 * The full tour, in order. Steps whose anchor is not currently rendered are
 * dropped by `selectRenderedTourSteps` so the progress counter stays honest.
 */
export function buildOnboardingTourSteps(): DriveStep[] {
  return [
    {
      popover: {
        title: 'Welcome to gr4-studio',
        description:
          'A quick tour of the three surfaces you will use most: designing a GR4 flowgraph, laying it out as an application, and running it. Takes about a minute.',
      },
    },
    {
      element: tourAnchorSelector('block-catalog'),
      popover: {
        title: 'Block catalog',
        description:
          'Every GR4 block reflected by the control plane shows up here. Click one to drop it onto the canvas.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: tourAnchorSelector('graph-canvas'),
      popover: {
        title: 'Graph canvas',
        description:
          'Wire blocks together by dragging between ports. Select a block to inspect it, or double-click it to edit its full parameter set.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: tourAnchorSelector('inspector'),
      popover: {
        title: 'Inspector',
        description:
          'Edit the selected block’s parameters here. While a session is running, edits are pushed to the live block — your saved graph defaults stay intact.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: tourAnchorSelector('view-switcher'),
      popover: {
        title: 'Graph, Variables, Layout',
        description:
          'Switch the centre pane. Variables defines graph-wide values you can bind controls to; Layout Editor arranges live plots and controls into an application workspace.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: tourAnchorSelector('run-controls'),
      popover: {
        title: 'Run controls',
        description:
          'Run the current graph as a session, open its display application, then stop or delete the session. The pill on the left shows live execution state.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: tourAnchorSelector('document-actions'),
      popover: {
        title: 'Saving your work',
        description:
          'Graphs are saved as .gr4s Studio documents, including layout and variables. The badge beside these buttons shows the control-plane connection.',
        side: 'bottom',
        align: 'end',
      },
    },
  ];
}

/**
 * Drops steps whose anchor is not in the DOM. Parts of the shell are
 * conditional (run controls only exist once a tab has a runtime view), and a
 * step pointing at a missing element would otherwise render unanchored.
 */
export function selectRenderedTourSteps(
  steps: DriveStep[],
  isAnchorRendered: (selector: string) => boolean,
): DriveStep[] {
  return steps.filter((step) => {
    if (typeof step.element !== 'string') {
      return true;
    }
    return isAnchorRendered(step.element);
  });
}
