import type { Theme } from '../../../common/components';

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;

export type TimeFeedback = {
  momentMessage: string;
  durationMessage: string;
  theme: Theme;
};

/** Map a signed time difference (ms) to a feedback band. */
export function getTimeDisplayFeedbackByDiff(diff: number): TimeFeedback {
  if (typeof diff !== 'number' || Number.isNaN(diff)) {
    return { momentMessage: '', durationMessage: '', theme: 'secondary' };
  }
  if (diff < FIVE_MINUTES * -1) {
    return { momentMessage: 'Very late by', durationMessage: 'Wasted', theme: 'danger' };
  }
  if (diff < ONE_MINUTE * -1) {
    return { momentMessage: 'Late by', durationMessage: 'Wasted', theme: 'warning' };
  }
  if (diff < 0) {
    return {
      momentMessage: 'A little late by',
      durationMessage: 'Wasted',
      theme: 'warning',
    };
  }
  if (diff < ONE_MINUTE) {
    return {
      momentMessage: 'On target! Left just',
      durationMessage: 'On target! Left just',
      theme: 'success',
    };
  }
  return { momentMessage: 'Advanced by', durationMessage: 'Saved', theme: 'success' };
}
