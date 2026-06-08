/** Centralized route paths. Change a URL here, not at every call site. */
export const paths = {
  home: '/',
  login: '/login',
  meetings: '/meetings',
  newMeeting: '/meetings/new',
  liveMeeting: '/meetings/live',
  report: '/meetings/report',
} as const;
