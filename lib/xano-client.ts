// Xano API Client für Zeiterfassung App
import type {
  User,
  TimeClock,
  TimeEntry,
  WorkingTime,
  OvertimeAccount,
  Absence,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  TimeClockStartRequest,
  TimeClockStopRequest,
  TimeEntryCreateRequest,
  TimeEntryUpdateRequest,
  PaginatedResponse,
  WeekReport,
  MonthReport,
  WorkingTimeCreateRequest,
  AbsenceCreateRequest,
  TimeEntriesQueryParams,
  AbsencesQueryParams,
  UsersQueryParams,
} from './types';

const XANO_BASE_URL = process.env.NEXT_PUBLIC_XANO_BASE_URL;
const XANO_API_GROUP_AUTH = process.env.NEXT_PUBLIC_XANO_API_GROUP_AUTH || 'api:eltyNUzq';
const XANO_API_GROUP_MAIN = process.env.NEXT_PUBLIC_XANO_API_GROUP_MAIN || 'api:uMXZ3Fde';
const XANO_API_GROUP_TIME_ENTRIES = process.env.NEXT_PUBLIC_XANO_API_GROUP_TIME_ENTRIES || 'api:time_entries';
const XANO_API_GROUP_REPORTS = process.env.NEXT_PUBLIC_XANO_API_GROUP_REPORTS || 'api:p3vCYW4E';

if (!XANO_BASE_URL) {
  throw new Error('NEXT_PUBLIC_XANO_BASE_URL is not defined in environment variables');
}

class XanoClient {
  private authBaseUrl: string;
  private mainBaseUrl: string;
  private timeEntriesBaseUrl: string;
  private reportsBaseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.authBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_AUTH}`;
    this.mainBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_MAIN}`;
    this.timeEntriesBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_TIME_ENTRIES}`;
    this.reportsBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_REPORTS}`;

    // Load token from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('authToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    apiGroup: 'auth' | 'main' | 'timeEntries' | 'reports' = 'main'
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    let baseUrl: string;
    switch (apiGroup) {
      case 'auth':
        baseUrl = this.authBaseUrl;
        break;
      case 'timeEntries':
        baseUrl = this.timeEntriesBaseUrl;
        break;
      case 'reports':
        baseUrl = this.reportsBaseUrl;
        break;
      default:
        baseUrl = this.mainBaseUrl;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'auth');
    this.setAuthToken(response.authToken);
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'auth');
    this.setAuthToken(response.authToken);
    return response;
  }

  async logout() {
    this.setAuthToken(null);
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/me', {}, 'auth');
  }

  // ============================================
  // TIME CLOCK (Stoppuhr)
  // ============================================

  async startTimer(data: TimeClockStartRequest): Promise<TimeClock> {
    return this.request<TimeClock>('/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async stopTimer(data?: TimeClockStopRequest): Promise<{ time_entry: TimeEntry }> {
    return this.request<{ time_entry: TimeEntry }>('/stop', {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async getCurrentTimer(): Promise<TimeClock | null> {
    try {
      return await this.request<TimeClock>('/current');
    } catch (error: any) {
      // Return null if no timer (204 No Content or 404 Not Found)
      if (error.status === 404 || error.status === 204) {
        return null;
      }
      // For other errors, still return null to prevent UI crash
      console.warn('getCurrentTimer error:', error);
      return null;
    }
  }

  // ============================================
  // TIME ENTRIES
  // ============================================

  async createTimeEntry(data: TimeEntryCreateRequest): Promise<TimeEntry> {
    return this.request<TimeEntry>('/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'timeEntries');
  }

  async getTimeEntries(params?: TimeEntriesQueryParams): Promise<PaginatedResponse<TimeEntry>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<PaginatedResponse<TimeEntry>>(
      `/list${queryString ? `?${queryString}` : ''}`,
      {},
      'timeEntries'
    );
  }

  async getTimeEntry(id: number): Promise<TimeEntry> {
    return this.request<TimeEntry>(`/time-entries/${id}`);
  }

  async updateTimeEntry(id: number, data: TimeEntryUpdateRequest): Promise<TimeEntry> {
    return this.request<TimeEntry>(`/time-entries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTimeEntry(id: number): Promise<void> {
    return this.request<void>(`/time-entries/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // REPORTS & OVERTIME
  // ============================================

  async getWeekReport(date: string): Promise<WeekReport> {
    return this.request<WeekReport>(`/week?date=${date}`, {}, 'reports');
  }

  async getMonthReport(year: number, month: number): Promise<MonthReport> {
    return this.request<MonthReport>(`/month?year=${year}&month=${month}`, {}, 'reports');
  }

  async getOvertimeBalance(): Promise<OvertimeAccount> {
    return this.request<OvertimeAccount>('/overtime/balance');
  }

  async recalculateOvertime(): Promise<{
    user_id: number;
    previous_balance: number;
    new_balance: number;
    calculated_at: string;
  }> {
    return this.request('/overtime/recalculate', {
      method: 'POST',
    });
  }

  // ============================================
  // WORKING TIME
  // ============================================

  async getWorkingTime(): Promise<WorkingTime> {
    return this.request<WorkingTime>('/working-time');
  }

  async createWorkingTime(data: WorkingTimeCreateRequest): Promise<WorkingTime> {
    return this.request<WorkingTime>('/working-time', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // ABSENCES
  // ============================================

  async createAbsence(data: AbsenceCreateRequest): Promise<Absence> {
    return this.request<Absence>('/absences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAbsences(params?: AbsencesQueryParams): Promise<{ items: Absence[] }> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<{ items: Absence[] }>(
      `/absences${queryString ? `?${queryString}` : ''}`
    );
  }

  // ============================================
  // ADMIN
  // ============================================

  async getUsers(params?: UsersQueryParams): Promise<PaginatedResponse<User>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<PaginatedResponse<User>>(
      `/admin/users${queryString ? `?${queryString}` : ''}`
    );
  }

  async getUserTimeEntries(
    userId: number,
    params?: TimeEntriesQueryParams
  ): Promise<PaginatedResponse<TimeEntry>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<PaginatedResponse<TimeEntry>>(
      `/admin/users/${userId}/time-entries${queryString ? `?${queryString}` : ''}`
    );
  }

  async updateUser(
    userId: number,
    data: { role?: string; is_active?: boolean }
  ): Promise<User> {
    return this.request<User>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const xanoClient = new XanoClient();

// Export class for testing/custom instances
export default XanoClient;
