import { Heading, TimeDisplay } from '../../../common/components';
import { diffMs, formatDuration, formatTime } from '../../../common/services/datetime';
import { getTimeDisplayFeedbackByDiff } from '../domain/timeDisplayFeedbackRules';
import styles from './MeetingReport.module.css';

type MetricCardProps = {
  label: string;
  planned: string;
  actual: string;
  /** Signed expected − actual (ms). Negative means it ran late / over. */
  diff: number;
  kind: 'moment' | 'duration';
};

function MetricCard({ label, planned, actual, diff, kind }: MetricCardProps) {
  const feedback = getTimeDisplayFeedbackByDiff(diff);
  const message = kind === 'duration' ? feedback.durationMessage : feedback.momentMessage;
  return (
    <TimeDisplay
      theme={feedback.theme}
      header={label}
      footer={
        <span className={styles.timeCardFooter}>
          <span className={styles.planned}>planned {planned}</span>
          {message && (
            <span>
              {message} {formatDuration(Math.abs(diff))}
            </span>
          )}
        </span>
      }
    >
      <span className={styles.timeCardValue}>{actual}</span>
    </TimeDisplay>
  );
}

export type TimeCardsGridProps = {
  expectedStartTime: string;
  expectedEndTime: string;
  realStartTime: string;
  realEndTime: string;
};

export function TimeCardsGrid({
  expectedStartTime,
  expectedEndTime,
  realStartTime,
  realEndTime,
}: TimeCardsGridProps) {
  const expectedDuration = diffMs(expectedEndTime, expectedStartTime);
  const realDuration = diffMs(realEndTime, realStartTime);

  return (
    <section>
      <Heading size="sm" level={2}>
        Timing
      </Heading>
      <div className={styles.timeGrid}>
        <MetricCard
          label="Start"
          planned={formatTime(expectedStartTime)}
          actual={formatTime(realStartTime)}
          diff={diffMs(expectedStartTime, realStartTime)}
          kind="moment"
        />
        <MetricCard
          label="End"
          planned={formatTime(expectedEndTime)}
          actual={formatTime(realEndTime)}
          diff={diffMs(expectedEndTime, realEndTime)}
          kind="moment"
        />
        <MetricCard
          label="Total duration"
          planned={formatDuration(Math.abs(expectedDuration))}
          actual={formatDuration(Math.abs(realDuration))}
          diff={expectedDuration - realDuration}
          kind="duration"
        />
      </div>
    </section>
  );
}
