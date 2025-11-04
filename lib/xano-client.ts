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
  AbsenceUpdateRequest,
  TimeEntriesQueryParams,
  AbsencesQueryParams,
  UsersQueryParams,
  Organization,
  Person,
  Address,
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
  PersonCreateRequest,
  PersonUpdateRequest,
  AddressCreateRequest,
  AddressUpdateRequest,
  OrganizationsQueryParams,
  PersonsQueryParams,
  AddressesQueryParams,
} from './types';

const XANO_BASE_URL = process.env.NEXT_PUBLIC_XANO_BASE_URL;
const XANO_API_GROUP_AUTH = process.env.NEXT_PUBLIC_XANO_API_GROUP_AUTH || 'api:eltyNUzq';
const XANO_API_GROUP_MAIN = process.env.NEXT_PUBLIC_XANO_API_GROUP_MAIN || 'api:uMXZ3Fde';
const XANO_API_GROUP_TIME_ENTRIES = process.env.NEXT_PUBLIC_XANO_API_GROUP_TIME_ENTRIES || 'api:time_entries';
const XANO_API_GROUP_REPORTS = process.env.NEXT_PUBLIC_XANO_API_GROUP_REPORTS || 'api:p3vCYW4E';
const XANO_API_GROUP_CRM = process.env.NEXT_PUBLIC_XANO_API_GROUP_CRM || 'api:2dZRWuiU';
const XANO_API_GROUP_ADMIN = process.env.NEXT_PUBLIC_XANO_API_GROUP_ADMIN || 'admin';
const XANO_API_GROUP_ABSENCES = process.env.NEXT_PUBLIC_XANO_API_GROUP_ABSENCES || 'api:Y4Tu20lh';

if (!XANO_BASE_URL) {
  throw new Error('NEXT_PUBLIC_XANO_BASE_URL is not defined in environment variables');
}

class XanoClient {
  private authBaseUrl: string;
  private mainBaseUrl: string;
  private timeEntriesBaseUrl: string;
  private reportsBaseUrl: string;
  private crmBaseUrl: string;
  private adminBaseUrl: string;
  private absencesBaseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.authBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_AUTH}`;
    this.mainBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_MAIN}`;
    this.timeEntriesBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_TIME_ENTRIES}`;
    this.reportsBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_REPORTS}`;
    this.crmBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_CRM}`;
    this.adminBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_ADMIN}`;
    this.absencesBaseUrl = `${XANO_BASE_URL}/${XANO_API_GROUP_ABSENCES}`;

    // Load token from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('authToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    apiGroup: 'auth' | 'main' | 'timeEntries' | 'reports' | 'crm' | 'admin' | 'absences' = 'main'
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
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
      case 'crm':
        baseUrl = this.crmBaseUrl;
        break;
      case 'admin':
        baseUrl = this.adminBaseUrl;
        break;
      case 'absences':
        baseUrl = this.absencesBaseUrl;
        break;
      default:
        baseUrl = this.mainBaseUrl;
    }

    const url = `${baseUrl}${endpoint}`;
    console.log('🔍 Xano Request:', { url, method: options.method || 'GET', apiGroup });

    const response = await fetch(url, {
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

  async getAllTimeEntries(p: number = 1, limit: number = 50): Promise<PaginatedResponse<TimeEntry>> {
    return this.request<PaginatedResponse<TimeEntry>>(
      `/time_entries?p=${p}&limit=${limit}`,
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
    return this.request<Absence>('/post_absences', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'absences');
  }

  async getAbsences(params?: AbsencesQueryParams): Promise<{ items: Absence[] }> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<{ items: Absence[] }>(
      `/get_absences${queryString ? `?${queryString}` : ''}`,
      {},
      'absences'
    );
  }

  async updateAbsence(id: number, data: AbsenceUpdateRequest): Promise<Absence> {
    return this.request<Absence>(`/absences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, 'absences');
  }

  async deleteAbsence(id: number): Promise<void> {
    return this.request<void>(`/delet_absences/${id}`, {
      method: 'DELETE',
    }, 'absences');
  }

  // ============================================
  // ADMIN
  // ============================================

  async getUsers(params?: UsersQueryParams): Promise<PaginatedResponse<User>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<PaginatedResponse<User>>(
      `/get_users_list${queryString ? `?${queryString}` : ''}`,
      {},
      'admin'
    );
  }

  async getUser(userId: number): Promise<User> {
    return this.request<User>(`/get_user_id?id=${userId}`, {}, 'admin');
  }

  async getUserTimeEntries(
    userId: number,
    params?: TimeEntriesQueryParams
  ): Promise<PaginatedResponse<TimeEntry>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<PaginatedResponse<TimeEntry>>(
      `/user_time_entries?user_id=${userId}${queryString ? `&${queryString}` : ''}`,
      {},
      'admin'
    );
  }

  async updateUser(
    userId: number,
    data: { role?: string; is_active?: boolean }
  ): Promise<User> {
    return this.request<User>(`/patch_user`, {
      method: 'PATCH',
      body: JSON.stringify({ id: userId, ...data }),
    }, 'admin');
  }

  // ============================================
  // CRM - ORGANIZATIONS
  // ============================================

  async getOrganizations(params?: OrganizationsQueryParams): Promise<Organization[]> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<Organization[]>(
      `/list_organizations${queryString ? `?${queryString}` : ''}`,
      {},
      'crm'
    );
  }

  async getOrganization(id: number): Promise<Organization> {
    return this.request<Organization>(`/get_organization?id=${id}`, {}, 'crm');
  }

  async createOrganization(data: OrganizationCreateRequest): Promise<Organization> {
    return this.request<Organization>('/create_organization', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'crm');
  }

  async updateOrganization(id: number, data: OrganizationUpdateRequest): Promise<Organization> {
    return this.request<Organization>('/update_organization', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...data }),
    }, 'crm');
  }

  async deleteOrganization(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/delete_organization', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }, 'crm');
  }

  // ============================================
  // CRM - PERSONS
  // ============================================

  async getPersons(params?: PersonsQueryParams): Promise<Person[]> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<Person[]>(
      `/list_persons${queryString ? `?${queryString}` : ''}`,
      {},
      'crm'
    );
  }

  async getPerson(id: number): Promise<Person> {
    return this.request<Person>(`/get_person?id=${id}`, {}, 'crm');
  }

  async createPerson(data: PersonCreateRequest): Promise<Person> {
    return this.request<Person>('/create_person', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'crm');
  }

  async updatePerson(id: number, data: PersonUpdateRequest): Promise<Person> {
    return this.request<Person>('/update_person', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...data }),
    }, 'crm');
  }

  async deletePerson(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/delete_person', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }, 'crm');
  }

  // ============================================
  // CRM - ADDRESSES
  // ============================================

  async getAddresses(params?: AddressesQueryParams): Promise<Address[]> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<Address[]>(
      `/list_addresses${queryString ? `?${queryString}` : ''}`,
      {},
      'crm'
    );
  }

  async getAddress(id: number): Promise<Address> {
    return this.request<Address>(`/get_address?id=${id}`, {}, 'crm');
  }

  async createAddress(data: AddressCreateRequest): Promise<Address> {
    return this.request<Address>('/create_address', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'crm');
  }

  async updateAddress(id: number, data: AddressUpdateRequest): Promise<Address> {
    return this.request<Address>('/update_address', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...data }),
    }, 'crm');
  }

  async deleteAddress(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/delete_address', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }, 'crm');
  }
}

// Export singleton instance
export const xanoClient = new XanoClient();

// Export class for testing/custom instances
export default XanoClient;
