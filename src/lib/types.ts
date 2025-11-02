// Enums
export type StatusObjetivo = 'planejado' | 'em_andamento' | 'concluido' | 'arquivado';
export type StatusHabito = 'ativo' | 'pausado' | 'concluido';
export type StatusTarefa = 'backlog' | 'a_fazer' | 'fazendo' | 'bloqueada' | 'concluida';
export type Prioridade = 'baixa' | 'media' | 'alta';
export type Frequencia = 'diario' | 'semanal' | 'mensal';

// Entidades
export interface Objetivo {
  id: string;
  titulo: string;
  descricao?: string;
  inicio?: string; // ISO date
  fim?: string; // ISO date
  status: StatusObjetivo;
  progresso: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface Habito {
  id: string;
  objetivoId: string;
  titulo: string;
  descricao?: string;
  frequencia: Frequencia;
  alvoPorPeriodo: number;
  realizadosNoPeriodo: number;
  status: StatusHabito;
  progresso: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface Tarefa {
  id: string;
  habitoId: string; // Obrigatório - tarefas agora são ligadas apenas a hábitos
  titulo: string;
  descricao?: string;
  prioridade?: Prioridade;
  status: StatusTarefa;
  estimativaHoras?: number;
  horasGastas?: number;
  prazo?: string; // ISO date
  progresso: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

// Tipos auxiliares
export interface Filtros {
  busca?: string;
  status?: string[];
  prioridade?: Prioridade[];
  objetivoId?: string;
  habitoId?: string;
  prazoInicio?: string;
  prazoFim?: string;
}

export interface Ordenacao {
  campo: string;
  direcao: 'asc' | 'desc';
}

export interface Paginacao {
  pagina: number;
  itensPorPagina: number;
  total: number;
}

// Tipos de resposta da API
export interface ApiResponse<T> {
  data: T;
  pagination?: ApiPagination;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface DashboardData {
  totalObjetivos: number;
  objetivosAtivos: number;
  totalHabitos: number;
  habitosAtivos: number;
  totalTarefas: number;
  tarefasConcluidas: number;
  progressoGeral: number;
}

// Parâmetros de query para filtros
export interface QueryParams {
  busca?: string;
  status?: string[];
  inicio?: string;
  fim?: string;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  objetivoId?: string;
  habitoId?: string;
  prioridade?: string[];
  frequencia?: string[];
  prazoInicio?: string;
  prazoFim?: string;
}
