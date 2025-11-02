import { Objetivo, Habito, Tarefa, ApiResponse, QueryParams, DashboardData } from './types';

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USER_ID = import.meta.env.VITE_USER_ID || '550e8400-e29b-41d4-a716-446655440000';

// Interface para resposta de login
interface LoginResponse {
  data: {
    access_token: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
}

// Função para fazer login e obter token real
async function loginAndGetToken(): Promise<string> {
  const loginUrl = `${API_BASE_URL}/auth/login`;
  
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@goalmanager.com',
        password: 'password'
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data: LoginResponse = await response.json();
    const token = data.data.access_token;
    
    // Salvar token no localStorage
    localStorage.setItem('auth_token', token);
    
    return token;
  } catch (error) {
    console.error('Erro no login automático:', error);
    // Fallback para token fictício
    const fallbackToken = `dev-token-${USER_ID}`;
    return fallbackToken;
  }
}

// Cache do token para evitar múltiplos logins
let cachedToken: string | null = null;

// Função para obter o token de autenticação
function getAuthToken(): string {
  // Verificar se já temos um token no localStorage
  const storedToken = localStorage.getItem('auth_token');
  if (storedToken) {
    return storedToken;
  }
  
  // Se não temos token, usar o fictício por enquanto
  // (o login será feito de forma assíncrona)
  const fallbackToken = `dev-token-${USER_ID}`;
  
  return fallbackToken;
}

// Função para inicializar autenticação (deve ser chamada no início da aplicação)
export async function initializeAuth(): Promise<void> {
  // Verificar se já temos token válido
  const storedToken = localStorage.getItem('auth_token');
  if (storedToken) {
    return;
  }
  
  // Fazer login automático
  try {
    await loginAndGetToken();
  } catch (error) {
    console.error('Falha na inicialização da autenticação:', error);
  }
}

// Função para forçar renovação do token (útil para testes)
export async function refreshToken(): Promise<void> {
  // Limpar token atual
  localStorage.removeItem('auth_token');
  cachedToken = null;
  
  // Fazer novo login
  try {
    await loginAndGetToken();
  } catch (error) {
    console.error('Falha na renovação do token:', error);
    throw error;
  }
}

// Função auxiliar para fazer requisições HTTP
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };


  try {
    const response = await fetch(url, config);
    
    // Se receber 401 (Unauthorized), tentar renovar token
    if (response.status === 401) {
      console.warn('🔄 Token expirado (401), tentando renovar...');
      
      try {
        // Limpar token antigo
        localStorage.removeItem('auth_token');
        
        // Fazer novo login
        await loginAndGetToken();
        
        // Atualizar headers com novo token
        const newConfig = {
          ...config,
          headers: {
            ...config.headers,
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        };
        
        console.log('🔄 Tentando requisição novamente com novo token...');
        
        // Tentar a requisição novamente
        const retryResponse = await fetch(url, newConfig);
        
        if (!retryResponse.ok) {
          throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
        }

        // Para DELETE sem conteúdo
        if (retryResponse.status === 204) {
          return {} as T;
        }

        console.log('✅ Requisição bem-sucedida após renovação do token');
        return await retryResponse.json();
        
      } catch (refreshError) {
        console.error('❌ Falha ao renovar token:', refreshError);
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Para DELETE sem conteúdo
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Função auxiliar para construir query string
function buildQueryString(params: QueryParams): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v.toString()));
      } else {
        queryParams.set(key, value.toString());
      }
    }
  });
  
  return queryParams.toString() ? `?${queryParams.toString()}` : '';
}

// ==================== OBJETIVOS ====================

export async function getObjetivos(params: QueryParams = {}): Promise<ApiResponse<Objetivo[]>> {
  const queryString = buildQueryString(params);
  return makeRequest<ApiResponse<Objetivo[]>>(`/objetivos${queryString}`);
}

export async function getObjetivo(id: string): Promise<ApiResponse<Objetivo>> {
  return makeRequest<ApiResponse<Objetivo>>(`/objetivos/${id}`);
}

