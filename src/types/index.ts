/**
 * TypeScript Type Definitions
 */

export type UserRole =
  | 'admin'
  | 'supervisor'
  | 'gip'
  | 'intern'
  | 'coordinator';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  name?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Intern {
  id: number;
  user_id: number;
  student_id: string;
  full_name: string;
  course: string;
  year_level: string;
  company_name: string;
  supervisor_name: string;
  start_date: string;
  end_date: string;
  user?: User;
}

export interface Schedule {
  id: number;
  intern_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  is_active: boolean;
  intern?: Intern;
}

export type AttendanceStatus = 'pending' | 'approved' | 'rejected';

export interface Attendance {
  id: number;
  intern_id: number;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  break_start: string | null;
  break_end: string | null;
  location_lat: number | null;
  location_lng: number | null;
  clock_in_photo: string | null;
  clock_out_photo: string | null;
  status: AttendanceStatus;
  approved_by: number | null;
  approved_at: string | null;
  notes: string | null;
  total_hours: number | null;
  intern?: Intern;
}

export interface Approval {
  id: number;
  attendance_id: number;
  approver_id: number;
  status: AttendanceStatus;
  comments: string | null;
  created_at: string;
  attendance?: Attendance;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_interns: number;
  active_today: number;
  pending_approvals: number;
  attendance_rate: number;
}

export interface SystemSettings {
  grace_period_minutes: number;
  verification_gps: boolean;
  verification_selfie: boolean;
}
