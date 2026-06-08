import { useEffect, useRef, useState } from 'react';
import {
  Container,
  Footer,
  Form,
  FormField,
  FormDatetimePicker,
  FormInput,
  FormInputsList,
  FormResetButton,
  FormSubmitButton,
  FormTextarea,
  Heading,
  Page,
  Paragraph,
  newInputsListItem,
  type InputsListItem,
} from '../../../common/components';
import { addHours, nowISO, toISO, toTimestamp } from '../../../common/services/datetime';
import { paths, useNavigation } from '../../../common/services/router';
import { useMeetingStore } from '../store';
import styles from './MeetingForm.module.css';

export function MeetingForm() {
  const navigation = useNavigation();
  const currentMeeting = useMeetingStore((state) => state.currentMeeting);
  const saveFromForm = useMeetingStore((state) => state.saveFromForm);
  const discardCurrent = useMeetingStore((state) => state.discardCurrent);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState(() => nowISO());
  const [end, setEnd] = useState(() => toISO(addHours(new Date(), 1)));
  const [goals, setGoals] = useState<InputsListItem[]>([newInputsListItem()]);
  const [submitted, setSubmitted] = useState(false);
  const prefilled = useRef(false);

  // A finished meeting is over: clear the pointer so the form starts fresh.
  // A still-running meeting takes over the live view instead.
  useEffect(() => {
    if (currentMeeting?.realEndTime) {
      void discardCurrent();
    } else if (currentMeeting?.realStartTime) {
      navigation.replace(paths.liveMeeting);
    }
  }, [currentMeeting, navigation, discardCurrent]);

  // Rehydrate the form from a saved draft once it loads.
  useEffect(() => {
    // Only an unstarted draft should rehydrate the form (not a finished meeting
    // that's about to be cleared).
    if (prefilled.current || currentMeeting?.status !== 'draft') {
      return;
    }
    prefilled.current = true;
    setName(currentMeeting.name);
    setDescription(currentMeeting.description);
    setStart(currentMeeting.expectedStartTime || nowISO());
    setEnd(currentMeeting.expectedEndTime || toISO(addHours(new Date(), 1)));
    setGoals(
      currentMeeting.goals.length
        ? currentMeeting.goals.map((goal) => ({
            id: goal.id,
            name: goal.name,
            weight: goal.weight === 1 ? '' : String(goal.weight),
          }))
        : [newInputsListItem()],
    );
  }, [currentMeeting]);

  const filledGoals = goals.filter((goal) => goal.name.trim());
  const nameError = submitted && !name.trim() ? 'Event name is required' : null;
  const timeError =
    submitted && start && end && toTimestamp(start) >= toTimestamp(end)
      ? 'Start time should be before End time'
      : null;

  const someWeight = filledGoals.some((goal) => goal.weight);
  const totalWeight = someWeight
    ? filledGoals.reduce((acc, goal) => acc + (Number(goal.weight) || 1), 0)
    : 0;

  const onSubmit = async () => {
    setSubmitted(true);
    const validName = !!name.trim();
    const validTime = !!start && !!end && toTimestamp(start) < toTimestamp(end);
    if (!validName || !validTime || filledGoals.length === 0) {
      return;
    }
    await saveFromForm({
      name: name.trim(),
      description,
      expectedStartTime: start,
      expectedEndTime: end,
      goals: filledGoals.map((goal) => ({
        id: goal.id,
        name: goal.name.trim(),
        weight: Number(goal.weight) || 1,
      })),
    });
    navigation.go(paths.liveMeeting);
  };

  const onReset = async () => {
    await discardCurrent();
    setName('');
    setDescription('');
    setStart(nowISO());
    setEnd(toISO(addHours(new Date(), 1)));
    setGoals([newInputsListItem()]);
    setSubmitted(false);
  };

  return (
    <Container>
      <Page>
        <Form onSubmit={() => void onSubmit()} onReset={() => void onReset()}>
          <Heading size="md" level={1}>
            Event Setup
          </Heading>

          <FormField label="Event name">
            <FormInput
              name="name"
              value={name}
              onChange={setName}
              placeholder="Weekly planning"
            />
            {nameError && <span className={styles.error}>{nameError}</span>}
          </FormField>

          <div className={styles.times}>
            <FormField label="Start time">
              <FormDatetimePicker value={start} onChange={setStart} error={timeError} />
            </FormField>
            <FormField label="End time">
              <FormDatetimePicker value={end} onChange={setEnd} error={timeError} />
            </FormField>
          </div>

          <FormInputsList
            label="Goals"
            value={goals}
            onChange={setGoals}
            placeholder="Goal"
            required
            showErrors={submitted}
          />

          <FormField label="Description">
            <FormTextarea
              name="description"
              value={description}
              onChange={setDescription}
              placeholder="Optional context for this event"
            />
          </FormField>

          <Footer justifyContent="space-between">
            <div>{someWeight && <Paragraph>Total weight: {totalWeight}</Paragraph>}</div>
            <div className={styles.actions}>
              <FormResetButton>Clean form</FormResetButton>
              <FormSubmitButton>Open dashboard</FormSubmitButton>
            </div>
          </Footer>
        </Form>
      </Page>
    </Container>
  );
}
