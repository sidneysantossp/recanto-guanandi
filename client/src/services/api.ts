import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Boleto, 
  Notification, 
  ApiResponse, 
  PaginatedResponse, 
  LoginCredentials, 
  AuthResponse,
  DashboardStats,
  RelatorioFinanceiro,
  CreateUserForm,
  CreateBoletoForm,
  CreateNotificationForm
} from '../types';
import { Company, Provider, Budget, CreateCompanyForm, CreateProviderForm, CreateBudgetForm } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Normaliza a URL base para evitar casos como ":5001/api" sem host
    const envBase = process.env.REACT_APP_API_URL?.trim();
    // Em produção, ignore valores que apontem para localhost
    const isProd = process.env.NODE_ENV === 'production';
    const looksLocal = (url?: string) => !!url && /localhost|127\.0\.0\.1/i.test(url);

    let computedBaseURL = envBase && envBase !== '' && !(isProd && looksLocal(envBase))
      ? envBase
      : (process.env.NODE_ENV === 'development'
          ? 'http://localhost:5001/api'
          : '/api');

    // Se não houver protocolo explícito, tente corrigir
    if (!/^https?:\/\//i.test(computedBaseURL)) {
      if (computedBaseURL.startsWith('//')) {
        // protocolo relativo -> aplica o protocolo atual
        computedBaseURL = `${window.location.protocol}${computedBaseURL}`;
      } else if (computedBaseURL.startsWith(':')) {
        // apenas porta -> usa localhost como host em dev
        computedBaseURL = `${window.location.protocol}//localhost${computedBaseURL}`;
      } else if (computedBaseURL.startsWith('/')) {
        // caminho relativo -> usa origem atual
        computedBaseURL = `${window.location.origin}${computedBaseURL}`;
      } else {
        // algo como "localhost:5001/api" -> prefixa http
        computedBaseURL = `http://${computedBaseURL}`;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      // Ajuda a depurar qual baseURL está em uso
      // eslint-disable-next-line no-console
      console.debug('[api] baseURL =', computedBaseURL);
    }

    this.api = axios.create({
      baseURL: computedBaseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar respostas
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticação
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async getMe(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put('/auth/update-profile', data);
    return response.data;
  }

  async changePassword(data: { senhaAtual: string; novaSenha: string }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.put('/auth/change-password', data);
    return response.data;
  }

  // Métodos de usuários
  async getUsers(page = 1, limit = 10, search = ''): Promise<PaginatedResponse<User>> {
    const response: AxiosResponse<PaginatedResponse<User>> = await this.api.get('/users', {
      params: { page, limit, search }
    });
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async createUser(data: CreateUserForm): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.post('/users', data);
    return response.data;
  }

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  async toggleUserStatus(id: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.patch(`/users/${id}/toggle-status`);
    return response.data;
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/users/stats');
    return response.data;
  }

  // Métodos de boletos
  async getBoletos(page = 1, limit = 10, filters: any = {}): Promise<PaginatedResponse<Boleto>> {
    const response: AxiosResponse<PaginatedResponse<Boleto>> = await this.api.get('/boletos', {
      params: { page, limit, ...filters }
    });
    return response.data;
  }

  async getBoletoById(id: string): Promise<ApiResponse<Boleto>> {
    const response: AxiosResponse<ApiResponse<Boleto>> = await this.api.get(`/boletos/${id}`);
    return response.data;
  }

  async createBoleto(data: CreateBoletoForm): Promise<ApiResponse<Boleto>> {
    const response: AxiosResponse<ApiResponse<Boleto>> = await this.api.post('/boletos', data);
    return response.data;
  }

  async updateBoleto(id: string, data: Partial<Boleto>): Promise<ApiResponse<Boleto>> {
    const response: AxiosResponse<ApiResponse<Boleto>> = await this.api.put(`/boletos/${id}`, data);
    return response.data;
  }

  async markBoletoAsPaid(id: string, data: any): Promise<ApiResponse<Boleto>> {
    const response: AxiosResponse<ApiResponse<Boleto>> = await this.api.put(`/boletos/${id}/pay`, data);
    return response.data;
  }

  async cancelBoleto(id: string): Promise<ApiResponse<Boleto>> {
    const response: AxiosResponse<ApiResponse<Boleto>> = await this.api.delete(`/boletos/${id}`);
    return response.data;
  }

  async getBoletoStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/boletos/stats');
    return response.data;
  }

  async createBulkBoletos(data: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/boletos/bulk-create', data);
    return response.data;
  }

  async bulkCreateBoletos(data: CreateBoletoForm[]): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/boletos/bulk-create', { boletos: data });
    return response.data;
  }

  async deleteBoleto(id: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/boletos/${id}`);
    return response.data;
  }

  // Métodos de PIX
  async generatePix(boletoId: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/pix/generate', { boletoId });
    return response.data;
  }

  async getPixStatus(txid: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/pix/status/${txid}`);
    return response.data;
  }

  async simulatePixPayment(boletoId: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/pix/simulate-payment/${boletoId}`);
    return response.data;
  }

  // Métodos de notificações
  async getNotifications(page = 1, limit = 10, filters: any = {}): Promise<PaginatedResponse<Notification>> {
    const response: AxiosResponse<PaginatedResponse<Notification>> = await this.api.get('/notifications', {
      params: { page, limit, ...filters }
    });
    return response.data;
  }

  async getNotificationById(id: string): Promise<ApiResponse<Notification>> {
    const response: AxiosResponse<ApiResponse<Notification>> = await this.api.get(`/notifications/${id}`);
    return response.data;
  }

  async createNotification(data: CreateNotificationForm): Promise<ApiResponse<Notification>> {
    const response: AxiosResponse<ApiResponse<Notification>> = await this.api.post('/notifications', data);
    return response.data;
  }

  async updateNotification(id: string, data: Partial<Notification>): Promise<ApiResponse<Notification>> {
    const response: AxiosResponse<ApiResponse<Notification>> = await this.api.put(`/notifications/${id}`, data);
    return response.data;
  }

  async publishNotification(id: string): Promise<ApiResponse<Notification>> {
    const response: AxiosResponse<ApiResponse<Notification>> = await this.api.put(`/notifications/${id}/publish`);
    return response.data;
  }

  async archiveNotification(id: string): Promise<ApiResponse<Notification>> {
    const response: AxiosResponse<ApiResponse<Notification>> = await this.api.delete(`/notifications/${id}`);
    return response.data;
  }

  async getNotificationStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/notifications/stats');
    return response.data;
  }

  async addComment(id: string, content: string): Promise<ApiResponse<Notification>> {
    const response: AxiosResponse<ApiResponse<Notification>> = await this.api.post(`/notifications/${id}/comments`, { conteudo: content });
    return response.data;
  }

  // Métodos de relatórios
  async getFinancialReport(filters: any = {}): Promise<ApiResponse<RelatorioFinanceiro>> {
    const response: AxiosResponse<ApiResponse<RelatorioFinanceiro>> = await this.api.get('/reports/financial', {
      params: filters
    });
    return response.data;
  }

  async getDelinquencyReport(filters: any = {}): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/reports/inadimplencia', {
      params: filters
    });
    return response.data;
  }

  async getCollectionReport(filters: any = {}): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/reports/arrecadacao', {
      params: filters
    });
    return response.data;
  }

  async getOwnerReport(id: string, filters: any = {}): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/reports/owner/${id}`, {
      params: filters
    });
    return response.data;
  }

  // Companies
  async getCompanies(page = 1, limit = 10, search = ''): Promise<PaginatedResponse<Company>> {
    const response: AxiosResponse<PaginatedResponse<Company>> = await this.api.get('/companies', {
      params: { page, limit, search }
    });
    return response.data;
  }
  async createCompany(data: CreateCompanyForm): Promise<ApiResponse<Company>> {
    const response: AxiosResponse<ApiResponse<Company>> = await this.api.post('/companies', data);
    return response.data;
  }
  async updateCompany(id: string, data: Partial<Company>): Promise<ApiResponse<Company>> {
    const response: AxiosResponse<ApiResponse<Company>> = await this.api.put(`/companies/${id}`, data);
    return response.data;
  }
  async deleteCompany(id: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/companies/${id}`);
    return response.data;
  }

  // Providers
  async getProviders(page = 1, limit = 10, search = ''): Promise<PaginatedResponse<Provider>> {
    const response: AxiosResponse<PaginatedResponse<Provider>> = await this.api.get('/providers', {
      params: { page, limit, search }
    });
    return response.data;
  }
  async createProvider(data: CreateProviderForm): Promise<ApiResponse<Provider>> {
    const response: AxiosResponse<ApiResponse<Provider>> = await this.api.post('/providers', data);
    return response.data;
  }
  async updateProvider(id: string, data: Partial<Provider>): Promise<ApiResponse<Provider>> {
    const response: AxiosResponse<ApiResponse<Provider>> = await this.api.put(`/providers/${id}`, data);
    return response.data;
  }
  async deleteProvider(id: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/providers/${id}`);
    return response.data;
  }

  // Budgets
  async getBudgets(page = 1, limit = 10, filters: any = {}): Promise<PaginatedResponse<Budget>> {
    const response: AxiosResponse<PaginatedResponse<Budget>> = await this.api.get('/budgets', {
      params: { page, limit, ...filters }
    });
    return response.data;
  }
  async getBudgetById(id: string): Promise<ApiResponse<Budget>> {
    const response: AxiosResponse<ApiResponse<Budget>> = await this.api.get(`/budgets/${id}`);
    return response.data;
  }
  async createBudget(data: CreateBudgetForm): Promise<ApiResponse<Budget>> {
    const response: AxiosResponse<ApiResponse<Budget>> = await this.api.post('/budgets', data);
    return response.data;
  }
  async updateBudget(id: string, data: Partial<Budget>): Promise<ApiResponse<Budget>> {
    const response: AxiosResponse<ApiResponse<Budget>> = await this.api.put(`/budgets/${id}`, data);
    return response.data;
  }
  async changeBudgetStatus(id: string, status: Budget['status']): Promise<ApiResponse<Budget>> {
    const response: AxiosResponse<ApiResponse<Budget>> = await this.api.patch(`/budgets/${id}/status`, { status });
    return response.data;
  }
  async addBudgetComment(id: string, conteudo: string): Promise<ApiResponse<Budget>> {
    const response: AxiosResponse<ApiResponse<Budget>> = await this.api.post(`/budgets/${id}/comments`, { conteudo });
    return response.data;
  }
  async getBudgetTimeline(id: string): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/budgets/${id}/timeline`);
    return response.data;
  }
  async deleteBudget(id: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/budgets/${id}`);
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await this.api.get('/dashboard/stats');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
