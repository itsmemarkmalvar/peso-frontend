/**
 * API Endpoints
 * Centralized endpoint definitions for Laravel backend
 */

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    registerRequest: '/auth/register-request',
    setupPassword: '/auth/setup-password',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
    invitationVerify: '/invitation/verify',
    invitationAccept: '/invitation/accept',
  },

  // Interns
  interns: {
    list: '/interns',
    create: '/interns',
    me: '/interns/me',
    show: (id: number) => `/interns/${id}`,
    update: (id: number) => `/interns/${id}`,
    delete: (id: number) => `/interns/${id}`,
  },

  // Attendance
  attendance: {
    clockIn: '/attendance/clock-in',
    clockOut: '/attendance/clock-out',
    list: '/attendance',
    show: (id: number) => `/attendance/${id}`,
    update: (id: number) => `/attendance/${id}`,
    today: '/attendance/today',
    history: '/attendance/history',
  },

  // Schedules
  schedules: {
    list: '/schedules',
    create: '/schedules',
    show: (id: number) => `/schedules/${id}`,
    update: (id: number) => `/schedules/${id}`,
    delete: (id: number) => `/schedules/${id}`,
    assign: '/schedules/assign',
  },

  // Approvals
  approvals: {
    list: '/approvals',
    pending: '/approvals/pending',
    approve: (id: number) => `/approvals/${id}/approve`,
    reject: (id: number) => `/approvals/${id}/reject`,
  },

  // Leaves
  leaves: {
    list: '/leaves',
    pending: '/leaves/pending',
    create: '/leaves',
    approve: (id: number) => `/leaves/${id}/approve`,
    reject: (id: number) => `/leaves/${id}/reject`,
  },

  // Reports
  reports: {
    dtr: '/reports/dtr',
    attendance: '/reports/attendance',
    hours: '/reports/hours',
    export: '/reports/export',
  },

  // Dashboard
  dashboard: {
    stats: '/dashboard/stats',
    recentActivity: '/dashboard/recent-activity',
  },

  // Intern dashboard aggregates (Laravel should expose these)
  intern: {
    dashboard: '/intern/dashboard',
    timeClock: '/intern/time-clock',
    timesheets: '/intern/timesheets',
    approvals: '/intern/approvals',
  },

  // Registration Requests (New system)
  registrationRequests: {
    list: '/registration-requests',
    show: (id: number) => `/registration-requests/${id}`,
    approve: (id: number) => `/registration-requests/${id}/approve`,
    reject: (id: number) => `/registration-requests/${id}/reject`,
  },

  // Departments
  departments: {
    list: '/departments',
  },

  // Supervisors
  supervisors: {
    me: '/supervisors/me',
  },

  // Pending Registrations (Legacy system)
  pendingRegistrations: {
    list: '/pending-registrations',
    show: (id: number) => `/pending-registrations/${id}`,
    approve: (id: number) => `/pending-registrations/${id}/approve`,
    reject: (id: number) => `/pending-registrations/${id}/reject`,
  },
} as const;
