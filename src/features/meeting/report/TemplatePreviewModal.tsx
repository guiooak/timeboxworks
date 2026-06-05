import { useState } from 'react';
import { Button, Modal } from '../../../common/components';
import { formatLong, formatTime } from '../../../common/services/datetime';
import type { Meeting } from '../domain/types';
import styles from './MeetingReport.module.css';

export type TemplatePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  meeting: Meeting;
  chartImageSrc: string | null;
};

function buildReportText(meeting: Meeting): string {
  const lines: string[] = [meeting.name, ''];
  if (meeting.description) {
    lines.push(meeting.description, '');
  }
  lines.push('Goals:');
  for (const goal of meeting.goals) {
    const done = goal.finishedAt
      ? ` — done at ${formatTime(goal.finishedAt)}`
      : ' — not done';
    lines.push(`• ${goal.name} (weight ${goal.weight})${done}`);
    if (goal.decisions) {
      lines.push(`    ${goal.decisions}`);
    }
  }
  const topics = meeting.sideTopics.filter((topic) => topic.value.trim());
  if (topics.length) {
    lines.push('', 'Side topics:');
    topics.forEach((topic) => lines.push(`• ${topic.value}`));
  }
  lines.push('', `Happened ${formatLong(meeting.realStartTime)}.`);
  return lines.join('\n');
}

export function TemplatePreviewModal({
  open,
  onClose,
  meeting,
  chartImageSrc,
}: TemplatePreviewModalProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText(meeting));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report preview"
      width={640}
      closeOnOverlayClick
      footer={
        <>
          <Button theme="secondary" outline onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => void onCopy()}>
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </Button>
        </>
      }
    >
      <div className={styles.preview}>
        <h4>{meeting.name}</h4>
        {chartImageSrc && (
          <img className={styles.previewChart} src={chartImageSrc} alt="Burndown chart" />
        )}
        <pre className={styles.previewText}>{buildReportText(meeting)}</pre>
      </div>
    </Modal>
  );
}
