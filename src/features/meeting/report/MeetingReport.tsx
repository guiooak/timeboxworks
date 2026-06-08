import { useEffect, useRef, useState } from 'react';
import {
  Article,
  Box,
  Button,
  Container,
  Footer,
  Heading,
  Loader,
  Page,
  useDialog,
} from '../../../common/components';
import { svgElementToPngDataUrl } from '../../../common/services/chart';
import { formatLong, formatTime, isSameDay } from '../../../common/services/datetime';
import { paths, useNavigation } from '../../../common/services/router';
import { BurndownChart } from '../components';
import { useMeetingStore } from '../store';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { TimeCardsGrid } from './TimeCardsGrid';
import styles from './MeetingReport.module.css';

export function MeetingReport() {
  const navigation = useNavigation();
  const dialog = useDialog();
  const loading = useMeetingStore((state) => state.loading);
  const meeting = useMeetingStore((state) => state.currentMeeting);
  const backToDashboard = useMeetingStore((state) => state.backToDashboard);
  const discardCurrent = useMeetingStore((state) => state.discardCurrent);

  const chartRef = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [chartImage, setChartImage] = useState<string | null>(null);
  const guarded = useRef(false);

  useEffect(() => {
    if (loading || guarded.current) {
      return;
    }
    guarded.current = true;
    void (async () => {
      if (!meeting?.name) {
        await dialog.alert('There is no event to report yet.');
        navigation.replace(paths.newMeeting);
      } else if (!meeting.realEndTime) {
        await dialog.alert('Finish your event to see its report.');
        navigation.replace(paths.liveMeeting);
      }
    })();
  }, [loading, meeting, dialog, navigation]);

  if (loading || !meeting?.realEndTime) {
    return (
      <div className={styles.loading}>
        <Loader />
      </div>
    );
  }

  const sameDay = isSameDay(meeting.realStartTime, meeting.realEndTime);
  const burndownItems = meeting.goals.map((goal) => ({
    id: goal.id,
    title: goal.name,
    weight: goal.weight,
    finishedAt: goal.finishedAt || null,
  }));
  const sideTopics = meeting.sideTopics.filter((topic) => topic.value.trim());

  const onCopyReport = async () => {
    const svg = chartRef.current?.querySelector('svg');
    setChartImage(svg ? await svgElementToPngDataUrl(svg as SVGSVGElement) : null);
    setPreviewOpen(true);
  };

  const onBackToDashboard = async () => {
    await backToDashboard();
    navigation.go(paths.liveMeeting);
  };

  const onStartNew = async () => {
    const confirmed = await dialog.confirm({
      text: 'This will close this report. Start a new event?',
      confirmButtonText: 'Yes, do it',
      cancelButtonText: 'Not anymore',
    });
    if (confirmed) {
      await discardCurrent();
      navigation.go(paths.newMeeting);
    }
  };

  return (
    <Container className={styles.report}>
      <Page>
        <header>
          <Heading size="lg" level={1} title={meeting.name} />
          {sameDay ? (
            <Heading size="xxs" level={2}>
              ⏱ Happened on {formatLong(meeting.realStartTime)} until{' '}
              {formatTime(meeting.realEndTime)}
            </Heading>
          ) : (
            <>
              <Heading size="xxs" level={2}>
                ⏱ Started {formatLong(meeting.realStartTime)}
              </Heading>
              <Heading size="xxs" level={2}>
                ⏱ Finished {formatLong(meeting.realEndTime)}
              </Heading>
            </>
          )}
          {meeting.description && <Article text={meeting.description} />}
        </header>

        <section className={styles.section}>
          <Heading size="sm" level={2}>
            Goals
          </Heading>
          <div className={styles.goals}>
            {meeting.goals.map((goal) => (
              <Box key={goal.id} className={styles.goal}>
                <div className={styles.goalHead}>
                  <strong>{goal.name}</strong>
                  <span className={styles.goalMeta}>
                    {goal.finishedAt
                      ? `done at ${formatTime(goal.finishedAt)}`
                      : 'not done'}{' '}
                    · weight {goal.weight}
                  </span>
                </div>
                {goal.decisions && <p className={styles.decisions}>{goal.decisions}</p>}
              </Box>
            ))}
          </div>
        </section>

        {sideTopics.length > 0 && (
          <section className={styles.section}>
            <Heading size="sm" level={2}>
              Side topics
            </Heading>
            <ul className={styles.topics}>
              {sideTopics.map((topic) => (
                <li key={topic.id}>{topic.value}</li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.section}>
          <Heading size="sm" level={2}>
            Performance
          </Heading>
          <BurndownChart
            ref={chartRef}
            startTime={meeting.expectedStartTime}
            endTime={meeting.expectedEndTime}
            items={burndownItems}
          />
        </section>

        <section className={styles.section}>
          <TimeCardsGrid
            expectedStartTime={meeting.expectedStartTime}
            expectedEndTime={meeting.expectedEndTime}
            realStartTime={meeting.realStartTime}
            realEndTime={meeting.realEndTime}
          />
        </section>

        <Footer justifyContent="space-between">
          <Button theme="secondary" outline onClick={() => void onBackToDashboard()}>
            Back to dashboard
          </Button>
          <div className={styles.actions}>
            <Button theme="info" outline onClick={() => void onCopyReport()}>
              Copy report
            </Button>
            <Button onClick={() => void onStartNew()}>Start new event</Button>
          </div>
        </Footer>
      </Page>

      <TemplatePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        meeting={meeting}
        chartImageSrc={chartImage}
      />
    </Container>
  );
}
