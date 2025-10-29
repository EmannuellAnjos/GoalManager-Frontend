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
  objetivoId?: string;
  habitoId?: string;
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
