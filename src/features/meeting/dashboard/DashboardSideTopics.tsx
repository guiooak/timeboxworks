import { Box, Button, PostIt, useDialog } from '../../../common/components';
import { createSideTopic, type SideTopic } from '../domain/types';
import styles from './MeetingDashboard.module.css';

export type DashboardSideTopicsProps = {
  items: SideTopic[];
  onChange: (items: SideTopic[]) => void;
};

export function DashboardSideTopics({ items, onChange }: DashboardSideTopicsProps) {
  const dialog = useDialog();

  const add = () => onChange([...items, createSideTopic()]);
  const update = (id: string, value: string) =>
    onChange(items.map((item) => (item.id === id ? { ...item, value } : item)));
  const removeById = (id: string) => onChange(items.filter((item) => item.id !== id));

  const onBlur = (item: SideTopic) => {
    if (!item.value.trim()) {
      removeById(item.id);
    }
  };

  const onDelete = async (item: SideTopic) => {
    if (!item.value.trim()) {
      removeById(item.id);
      return;
    }
    const confirmed = await dialog.confirm({
      text: 'Are you sure you want to remove it?',
      confirmButtonTheme: 'danger',
      confirmButtonText: 'Yes, do it',
      cancelButtonText: 'Not anymore',
    });
    if (confirmed) {
      removeById(item.id);
    }
  };

  return (
    <Box className={styles.parkingLot}>
      <div className={styles.parkingHead}>
        <strong>Parking lot</strong>
        <Button size="sm" onClick={add}>
          + Add side topic
        </Button>
      </div>
      {items.length === 0 ? (
        <p className={styles.blankSlate}>Have a side topic? Park it here. :)</p>
      ) : (
        <div className={styles.notes}>
          {items.map((item, index) => (
            <PostIt
              key={item.id}
              prefix={`${index + 1}.`}
              value={item.value}
              onChange={(value) => update(item.id, value)}
              onBlur={() => onBlur(item)}
              onDelete={() => void onDelete(item)}
            />
          ))}
        </div>
      )}
    </Box>
  );
}
