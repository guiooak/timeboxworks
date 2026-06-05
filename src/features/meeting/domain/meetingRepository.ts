import {
  newKey,
  removeAt,
  subscribe,
  updateAt,
  write,
} from '../../../common/services/database';
import { nowISO } from '../../../common/services/datetime';
import type { Goal, Meeting, SideTopic } from './types';

const userPath = (uid: string) => `users/${uid}`;
const settingsPath = (uid: string) => `users/${uid}/settings`;
const meetingsPath = (uid: string) => `users/${uid}/meetings`;
const meetingPath = (uid: string, id: string) => `users/${uid}/meetings/${id}`;

export type UserMeetingData = {
  currentMeetingId: string | null;
  meetings: Meeting[];
  decisionsAutomaticBehavior: boolean;
};

type RawUserNode = {
  currentMeetingId?: string | null;
  settings?: { decisionsAutomaticBehavior?: boolean };
  meetings?: Record<string, Partial<Meeting>> | Array<Partial<Meeting> | null>;
};

function toArray<T>(value: Record<string, T> | Array<T | null> | undefined | null): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value)
    ? value.filter((item): item is T => item != null)
    : Object.values(value);
}

function normalizeGoal(goal: Partial<Goal>): Goal {
  return {
    id: goal.id ?? '',
    name: goal.name ?? '',
    weight: Number(goal.weight) || 1,
    finishedAt: goal.finishedAt ?? '',
    decisions: goal.decisions ?? '',
  };
}

function normalizeMeeting(raw: Partial<Meeting>): Meeting {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    expectedStartTime: raw.expectedStartTime ?? '',
    expectedEndTime: raw.expectedEndTime ?? '',
    realStartTime: raw.realStartTime ?? '',
    realEndTime: raw.realEndTime ?? '',
    goals: toArray<Partial<Goal>>(raw.goals).map(normalizeGoal),
    sideTopics: toArray<SideTopic>(raw.sideTopics),
    status: raw.status ?? 'draft',
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? '',
  };
}

export function subscribeUserData(
  uid: string,
  callback: (data: UserMeetingData) => void,
): () => void {
  return subscribe<RawUserNode>(userPath(uid), (node) => {
    callback({
      currentMeetingId: node?.currentMeetingId ?? null,
      decisionsAutomaticBehavior: node?.settings?.decisionsAutomaticBehavior ?? true,
      meetings: toArray<Partial<Meeting>>(node?.meetings).map(normalizeMeeting),
    });
  });
}

export function newMeetingId(uid: string): string {
  return newKey(meetingsPath(uid));
}

export async function saveMeeting(uid: string, meeting: Meeting): Promise<void> {
  await write(meetingPath(uid, meeting.id), { ...meeting, updatedAt: nowISO() });
}

export async function patchMeeting(
  uid: string,
  id: string,
  patch: Partial<Meeting>,
): Promise<void> {
  await updateAt(meetingPath(uid, id), { ...patch, updatedAt: nowISO() });
}

export async function removeMeeting(uid: string, id: string): Promise<void> {
  await removeAt(meetingPath(uid, id));
}

export async function setCurrentMeetingId(uid: string, id: string | null): Promise<void> {
  await updateAt(userPath(uid), { currentMeetingId: id });
}

export async function setAutomaticBehavior(uid: string, value: boolean): Promise<void> {
  await updateAt(settingsPath(uid), { decisionsAutomaticBehavior: value });
}
