const API_BASE_URL = '/api';

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: null as T,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get all sessions
  static async getSessions(): Promise<ApiResponse<unknown[]>> {
    return this.request('/sessions');
  }

  // Get active sessions for LiveMap
  static async getActiveSessions(): Promise<ApiResponse<unknown[]>> {
    return this.request('/sessions/active');
  }

  // Get recent sessions for the table
  static async getRecentSessions(): Promise<ApiResponse<unknown[]>> {
    return this.request('/sessions/recent');
  }

  // Get session by ID
  static async getSession(id: string): Promise<ApiResponse<unknown>> {
    return this.request(`/sessions/${id}`);
  }

  // Get trends data (today vs yesterday)
  static async getTrends(): Promise<ApiResponse<unknown>> {
    return this.request('/trends');
  }

  // Get chart data
  static async getChartData(): Promise<ApiResponse<unknown>> {
    return this.request('/charts');
  }

  // Get vehicle data
  static async getVehicleData(vehicleId: string): Promise<ApiResponse<unknown>> {
    return this.request(`/vehicles/${vehicleId}/data`);
  }

  // Get system health
  static async getHealth(): Promise<ApiResponse<unknown>> {
    return this.request('/health');
  }

  // Get analytics data
  static async getAnalytics(period: string = 'day'): Promise<ApiResponse<unknown>> {
    return this.request(`/analytics?period=${period}`);
  }
}
