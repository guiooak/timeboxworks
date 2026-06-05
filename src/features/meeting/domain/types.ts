import { uid } from '../../../common/services/uid';

export type Goal = {
  id: string;
  name: string;
  weight: number;
  finishedAt: string;
  decisions: string;
};

export type SideTopic = {
  id: string;
  value: string;
};

export type MeetingStatus = 'draft' | 'active' | 'finished';

export type Meeting = {
  id: string;
  name: string;
  description: string;
  expectedStartTime: string;
  expectedEndTime: string;
  realStartTime: string;
  realEndTime: string;
  goals: Goal[];
  sideTopics: SideTopic[];
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
};

export function createGoal(name: string, weight = 1): Goal {
  return { id: uid(), name, weight, finishedAt: '', decisions: '' };
}

export function createSideTopic(): SideTopic {
  return { id: uid(), value: '' };
}

export function isMeetingActive(meeting: Meeting): boolean {
  return !!meeting.realStartTime;
}

export function isMeetingFinished(meeting: Meeting): boolean {
  return !!meeting.realEndTime;
}
