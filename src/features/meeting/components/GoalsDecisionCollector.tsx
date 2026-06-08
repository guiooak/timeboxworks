import { useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  FormField,
  FormTextarea,
  Label,
  Switch,
} from '../../../common/components';
import { nowISO } from '../../../common/services/datetime';
import type { Goal } from '../domain/types';
import styles from './GoalsDecisionCollector.module.css';

const GOAL_TITLE_MAX_LENGTH = 50;

export type GoalsDecisionCollectorProps = {
  goals: Goal[];
  disabled?: boolean;
  automatic: boolean;
  onToggleAutomatic: (value: boolean) => void;
  onChangeGoal: (goalId: string, patch: Partial<Goal>) => void;
  onAllCompleted: () => void;
};

function truncate(name: string): string {
  return name.length > GOAL_TITLE_MAX_LENGTH
    ? `${name.slice(0, GOAL_TITLE_MAX_LENGTH)}…`
    : name;
}

export function GoalsDecisionCollector({
  goals,
  disabled,
  automatic,
  onToggleAutomatic,
  onChangeGoal,
  onAllCompleted,
}: GoalsDecisionCollectorProps) {
  const [openId, setOpenId] = useState<string | null>(
    () => goals.find((g) => !g.finishedAt)?.id ?? null,
  );
  const [allOpen, setAllOpen] = useState(false);
  const showWeight = goals.some((goal) => goal.weight !== 1);

  const isOpen = (goalId: string) => allOpen || openId === goalId;

  const onCheck = (goal: Goal, checked: boolean) => {
    onChangeGoal(goal.id, { finishedAt: checked ? nowISO() : '' });
    const updated = goals.map((item) =>
      item.id === goal.id ? { ...item, finishedAt: checked ? nowISO() : '' } : item,
    );
    if (checked && automatic) {
      setOpenId(updated.find((item) => !item.finishedAt)?.id ?? null);
    } else if (!checked) {
      setOpenId(goal.id);
    }
    if (updated.every((item) => item.finishedAt)) {
      onAllCompleted();
    }
  };

  return (
    <Box className={styles.collector}>
      <div className={styles.toolbar}>
        <div className={styles.automatic}>
          <Switch
            checked={automatic}
            onChange={onToggleAutomatic}
            label="Automatic mode"
          />
          <Label text="Automatic" />
        </div>
        <Button
          size="sm"
          theme="secondary"
          outline
          onClick={() => setAllOpen((value) => !value)}
        >
          {allOpen ? 'Close all' : 'Open all'}
        </Button>
      </div>

      <div className={styles.list}>
        {goals.map((goal) => (
          <Collapse
            key={goal.id}
            title={truncate(goal.name)}
            open={isOpen(goal.id)}
            onToggleOpen={(next) => setOpenId(next ? goal.id : null)}
            checkbox={{
              label: 'Done',
              checked: !!goal.finishedAt,
              disabled,
              onChange: (checked) => onCheck(goal, checked),
            }}
          >
            {goal.name.length > GOAL_TITLE_MAX_LENGTH && (
              <p className={styles.fullName}>
                <strong>Goal:</strong> {goal.name}
              </p>
            )}
            <FormField label="Notes">
              <FormTextarea
                name={`decisions-${goal.id}`}
                value={goal.decisions}
                onChange={(value) => onChangeGoal(goal.id, { decisions: value })}
                readOnly={disabled}
                minHeight={70}
              />
            </FormField>
            {showWeight && <small className={styles.weight}>Weight: {goal.weight}</small>}
          </Collapse>
        ))}
      </div>
    </Box>
  );
}
