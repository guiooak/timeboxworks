import {
  addMonths as addMonthsFn,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getHours,
  getMinutes,
  isSameMonth as isSameMonthFn,
  setDate,
  setHours,
  setMinutes,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { toDate } from './datetime';
import type { DateInput } from './types';

/** Six-week (42-day) grid covering the month containing `view`. */
export function monthGrid(view: DateInput): Date[] {
  const base = toDate(view);
  const start = startOfWeek(startOfMonth(base));
  const end = endOfWeek(endOfMonth(base));
  return eachDayOfInterval({ start, end });
}

export function addMonths(view: DateInput, amount: number): Date {
  return addMonthsFn(toDate(view), amount);
}

export function isSameMonth(a: DateInput, b: DateInput): boolean {
  return isSameMonthFn(toDate(a), toDate(b));
}

/** Month + year title, e.g. "March 2026". */
export function formatMonthYear(view: DateInput): string {
  return format(toDate(view), 'LLLL yyyy');
}

export function hoursOf(input: DateInput): number {
  return getHours(toDate(input));
}

export function minutesOf(input: DateInput): number {
  return getMinutes(toDate(input));
}

/** Copy the calendar day from `day` onto `base`, keeping `base`'s time. */
export function withDay(base: DateInput, day: DateInput): Date {
  const baseDate = toDate(base);
  const dayDate = toDate(day);
  let next = setYear(baseDate, dayDate.getFullYear());
  next = setMonth(next, dayDate.getMonth());
  next = setDate(next, dayDate.getDate());
  return next;
}

export function withTime(base: DateInput, hours: number, minutes: number): Date {
  return setMinutes(setHours(toDate(base), hours), minutes);
}

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
