/**
 * Application Constants
 */

export const APP_CONFIG = {
  name: 'PESO - OJT Attendance System',
  version: '1.0.0',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  GIP: 'gip',
  INTERN: 'intern',
  SUPERVISOR: 'supervisor',
} as const;

/**
 * Display label for the intern/GIP role in UI text only.
 * GIP users see "GIP"; Intern users see "Intern". Layout and behavior unchanged.
 */
export function getInternOrGipRoleLabel(role: string | undefined): 'Intern' | 'GIP' {
  return role === 'gip' ? 'GIP' : 'Intern';
}

export const ATTENDANCE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const   ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: {
      INTERN: '/dashboard/intern',
      ADMIN: '/dashboard/admin',
      SUPERVISOR: '/dashboard/supervisor',
    },
  ATTENDANCE: {
    CLOCK: '/attendance/clock',
    HISTORY: '/attendance/history',
  },
  APPROVALS: '/approvals',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;
