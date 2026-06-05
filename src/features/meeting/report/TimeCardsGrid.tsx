import { Card, Heading } from '../../../common/components';
import { diffMs, formatDuration, formatTime } from '../../../common/services/datetime';
import { getTimeDisplayFeedbackByDiff } from '../domain/timeDisplayFeedbackRules';
import styles from './MeetingReport.module.css';

export type TimeCardsGridProps = {
  expectedStartTime: string;
  expectedEndTime: string;
  realStartTime: string;
  realEndTime: string;
};

function TimeCard({
  label,
  expected,
  real,
}: {
  label: string;
  expected: string;
  real: string;
}) {
  // Negative (expected - real) means the real time happened later → late.
  const feedback = getTimeDisplayFeedbackByDiff(diffMs(expected, real));
  const magnitude = formatDuration(Math.abs(diffMs(expected, real)));
  return (
    <Card theme={feedback.theme} className={styles.timeCard}>
      <div className={styles.timeCardLabel}>{label}</div>
      <div className={styles.timeCardTimes}>
        <span>Planned {formatTime(expected)}</span>
        <span>Actual {formatTime(real)}</span>
      </div>
      <div className={styles.timeCardFeedback}>
        {feedback.momentMessage} {magnitude}
      </div>
    </Card>
  );
}

export function TimeCardsGrid({
  expectedStartTime,
  expectedEndTime,
  realStartTime,
  realEndTime,
}: TimeCardsGridProps) {
  return (
    <section>
      <Heading size="sm" level={2}>
        Timing
      </Heading>
      <div className={styles.timeGrid}>
        <TimeCard label="Start" expected={expectedStartTime} real={realStartTime} />
        <TimeCard label="End" expected={expectedEndTime} real={realEndTime} />
      </div>
    </section>
  );
}
