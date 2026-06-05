import type { Meeting } from './types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Lightweight shape/type guard run before persisting a meeting. */
export function isValidMeeting(
  meeting: Partial<Meeting> | null | undefined,
): meeting is Meeting {
  if (!meeting) {
    return false;
  }
  const hasCore =
    isNonEmptyString(meeting.id) &&
    isNonEmptyString(meeting.name) &&
    isNonEmptyString(meeting.expectedStartTime) &&
    isNonEmptyString(meeting.expectedEndTime);
  if (!hasCore) {
    return false;
  }
  const goalsValid =
    Array.isArray(meeting.goals) &&
    meeting.goals.every(
      (goal) => isNonEmptyString(goal?.id) && isNonEmptyString(goal?.name),
    );
  return goalsValid;
}
