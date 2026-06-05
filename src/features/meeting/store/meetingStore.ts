import { addHours, diffMs, nowISO, toISO } from '../../../common/services/datetime';
import { createStore } from '../../../common/services/state';
import { uid as makeId } from '../../../common/services/uid';
import * as repo from '../domain/meetingRepository';
import type { Goal, Meeting, SideTopic } from '../domain/types';

export type MeetingFormInput = {
  name: string;
  description: string;
  expectedStartTime: string;
  expectedEndTime: string;
  goals: Array<{ id: string; name: string; weight: number }>;
};

export type MeetingState = {
  uid: string | null;
  loading: boolean;
  currentMeeting: Meeting | null;
  meetings: Meeting[];
  decisionsAutomaticBehavior: boolean;

  bind: (uid: string) => () => void;

  saveFromForm: (input: MeetingFormInput) => Promise<void>;
  discardCurrent: () => Promise<void>;
  startMeeting: () => Promise<void>;
  cancelMeeting: () => Promise<void>;
  finishMeeting: () => Promise<void>;
  backToDashboard: () => Promise<void>;
  updateGoals: (goals: Goal[]) => Promise<void>;
  updateGoal: (goalId: string, patch: Partial<Goal>) => Promise<void>;
  setSideTopics: (sideTopics: SideTopic[]) => Promise<void>;
  setAutomatic: (value: boolean) => Promise<void>;
  reopen: (id: string) => Promise<void>;
  clone: (id: string) => Promise<string | null>;
};

export const useMeetingStore = createStore<MeetingState>()((set, get) => {
  const requireUid = (): string => {
    const { uid } = get();
    if (!uid) {
      throw new Error('Meeting store is not bound to a user');
    }
    return uid;
  };

  return {
    uid: null,
    loading: true,
    currentMeeting: null,
    meetings: [],
    decisionsAutomaticBehavior: true,

    bind: (uid) => {
      set({ uid, loading: true });
      const unsubscribe = repo.subscribeUserData(uid, (data) => {
        const current =
          data.meetings.find((meeting) => meeting.id === data.currentMeetingId) ?? null;
        set({
          loading: false,
          currentMeeting: current,
          meetings: data.meetings,
          decisionsAutomaticBehavior: data.decisionsAutomaticBehavior,
        });
      });
      return () => {
        unsubscribe();
        set({ uid: null, currentMeeting: null, meetings: [], loading: true });
      };
    },

    saveFromForm: async (input) => {
      const uid = requireUid();
      const existing = get().currentMeeting;
      const reuse = existing && existing.status === 'draft' ? existing : null;
      const id = reuse?.id ?? repo.newMeetingId(uid);

      const goals: Goal[] = input.goals.map((goal) => {
        const previous = reuse?.goals.find((item) => item.id === goal.id);
        return {
          id: goal.id,
          name: goal.name,
          weight: goal.weight,
          finishedAt: previous?.finishedAt ?? '',
          decisions: previous?.decisions ?? '',
        };
      });

      const meeting: Meeting = {
        id,
        name: input.name,
        description: input.description,
        expectedStartTime: input.expectedStartTime,
        expectedEndTime: input.expectedEndTime,
        realStartTime: reuse?.realStartTime ?? '',
        realEndTime: '',
        goals,
        sideTopics: reuse?.sideTopics ?? [],
        status: 'draft',
        createdAt: reuse?.createdAt ?? nowISO(),
        updatedAt: nowISO(),
      };

      await repo.saveMeeting(uid, meeting);
      await repo.setCurrentMeetingId(uid, id);
    },

    discardCurrent: async () => {
      const uid = requireUid();
      const current = get().currentMeeting;
      if (current && current.status === 'draft') {
        await repo.removeMeeting(uid, current.id);
      }
      await repo.setCurrentMeetingId(uid, null);
    },

    startMeeting: async () => {
      const uid = requireUid();
      const current = get().currentMeeting;
      if (!current) {
        return;
      }
      await repo.patchMeeting(uid, current.id, {
        realStartTime: nowISO(),
        status: 'active',
      });
    },

    cancelMeeting: async () => {
      const uid = requireUid();
      const current = get().currentMeeting;
      if (!current) {
        return;
      }
      await repo.patchMeeting(uid, current.id, { realStartTime: '', status: 'draft' });
    },

    finishMeeting: async () => {
      const uid = requireUid();
      const current = get().currentMeeting;
      if (!current) {
        return;
      }
      // Keep it as the current meeting so the report can render it; it stays in
      // `meetings` as history. `discardCurrent` (Start new) clears the pointer.
      await repo.patchMeeting(uid, current.id, {
        realEndTime: nowISO(),
        status: 'finished',
      });
    },

    backToDashboard: async () => {
      const uid = requireUid();
      const current = get().currentMeeting;
      if (!current) {
        return;
      }
      await repo.patchMeeting(uid, current.id, { realEndTime: '', status: 'active' });
      await repo.setCurrentMeetingId(uid, current.id);
    },

    updateGoals: async (goals) => {
      const uid = requireUid();
      const current = get().currentMeeting;
      if (!current) {
        return;
      }
      await repo.patchMeeting(uid, current.id, { goals });
    },

    updateGoal: async (goalId, patch) => {
      const uid = requireUid();
      const current = get().currentMeeting;
      if (!current) {
        return;
      }
      const goals = current.goals.map((goal) =>
        goal.id === goalId ? { ...goal, ...patch } : goal,
      );
      await repo.patchMeeting(uid, current.id, { goals });
    },

    setSideTopics: async (sideTopics) => {
      const uid = requireUid();
      const current = get().currentMeeting;
      if (!current) {
        return;
      }
      await repo.patchMeeting(uid, current.id, { sideTopics });
    },

    setAutomatic: async (value) => {
      const uid = requireUid();
      set({ decisionsAutomaticBehavior: value });
      await repo.setAutomaticBehavior(uid, value);
    },

    reopen: async (id) => {
      const uid = requireUid();
      await repo.setCurrentMeetingId(uid, id);
    },

    clone: async (id) => {
      const uid = requireUid();
      const source = get().meetings.find((meeting) => meeting.id === id);
      if (!source) {
        return null;
      }
      const newId = repo.newMeetingId(uid);
      const durationMs = diffMs(source.expectedEndTime, source.expectedStartTime);
      const start = new Date();
      const end =
        durationMs > 0 ? new Date(start.getTime() + durationMs) : addHours(start, 1);

      const meeting: Meeting = {
        id: newId,
        name: `${source.name} (copy)`,
        description: source.description,
        expectedStartTime: toISO(start),
        expectedEndTime: toISO(end),
        realStartTime: '',
        realEndTime: '',
        goals: source.goals.map((goal) => ({
          id: makeId(),
          name: goal.name,
          weight: goal.weight,
          finishedAt: '',
          decisions: '',
        })),
        sideTopics: source.sideTopics.map((topic) => ({
          id: makeId(),
          value: topic.value,
        })),
        status: 'draft',
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };

      await repo.saveMeeting(uid, meeting);
      await repo.setCurrentMeetingId(uid, newId);
      return newId;
    },
  };
});