export async function createObjetivo(data: Omit<Objetivo, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Objetivo>> {
  return makeRequest<ApiResponse<Objetivo>>('/objetivos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateObjetivo(id: string, data: Partial<Objetivo>): Promise<ApiResponse<Objetivo>> {
  return makeRequest<ApiResponse<Objetivo>>(`/objetivos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteObjetivo(id: string): Promise<void> {
  return makeRequest<void>(`/objetivos/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteObjetivos(ids: string[]): Promise<{ message: string; deletedCount: number }> {
  return makeRequest<{ message: string; deletedCount: number }>('/objetivos', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
}

// ==================== HÁBITOS ====================

export async function getHabitos(params: QueryParams = {}): Promise<ApiResponse<Habito[]>> {
  const queryString = buildQueryString(params);
  return makeRequest<ApiResponse<Habito[]>>(`/habitos${queryString}`);
}

export async function getHabitosByObjetivo(objetivoId: string): Promise<ApiResponse<Habito[]>> {
  return makeRequest<ApiResponse<Habito[]>>(`/objetivos/${objetivoId}/habitos`);
}

export async function getHabito(id: string): Promise<ApiResponse<Habito>> {
  return makeRequest<ApiResponse<Habito>>(`/habitos/${id}`);
}

export async function createHabito(data: Omit<Habito, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Habito>> {
  return makeRequest<ApiResponse<Habito>>('/habitos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateHabito(id: string, data: Partial<Habito>): Promise<ApiResponse<Habito>> {
  return makeRequest<ApiResponse<Habito>>(`/habitos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteHabito(id: string): Promise<void> {
  return makeRequest<void>(`/habitos/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteHabitos(ids: string[]): Promise<{ message: string; deletedCount: number }> {
  return makeRequest<{ message: string; deletedCount: number }>('/habitos', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
}

export async function marcarHabitoFeito(id: string): Promise<ApiResponse<{ id: string; realizadosNoPeriodo: number; progresso: number; updatedAt: string }>> {
  return makeRequest<ApiResponse<{ id: string; realizadosNoPeriodo: number; progresso: number; updatedAt: string }>>(`/habitos/${id}/marcar-feito`, {
    method: 'POST',
  });
}

export async function resetarHabitoCiclo(id: string): Promise<ApiResponse<{ id: string; realizadosNoPeriodo: number; progresso: number; updatedAt: string }>> {
  return makeRequest<ApiResponse<{ id: string; realizadosNoPeriodo: number; progresso: number; updatedAt: string }>>(`/habitos/${id}/reset-ciclo`, {
    method: 'POST',
  });
}

// ==================== TAREFAS ====================

export async function getTarefas(params: QueryParams = {}): Promise<ApiResponse<Tarefa[]>> {
  const queryString = buildQueryString(params);
  return makeRequest<ApiResponse<Tarefa[]>>(`/tarefas${queryString}`);
}

export async function getTarefasByObjetivo(objetivoId: string): Promise<ApiResponse<Tarefa[]>> {
  return makeRequest<ApiResponse<Tarefa[]>>(`/objetivos/${objetivoId}/tarefas`);
}

export async function getTarefasByHabito(habitoId: string): Promise<ApiResponse<Tarefa[]>> {
  return makeRequest<ApiResponse<Tarefa[]>>(`/habitos/${habitoId}/tarefas`);
}

export async function getTarefa(id: string): Promise<ApiResponse<Tarefa>> {
  return makeRequest<ApiResponse<Tarefa>>(`/tarefas/${id}`);
}

export async function createTarefa(data: Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Tarefa>> {
  return makeRequest<ApiResponse<Tarefa>>('/tarefas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTarefa(id: string, data: Partial<Tarefa>): Promise<ApiResponse<Tarefa>> {
  return makeRequest<ApiResponse<Tarefa>>(`/tarefas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTarefa(id: string): Promise<void> {
  return makeRequest<void>(`/tarefas/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteTarefas(ids: string[]): Promise<{ message: string; deletedCount: number }> {
  return makeRequest<{ message: string; deletedCount: number }>('/tarefas', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
}

// ==================== UTILITÁRIOS ====================

export async function recalcularProgressos(): Promise<{ message: string; updatedAt: string }> {
  return makeRequest<{ message: string; updatedAt: string }>('/recalcular-progressos', {
    method: 'POST',
  });
}

export async function getHealthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
  return makeRequest<{ status: string; timestamp: string; version: string }>('/health');
}

export async function getDashboard(): Promise<ApiResponse<DashboardData>> {
  return makeRequest<ApiResponse<DashboardData>>('/dashboard');
}
