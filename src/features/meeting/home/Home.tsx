import {
  Box,
  Button,
  Container,
  Heading,
  Page,
  Paragraph,
} from '../../../common/components';
import { formatDuration, formatLong } from '../../../common/services/datetime';
import { paths, useNavigation } from '../../../common/services/router';
import { useMeetingStore } from '../store';
import { useMeetingMetrics } from './useMeetingMetrics';
import styles from './Home.module.css';

function budgetLabel(ratio: number | null): { value: string; note: string } {
  if (ratio == null) {
    return { value: '—', note: 'No finished events yet' };
  }
  const pct = Math.round((ratio - 1) * 100);
  if (pct === 0) {
    return { value: 'On budget', note: 'Right on the clock' };
  }
  return pct > 0
    ? { value: `${pct}% over`, note: 'Ran longer than planned' }
    : { value: `${Math.abs(pct)}% under`, note: 'Beat the clock' };
}

export function Home() {
  const navigation = useNavigation();
  const current = useMeetingStore((state) => state.currentMeeting);
  const reopen = useMeetingStore((state) => state.reopen);
  const clone = useMeetingStore((state) => state.clone);
  const metrics = useMeetingMetrics();

  const onReopen = async (id: string) => {
    await reopen(id);
    navigation.go(paths.report);
  };

  const onClone = async (id: string) => {
    const newId = await clone(id);
    if (newId) {
      navigation.go(paths.newMeeting);
    }
  };

  // Surface whatever the user can pick up where they left off.
  const resume = current?.realEndTime
    ? {
        label: 'View last report',
        to: paths.report,
        hint: 'Your most recent event is wrapped up.',
      }
    : current?.realStartTime
      ? {
          label: 'Resume live event',
          to: paths.liveMeeting,
          hint: 'You have an event in progress.',
        }
      : current
        ? {
            label: 'Continue planning',
            to: paths.newMeeting,
            hint: 'You have a draft in the works.',
          }
        : null;

  const budget = budgetLabel(metrics.budgetRatio);

  return (
    <Container className={styles.home}>
      <Page>
        <header className={styles.head}>
          <Heading size="md" level={1}>
            Overview
          </Heading>
          <Button onClick={() => navigation.go(paths.newMeeting)}>+ New event</Button>
        </header>

        {resume && (
          <Box className={styles.resume}>
            <div>
              <strong>{current?.name || 'Untitled event'}</strong>
              <div className={styles.meta}>{resume.hint}</div>
            </div>
            <Button theme="success" onClick={() => navigation.go(resume.to)}>
              {resume.label}
            </Button>
          </Box>
        )}

        {metrics.total === 0 ? (
          <Box className={styles.blankSlate}>
            <Paragraph>
              No events yet. Plan your first one and it’ll come to life here.
            </Paragraph>
            <Button onClick={() => navigation.go(paths.newMeeting)}>Plan an event</Button>
          </Box>
        ) : (
          <>
            <div className={styles.metrics}>
              <Box className={styles.metric}>
                <span className={styles.metricValue}>{budget.value}</span>
                <span className={styles.metricLabel}>Time vs budget</span>
                <span className={styles.metricNote}>{budget.note}</span>
              </Box>
              <Box className={styles.metric}>
                <span className={styles.metricValue}>
                  {metrics.goalCompletion == null
                    ? '—'
                    : `${Math.round(metrics.goalCompletion * 100)}%`}
                </span>
                <span className={styles.metricLabel}>Goals completed</span>
                <span className={styles.metricNote}>Weighted across finished events</span>
              </Box>
              <Box className={styles.metric}>
                <span className={styles.metricValue}>{metrics.thisMonth}</span>
                <span className={styles.metricLabel}>This month</span>
                <span className={styles.metricNote}>
                  {metrics.finished} finished all-time
                </span>
              </Box>
              <Box className={styles.metric}>
                <span className={styles.metricValue}>
                  {metrics.totalSpentMs > 0 ? formatDuration(metrics.totalSpentMs) : '—'}
                </span>
                <span className={styles.metricLabel}>Total time</span>
                <span className={styles.metricNote}>Spent in finished events</span>
              </Box>
            </div>

            <section className={styles.recentSection}>
              <Heading size="sm" level={2}>
                Recent events
              </Heading>
              {metrics.recent.length === 0 ? (
                <p className={styles.meta}>Finish an event to see it here.</p>
              ) : (
                <div className={styles.list}>
                  {metrics.recent.map((meeting) => (
                    <Box key={meeting.id} className={styles.item}>
                      <div>
                        <strong>{meeting.name}</strong>
                        <div className={styles.meta}>
                          {formatLong(meeting.realEndTime)} · {meeting.goals.length} goals
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <Button
                          theme="secondary"
                          outline
                          size="sm"
                          onClick={() => void onReopen(meeting.id)}
                        >
                          View report
                        </Button>
                        <Button size="sm" onClick={() => void onClone(meeting.id)}>
                          Clone
                        </Button>
                      </div>
                    </Box>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </Page>
    </Container>
  );
}
