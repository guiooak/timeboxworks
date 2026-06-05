import { useMemo } from 'react';
import { Box, Button, Container, Heading, Page } from '../../../common/components';
import { formatLong, toTimestamp } from '../../../common/services/datetime';
import { useNavigation } from '../../../common/services/router';
import { useMeetingStore } from '../store';
import styles from './MeetingsHistory.module.css';

export function MeetingsHistory() {
  const navigation = useNavigation();
  const meetings = useMeetingStore((state) => state.meetings);
  const reopen = useMeetingStore((state) => state.reopen);
  const clone = useMeetingStore((state) => state.clone);

  const finished = useMemo(
    () =>
      meetings
        .filter((meeting) => meeting.status === 'finished' && meeting.realEndTime)
        .sort((a, b) => toTimestamp(b.realEndTime) - toTimestamp(a.realEndTime)),
    [meetings],
  );

  const onReopen = async (id: string) => {
    await reopen(id);
    navigation.go('/meeting/report');
  };

  const onClone = async (id: string) => {
    const newId = await clone(id);
    if (newId) {
      navigation.go('/meeting/form');
    }
  };

  return (
    <Container className={styles.history}>
      <Page>
        <header className={styles.head}>
          <Heading size="md" level={1}>
            My meetings
          </Heading>
        </header>

        {finished.length === 0 ? (
          <p className={styles.blankSlate}>
            No finished events yet. Run one and it will show up here.
          </p>
        ) : (
          <div className={styles.list}>
            {finished.map((meeting) => (
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
                    Reopen
                  </Button>
                  <Button size="sm" onClick={() => void onClone(meeting.id)}>
                    Clone
                  </Button>
                </div>
              </Box>
            ))}
          </div>
        )}
      </Page>
    </Container>
  );
}
