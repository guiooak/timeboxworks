import { useMemo } from 'react';
import { diffMs, isSameMonth, now, toTimestamp } from '../../../common/services/datetime';
import type { Meeting } from '../domain/types';
import { useMeetingStore } from '../store';

export type MeetingMetrics = {
  total: number;
  finished: number;
  thisMonth: number;
  /** Weighted share of goals completed across finished meetings (0..1), or null when there are no goals. */
  goalCompletion: number | null;
  /** Real duration / expected duration across finished meetings (1 = on budget), or null without data. */
  budgetRatio: number | null;
  /** Total real time spent across finished meetings, in ms. */
  totalSpentMs: number;
  /** Most recent finished meetings, newest first (max 5). */
  recent: Meeting[];
};

const isFinished = (meeting: Meeting): boolean =>
  meeting.status === 'finished' && !!meeting.realEndTime;

/** Landing-page metrics derived live from the meetings already loaded in the store. */
export function useMeetingMetrics(): MeetingMetrics {
  const meetings = useMeetingStore((state) => state.meetings);

  return useMemo(() => {
    const finishedList = meetings.filter(isFinished);

    let weightTotal = 0;
    let weightDone = 0;
    let sumExpected = 0;
    let sumReal = 0;
    let totalSpent = 0;

    for (const meeting of finishedList) {
      for (const goal of meeting.goals) {
        const weight = Number(goal.weight) || 1;
        weightTotal += weight;
        if (goal.finishedAt) {
          weightDone += weight;
        }
      }

      const expected = Math.abs(
        diffMs(meeting.expectedStartTime, meeting.expectedEndTime),
      );
      const real = Math.abs(diffMs(meeting.realStartTime, meeting.realEndTime));
      if (expected > 0 && real > 0) {
        sumExpected += expected;
        sumReal += real;
      }
      if (real > 0) {
        totalSpent += real;
      }
    }

    const recent = [...finishedList]
      .sort((a, b) => toTimestamp(b.realEndTime) - toTimestamp(a.realEndTime))
      .slice(0, 5);

    return {
      total: meetings.length,
      finished: finishedList.length,
      thisMonth: finishedList.filter((meeting) => isSameMonth(meeting.realEndTime, now()))
        .length,
      goalCompletion: weightTotal > 0 ? weightDone / weightTotal : null,
      budgetRatio: sumExpected > 0 ? sumReal / sumExpected : null,
      totalSpentMs: totalSpent,
      recent,
    };
  }, [meetings]);
}
