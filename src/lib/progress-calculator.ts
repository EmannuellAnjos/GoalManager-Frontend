import { Objetivo, Habito, Tarefa } from './types';

/**
 * Calcula o progresso de um hábito baseado em realizados vs alvo
 */
export function calcularProgressoHabito(habito: Habito): number {
  const progresso = (habito.realizadosNoPeriodo / habito.alvoPorPeriodo) * 100;
  return Math.min(Math.max(Math.round(progresso), 0), 100);
}

/**
 * Calcula o progresso de um objetivo baseado em seus hábitos e tarefas
 */
export function calcularProgressoObjetivo(
  objetivo: Objetivo,
  habitos: Habito[],
  tarefas: Tarefa[]
): number {
  const habitosDoObjetivo = habitos.filter(h => h.objetivoId === objetivo.id);
  const tarefasDoObjetivo = tarefas.filter(t => t.objetivoId === objetivo.id);

  if (habitosDoObjetivo.length === 0 && tarefasDoObjetivo.length === 0) {
    return 0;
  }

  let somaProgresso = 0;
  let totalItens = 0;

  // Adiciona progresso dos hábitos
  habitosDoObjetivo.forEach(habito => {
    somaProgresso += habito.progresso;
    totalItens++;
  });

  // Adiciona progresso das tarefas
  tarefasDoObjetivo.forEach(tarefa => {
    somaProgresso += tarefa.progresso;
    totalItens++;
  });

  return totalItens > 0 ? Math.round(somaProgresso / totalItens) : 0;
}

/**
 * Atualiza o progresso de uma tarefa quando seu status muda
 */
export function atualizarProgressoTarefa(tarefa: Tarefa): number {
  if (tarefa.status === 'concluida') {
    return 100;
  }
  // Se não está concluída, mantém o progresso atual (não força a 0)
  return tarefa.progresso;
}

/**
 * Recalcula todos os progressos (tarefas -> hábitos -> objetivos)
 */
export function recalcularTodosProgressos(
  objetivos: Objetivo[],
  habitos: Habito[],
  tarefas: Tarefa[]
): { objetivos: Objetivo[]; habitos: Habito[]; tarefas: Tarefa[] } {
  // 1. Atualizar tarefas (status concluída = 100%)
  const tarefasAtualizadas = tarefas.map(tarefa => ({
    ...tarefa,
    progresso: atualizarProgressoTarefa(tarefa),
  }));

  // 2. Atualizar hábitos
  const habitosAtualizados = habitos.map(habito => ({
    ...habito,
    progresso: calcularProgressoHabito(habito),
  }));

  // 3. Atualizar objetivos
  const objetivosAtualizados = objetivos.map(objetivo => ({
    ...objetivo,
    progresso: calcularProgressoObjetivo(objetivo, habitosAtualizados, tarefasAtualizadas),
  }));

  return {
    objetivos: objetivosAtualizados,
    habitos: habitosAtualizados,
    tarefas: tarefasAtualizadas,
  };
}
