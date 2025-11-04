// TypeScript Types für Zeiterfassung App mit Xano Backend
// Angepasst an die tatsächliche Xano API-Dokumentation

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'office' | 'admin';
  is_active: boolean;
  created_at: number; // Xano timestamp (milliseconds)
  avatar_url?: string | null;
  employee_id?: string | null;
  active_timer?: TimeClock | null;
  overtime_account?: OvertimeAccount;
}

export interface TimeClock {
  id: number;
  user_id?: number;
  started_at: number; // Xano timestamp
  is_break: boolean;
  comment?: string | null;
  elapsed_seconds?: number;
}

export interface TimeEntry {
  id: number;
  user_id: number;
  start: number; // Xano timestamp
  end: number; // Xano timestamp
  is_break: boolean;
  comment?: string | null;
  created_at: number;
  updated_at: number;
}

export interface WorkingTime {
  id: number;
  user_id?: number;
  valid_from: string; // YYYY-MM-DD
  monday_hours: number;
  tuesday_hours: number;
  wednesday_hours: number;
  thursday_hours: number;
  friday_hours: number;
  saturday_hours: number;
  sunday_hours: number;
  works_on_public_holiday: boolean;
  created_at?: number;
}

export interface OvertimeAccount {
  id: number;
  user_id: number;
  current_balance: number; // decimal hours
  max_allowed_overtime: number;
  updated_at: number;
}

export interface Absence {
  id: number;
  user_id: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  type: 'vacation' | 'sick' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  comment?: string | null;
  created_at: number;
}

// API Request/Response Types

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  authToken: string;
  user: User;
}

export interface TimeClockStartRequest {
  is_break: boolean;
  comment?: string;
}

export interface TimeClockStopRequest {
  comment?: string;
}

export interface TimeEntryCreateRequest {
  start: number; // Xano timestamp
  end: number; // Xano timestamp
  is_break: boolean;
  comment?: string;
}

export interface TimeEntryUpdateRequest {
  start?: number;
  end?: number;
  is_break?: boolean;
  comment?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  itemsReceived: number;
  curPage: number;
  nextPage: number | null;
  prevPage: number | null;
  offset: number;
  perPage: number;
}

export interface WeekReportDay {
  date: string; // YYYY-MM-DD
  weekday: string; // e.g., "Monday", "Tuesday", etc.
  worked_hours: number;
  should_hours: number;
  difference: number;
  entries: Array<{
    id: number;
    start: number;
    end: number;
    is_break: boolean;
    comment?: string | null;
    duration_hours: number;
  }>;
}

export interface WeekReport {
  week_start: string; // YYYY-MM-DD
  week_end: string; // YYYY-MM-DD
  days: WeekReportDay[];
  summary: {
    total_worked: number;
    total_should: number;
    difference: number;
  };
}

export interface MonthReport {
  year: number;
  month: number;
  month_name: string;
  days: WeekReportDay[];
  summary: {
    total_worked: number;
    total_should: number;
    difference: number;
  };
}

export interface WorkingTimeCreateRequest {
  valid_from: string; // YYYY-MM-DD
  monday_hours?: number;
  tuesday_hours?: number;
  wednesday_hours?: number;
  thursday_hours?: number;
  friday_hours?: number;
  saturday_hours?: number;
  sunday_hours?: number;
  works_on_public_holiday?: boolean;
}

export interface AbsenceCreateRequest {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  type: 'vacation' | 'sick' | 'other';
  comment?: string;
}

// Query Parameter Types

export interface TimeEntriesQueryParams {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  page?: number;
  per_page?: number;
  limit?: number;
  offset?: number;
}

export interface AbsencesQueryParams {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  per_page?: number;
}

export interface UsersQueryParams {
  role?: 'user' | 'office' | 'admin';
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

// ============================================
// CRM TYPES
// ============================================

export interface Organization {
  id: number;
  organization_number: string;
  name: string;
  legal_form?: string | null;
  payment_terms: number;
  discount_percentage: number;
  credit_limit?: number | null;
  industry?: string | null;
  customer_type?: string | null;
  status: string;
  vat_id?: string | null;
  tax_number?: string | null;
  website?: string | null;
  notes?: string | null;
  created_by?: number | null;
  created_at: number;
  updated_at: number;
}

export interface Person {
  id: number;
  organization_id?: number | null;
  salutation?: string | null;
  title?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  position?: string | null;
  department?: string | null;
  is_primary_contact: boolean;
  is_billing_contact: boolean;
  is_active: boolean;
  birthday?: string | null; // YYYY-MM-DD
  notes?: string | null;
  created_at: number;
  updated_at: number;
}

export interface Address {
  id: number;
  addressable_type: 'organization' | 'person';
  addressable_id: number;
  address_type: 'billing' | 'shipping' | 'other';
  street: string;
  street2?: string | null;
  postal_code: string;
  city: string;
  state?: string | null;
  country: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

// CRM Request Types

export interface OrganizationCreateRequest {
  organization_number: string;
  name: string;
  legal_form?: string;
  payment_terms?: number;
  discount_percentage?: number;
  credit_limit?: number;
  industry?: string;
  customer_type?: string;
  status?: string;
  vat_id?: string;
  tax_number?: string;
  website?: string;
  notes?: string;
}

export interface OrganizationUpdateRequest {
  organization_number?: string;
  name?: string;
  legal_form?: string;
  payment_terms?: number;
  discount_percentage?: number;
  credit_limit?: number;
  industry?: string;
  customer_type?: string;
  status?: string;
  vat_id?: string;
  tax_number?: string;
  website?: string;
  notes?: string;
}

export interface PersonCreateRequest {
  organization_id?: number;
  salutation?: string;
  title?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  is_primary_contact?: boolean;
  is_billing_contact?: boolean;
  is_active?: boolean;
  birthday?: string;
  notes?: string;
}

export interface PersonUpdateRequest {
  organization_id?: number;
  salutation?: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  is_primary_contact?: boolean;
  is_billing_contact?: boolean;
  is_active?: boolean;
  birthday?: string;
  notes?: string;
}

export interface AddressCreateRequest {
  addressable_type: 'organization' | 'person';
  addressable_id: number;
  address_type?: 'billing' | 'shipping' | 'other';
  street: string;
  street2?: string;
  postal_code: string;
  city: string;
  state?: string;
  country?: string;
  is_primary?: boolean;
  is_active?: boolean;
}

export interface AddressUpdateRequest {
  addressable_type?: 'organization' | 'person';
  addressable_id?: number;
  address_type?: 'billing' | 'shipping' | 'other';
  street?: string;
  street2?: string;
  postal_code?: string;
  city?: string;
  state?: string;
  country?: string;
  is_primary?: boolean;
  is_active?: boolean;
}

// CRM Query Parameters

export interface OrganizationsQueryParams {
  status?: string;
}

export interface PersonsQueryParams {
  organization_id?: number;
}

export interface AddressesQueryParams {
  addressable_type?: 'organization' | 'person';
}
