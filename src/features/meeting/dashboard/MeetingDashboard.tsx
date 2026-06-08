import { useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Col,
  Container,
  Footer,
  Heading,
  Loader,
  Paragraph,
  Row,
  TimeCountdown,
  useDialog,
} from '../../../common/components';
import { paths, useNavigation } from '../../../common/services/router';
import { BurndownChart, GoalsDecisionCollector } from '../components';
import { useMeetingStore } from '../store';
import { DashboardSideTopics } from './DashboardSideTopics';
import styles from './MeetingDashboard.module.css';

export function MeetingDashboard() {
  const navigation = useNavigation();
  const dialog = useDialog();
  const loading = useMeetingStore((state) => state.loading);
  const meeting = useMeetingStore((state) => state.currentMeeting);
  const automatic = useMeetingStore((state) => state.decisionsAutomaticBehavior);
  const startMeeting = useMeetingStore((state) => state.startMeeting);
  const cancelMeeting = useMeetingStore((state) => state.cancelMeeting);
  const finishMeeting = useMeetingStore((state) => state.finishMeeting);
  const updateGoal = useMeetingStore((state) => state.updateGoal);
  const setSideTopics = useMeetingStore((state) => state.setSideTopics);
  const setAutomatic = useMeetingStore((state) => state.setAutomatic);

  const guarded = useRef(false);

  const active = !!meeting?.realStartTime;

  useEffect(() => {
    if (loading || guarded.current) {
      return;
    }
    guarded.current = true;
    void (async () => {
      if (!meeting?.name) {
        await dialog.alert('Set up your event before opening the dashboard.');
        navigation.replace(paths.newMeeting);
      } else if (meeting.realEndTime) {
        await dialog.alert('This event is already completed.');
        navigation.replace(paths.report);
      } else if (!meeting.realStartTime) {
        const ready = await dialog.confirm({
          text: 'Are you ready to start?',
          confirmButtonTheme: 'success',
          confirmButtonText: "Yes, let's go!",
          cancelButtonText: 'Not yet',
          disableCloseButton: true,
        });
        if (ready) {
          await startMeeting();
        } else {
          navigation.replace(paths.newMeeting);
        }
      }
    })();
  }, [loading, meeting, dialog, navigation, startMeeting]);

  if (loading || !meeting) {
    return (
      <div className={styles.loading}>
        <Loader />
      </div>
    );
  }

  const onCancel = async () => {
    const confirmed = await dialog.confirm({
      text: 'Are you sure you want to cancel it?',
      confirmButtonTheme: 'danger',
      confirmButtonText: 'Yes, do it',
      cancelButtonText: 'Not anymore',
    });
    if (confirmed) {
      await cancelMeeting();
      navigation.go(paths.newMeeting);
    }
  };

  const onFinish = async () => {
    await finishMeeting();
    navigation.go(paths.report);
  };

  const onAllCompleted = async () => {
    const confirmed = await dialog.confirm({
      text: 'All done! ✅ Do you want to finish this event?',
      confirmButtonTheme: 'success',
      confirmButtonText: 'Yes, finish it!',
      cancelButtonText: 'Not yet',
      closeOnOverlayClick: true,
    });
    if (confirmed) {
      await onFinish();
    }
  };

  const burndownItems = meeting.goals.map((goal) => ({
    id: goal.id,
    title: goal.name,
    weight: goal.weight,
    finishedAt: goal.finishedAt || null,
  }));

  return (
    <Container fullWidth className={styles.dashboard}>
      <header className={styles.head}>
        <Heading size="md" level={1}>
          {meeting.name}
        </Heading>
        {meeting.description && <Paragraph text={meeting.description} />}
      </header>

      <Row>
        <Col grow={1}>
          <Box className={styles.block}>
            <TimeCountdown
              timeFrom={meeting.expectedStartTime}
              timeTarget={meeting.expectedEndTime}
              disabled={!active}
            />
          </Box>
          <Box className={styles.block}>
            <BurndownChart
              startTime={meeting.expectedStartTime}
              endTime={meeting.expectedEndTime}
              items={burndownItems}
              showProjection={active}
            />
          </Box>
        </Col>
        <Col grow={1}>
          <GoalsDecisionCollector
            goals={meeting.goals}
            disabled={!active}
            automatic={automatic}
            onToggleAutomatic={(value) => void setAutomatic(value)}
            onChangeGoal={(goalId, patch) => void updateGoal(goalId, patch)}
            onAllCompleted={() => void onAllCompleted()}
          />
          <DashboardSideTopics
            items={meeting.sideTopics}
            onChange={(items) => void setSideTopics(items)}
          />
        </Col>
      </Row>

      <Footer justifyContent="space-between">
        {active ? (
          <Button theme="secondary" outline onClick={() => void onCancel()}>
            Cancel event
          </Button>
        ) : (
          <Button
            theme="secondary"
            outline
            onClick={() => navigation.go(paths.newMeeting)}
          >
            Go back
          </Button>
        )}
        <Button theme="success" disabled={!active} onClick={() => void onFinish()}>
          Finish event
        </Button>
      </Footer>
    </Container>
  );
}
