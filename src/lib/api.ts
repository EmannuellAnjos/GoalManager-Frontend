import { Objetivo, Habito, Tarefa } from './types';
import { objetivosIniciais, habitosIniciais, tarefasIniciais } from './mock-data';
import { recalcularTodosProgressos } from './progress-calculator';

// Estado global da aplicação (simulando banco de dados)
let objetivos: Objetivo[] = [...objetivosIniciais];
let habitos: Habito[] = [...habitosIniciais];
let tarefas: Tarefa[] = [...tarefasIniciais];

// Recalcular progressos iniciais
const dadosRecalculados = recalcularTodosProgressos(objetivos, habitos, tarefas);
objetivos = dadosRecalculados.objetivos;
habitos = dadosRecalculados.habitos;
tarefas = dadosRecalculados.tarefas;

// Funções auxiliares
function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function atualizarTimestamp(entidade: any): any {
  return {
    ...entidade,
    updatedAt: new Date().toISOString(),
  };
}

function recalcularEAtualizar() {
  const recalculados = recalcularTodosProgressos(objetivos, habitos, tarefas);
  objetivos = recalculados.objetivos;
  habitos = recalculados.habitos;
  tarefas = recalculados.tarefas;
}

// ==================== OBJETIVOS ====================

export function getObjetivos(): Objetivo[] {
  return [...objetivos];
}

export function getObjetivo(id: string): Objetivo | undefined {
  return objetivos.find(o => o.id === id);
}

export function createObjetivo(data: Omit<Objetivo, 'id' | 'createdAt' | 'updatedAt'>): Objetivo {
  const novoObjetivo: Objetivo = {
    ...data,
    id: gerarId('obj'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  objetivos.push(novoObjetivo);
  recalcularEAtualizar();
  return novoObjetivo;
}

export function updateObjetivo(id: string, data: Partial<Objetivo>): Objetivo | undefined {
  const index = objetivos.findIndex(o => o.id === id);
  if (index === -1) return undefined;
  
  objetivos[index] = atualizarTimestamp({ ...objetivos[index], ...data });
  recalcularEAtualizar();
  return objetivos[index];
}

export function deleteObjetivo(id: string): boolean {
  const index = objetivos.findIndex(o => o.id === id);
  if (index === -1) return false;
  
  // Remover hábitos e tarefas vinculados
  habitos = habitos.filter(h => h.objetivoId !== id);
  tarefas = tarefas.filter(t => t.objetivoId !== id);
  
  objetivos.splice(index, 1);
  recalcularEAtualizar();
  return true;
}

export function deleteObjetivos(ids: string[]): number {
  let deleted = 0;
  ids.forEach(id => {
    if (deleteObjetivo(id)) deleted++;
  });
  return deleted;
}

// ==================== HÁBITOS ====================

export function getHabitos(): Habito[] {
  return [...habitos];
}

export function getHabitosByObjetivo(objetivoId: string): Habito[] {
  return habitos.filter(h => h.objetivoId === objetivoId);
}

export function getHabito(id: string): Habito | undefined {
  return habitos.find(h => h.id === id);
}

export function createHabito(data: Omit<Habito, 'id' | 'createdAt' | 'updatedAt'>): Habito {
  const novoHabito: Habito = {
    ...data,
    id: gerarId('hab'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  habitos.push(novoHabito);
  recalcularEAtualizar();
  return novoHabito;
}

export function updateHabito(id: string, data: Partial<Habito>): Habito | undefined {
  const index = habitos.findIndex(h => h.id === id);
  if (index === -1) return undefined;
  
  habitos[index] = atualizarTimestamp({ ...habitos[index], ...data });
  recalcularEAtualizar();
  return habitos[index];
}

export function deleteHabito(id: string): boolean {
  const index = habitos.findIndex(h => h.id === id);
  if (index === -1) return false;
  
  // Remover tarefas vinculadas
  tarefas = tarefas.filter(t => t.habitoId !== id);
  
  habitos.splice(index, 1);
  recalcularEAtualizar();
  return true;
}

export function deleteHabitos(ids: string[]): number {
  let deleted = 0;
  ids.forEach(id => {
    if (deleteHabito(id)) deleted++;
  });
  return deleted;
}

export function marcarHabitoFeito(id: string): Habito | undefined {
  const index = habitos.findIndex(h => h.id === id);
  if (index === -1) return undefined;
  
  habitos[index] = atualizarTimestamp({
    ...habitos[index],
    realizadosNoPeriodo: habitos[index].realizadosNoPeriodo + 1,
  });
  recalcularEAtualizar();
  return habitos[index];
}

export function resetarHabitoCiclo(id: string): Habito | undefined {
  const index = habitos.findIndex(h => h.id === id);
  if (index === -1) return undefined;
  
  habitos[index] = atualizarTimestamp({
    ...habitos[index],
    realizadosNoPeriodo: 0,
  });
  recalcularEAtualizar();
  return habitos[index];
}

// ==================== TAREFAS ====================

export function getTarefas(): Tarefa[] {
  return [...tarefas];
}

export function getTarefasByObjetivo(objetivoId: string): Tarefa[] {
  return tarefas.filter(t => t.objetivoId === objetivoId);
}

export function getTarefasByHabito(habitoId: string): Tarefa[] {
  return tarefas.filter(t => t.habitoId === habitoId);
}

export function getTarefa(id: string): Tarefa | undefined {
  return tarefas.find(t => t.id === id);
}

export function createTarefa(data: Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>): Tarefa {
  const novaTarefa: Tarefa = {
    ...data,
    id: gerarId('tar'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tarefas.push(novaTarefa);
  recalcularEAtualizar();
  return novaTarefa;
}

export function updateTarefa(id: string, data: Partial<Tarefa>): Tarefa | undefined {
  const index = tarefas.findIndex(t => t.id === id);
  if (index === -1) return undefined;
  
  tarefas[index] = atualizarTimestamp({ ...tarefas[index], ...data });
  recalcularEAtualizar();
  return tarefas[index];
}

export function deleteTarefa(id: string): boolean {
  const index = tarefas.findIndex(t => t.id === id);
  if (index === -1) return false;
  
  tarefas.splice(index, 1);
  recalcularEAtualizar();
  return true;
}

export function deleteTarefas(ids: string[]): number {
  let deleted = 0;
  ids.forEach(id => {
    if (deleteTarefa(id)) deleted++;
  });
  return deleted;
}
