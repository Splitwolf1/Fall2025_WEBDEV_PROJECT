// API Client for backend communication

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;

    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth-token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
      document.cookie = `auth-token=${token}; path=/; max-age=604800`; // 7 days
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      document.cookie = 'auth-token=; path=/; max-age=0';
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure baseUrl is properly formatted
    if (!this.baseUrl || !this.baseUrl.startsWith('http')) {
      console.error('Invalid API URL:', this.baseUrl);
      throw new Error(
        `API URL is not configured. Please set NEXT_PUBLIC_API_URL in .env.local file. Current value: ${this.baseUrl}`
      );
    }

    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Unexpected response format: ${text}`);
      }

      if (!response.ok) {
        // Provide more detailed error messages
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        if (response.status === 404) {
          throw new Error(`Endpoint not found: ${endpoint}. Please check if the backend service is running.`);
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      // Handle abort/timeout errors
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }

      // Provide more helpful error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error(
          `Cannot connect to backend API at ${this.baseUrl}. Make sure:\n` +
          `1. Backend services are running (docker-compose up)\n` +
          `2. API Gateway is accessible at http://localhost:4000\n` +
          `3. NEXT_PUBLIC_API_URL is set correctly in .env.local`
        );
      }
      // Re-throw error with message (don't log expected errors like role mismatches)
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: {
    email: string;
    password: string;
    role: string;
    profile: any;
    [key: string]: any;
  }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email: string, password: string, role?: string) {
    const response = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }

    return response;
  }

  async logout() {
    this.clearToken();
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  async updateProfile(updates: any) {
    return this.request('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Get all users by role (e.g., all farmers for suppliers)
  async getUsersByRole(role: string) {
    return this.request(`/api/auth/users?role=${role}`);
  }

  // Product endpoints
  async getProducts(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    farmerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request(`/api/products?${params.toString()}`);
  }

  async getProduct(id: string) {
    return this.request(`/api/products/${id}`);
  }

  async createProduct(productData: any) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, updates: any) {
    return this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateProductStock(id: string, quantity: number) {
    return this.request(`/api/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async getOrders(filters?: {
    customerId?: string;
    farmerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request(`/api/orders?${params.toString()}`);
  }

  async getOrder(id: string) {
    return this.request(`/api/orders/${id}`);
  }

  async createOrder(orderData: any) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id: string, status: string, note?: string) {
    return this.request(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  }

  async cancelOrder(id: string, reason?: string) {
    return this.request(`/api/orders/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // Delivery endpoints
  async getDeliveries(filters?: {
    distributorId?: string;
    orderId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request(`/api/deliveries?${params.toString()}`);
  }

  async getDelivery(id: string) {
    return this.request(`/api/deliveries/${id}`);
  }

  async createDelivery(deliveryData: any) {
    return this.request('/api/deliveries', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    });
  }

  async updateDeliveryStatus(id: string, status: string, note?: string, location?: any) {
    return this.request(`/api/deliveries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, location }),
    });
  }

  async updateDeliveryLocation(id: string, lat: number, lng: number) {
    return this.request(`/api/deliveries/${id}/location`, {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
    });
  }

  async completeDelivery(id: string, proof: any) {
    return this.request(`/api/deliveries/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(proof),
    });
  }

  // Inspection endpoints
  async getInspections(filters?: {
    inspectorId?: string;
    targetType?: string;
    targetId?: string;
    result?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request(`/api/inspections?${params.toString()}`);
  }

  async getInspection(id: string) {
    return this.request(`/api/inspections/${id}`);
  }

  async createInspection(inspectionData: any) {
    return this.request('/api/inspections', {
      method: 'POST',
      body: JSON.stringify(inspectionData),
    });
  }

  async completeInspection(id: string, data: any) {
    return this.request(`/api/inspections/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getComplianceStats(targetType: string, targetId: string) {
    return this.request(`/api/inspections/stats/${targetType}/${targetId}`);
  }

  // Chatbot endpoint
  async chat(message: string, userId?: string) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, userId }),
    });
  }

  // Notification endpoint
  async sendNotification(userId: string, notification: any) {
    return this.request('/api/notify', {
      method: 'POST',
      body: JSON.stringify({ userId, ...notification }),
    });
  }

  // Fleet Management endpoints
  async getVehicles(distributorId?: string, status?: string) {
    const params = new URLSearchParams();
    if (distributorId) params.append('distributorId', distributorId);
    if (status) params.append('status', status);
    return this.request(`/api/fleet/vehicles?${params.toString()}`);
  }

  async getVehicle(id: string) {
    return this.request(`/api/fleet/vehicles/${id}`);
  }

  async createVehicle(vehicleData: any) {
    return this.request('/api/fleet/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  async updateVehicle(id: string, updates: any) {
    return this.request(`/api/fleet/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteVehicle(id: string) {
    return this.request(`/api/fleet/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  async getDrivers(distributorId?: string, status?: string) {
    const params = new URLSearchParams();
    if (distributorId) params.append('distributorId', distributorId);
    if (status) params.append('status', status);
    return this.request(`/api/fleet/drivers?${params.toString()}`);
  }

  async getDriver(id: string) {
    return this.request(`/api/fleet/drivers/${id}`);
  }

  async createDriver(driverData: any) {
    return this.request('/api/fleet/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });
  }

  async updateDriver(id: string, updates: any) {
    return this.request(`/api/fleet/drivers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteDriver(id: string) {
    return this.request(`/api/fleet/drivers/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_URL);

export default apiClient;
