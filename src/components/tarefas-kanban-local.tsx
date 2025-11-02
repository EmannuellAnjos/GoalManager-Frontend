import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Edit, AlertCircle, Clock, MoreVertical, Trash2, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Tarefa, StatusTarefa, Prioridade } from '../lib/types';
import { getTarefasByHabito, updateTarefa, deleteTarefa, createTarefa } from '../lib/api';
import { TarefaDialog } from './tarefa-dialog';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface TarefasKanbanLocalProps {
  habitoId: string;
  onRefresh: () => void;
}

const COLUNAS: { id: StatusTarefa; titulo: string }[] = [
  { id: 'backlog', titulo: 'Backlog' },
  { id: 'a_fazer', titulo: 'A Fazer' },
  { id: 'fazendo', titulo: 'Fazendo' },
  { id: 'bloqueada', titulo: 'Bloqueada' },
  { id: 'concluida', titulo: 'Concluída' },
];

export function TarefasKanbanLocal({ habitoId, onRefresh }: TarefasKanbanLocalProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <KanbanContent habitoId={habitoId} onRefresh={onRefresh} />
    </DndProvider>
  );
}

function KanbanContent({ habitoId, onRefresh }: TarefasKanbanLocalProps) {
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | undefined>();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [deleteDialogAberto, setDeleteDialogAberto] = useState(false);
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para normalizar tarefas (garantir habitoId e campos numéricos)
  const normalizarTarefa = (t: Tarefa): Tarefa => ({
    ...t,
    habitoId: t.habitoId || habitoId,
    // Preservar estimativaHoras e horasGastas mesmo se forem 0 ou null
    estimativaHoras: t.estimativaHoras !== null && t.estimativaHoras !== undefined 
      ? (typeof t.estimativaHoras === 'string' ? parseFloat(t.estimativaHoras) : Number(t.estimativaHoras))
      : undefined,
    horasGastas: t.horasGastas !== null && t.horasGastas !== undefined
      ? (typeof t.horasGastas === 'string' ? parseFloat(t.horasGastas) : Number(t.horasGastas))
      : undefined
  });

  // Carregar tarefas quando o componente montar ou habitoId mudar
  useEffect(() => {
    const carregarTarefas = async () => {
      try {
        setLoading(true);
        const response = await getTarefasByHabito(habitoId);
        // Normalizar todas as tarefas
        const tarefasComHabitoId = (response.data || []).map(normalizarTarefa);
        setTarefas(tarefasComHabitoId);
      } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        setTarefas([]);
      } finally {
        setLoading(false);
      }
    };

    carregarTarefas();
  }, [habitoId]);

  const handleDrop = async (tarefaId: string, novoStatus: StatusTarefa) => {
    // Encontrar a tarefa que está sendo movida
    const tarefaMovida = tarefas.find(t => t.id === tarefaId);
    if (!tarefaMovida) return;

    // Verificar se o status realmente mudou
    if (tarefaMovida.status === novoStatus) return;

    // Salvar o estado anterior para reversão em caso de erro
    const statusAnterior = tarefaMovida.status;
    
    // Atualização otimista: mover o card visualmente imediatamente
    setTarefas(prev => prev.map(tarefa => 
      tarefa.id === tarefaId ? { ...tarefa, status: novoStatus } : tarefa
    ));

    try {
      // Fazer a requisição PUT apenas com o campo status
      const response = await updateTarefa(tarefaId, { status: novoStatus });
      
      // Atualizar com os dados retornados do servidor
      const tarefaAtualizada = normalizarTarefa(response.data);
      setTarefas(prev => prev.map(tarefa => 
        tarefa.id === tarefaId ? tarefaAtualizada : tarefa
      ));
      
      // Notificar o componente pai para recarregar se necessário
      onRefresh();
      
      // Não mostrar toast em caso de sucesso silencioso (opcional)
      // toast.success('Status da tarefa atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      
      // Reverter o movimento em caso de erro
      setTarefas(prev => prev.map(tarefa => 
        tarefa.id === tarefaId ? { ...tarefa, status: statusAnterior } : tarefa
      ));
      
      toast.error('Erro ao atualizar status da tarefa. Movimento revertido.');
    }
  };

  const handleEditar = (tarefa: Tarefa) => {
    console.log('✏️ LOCAL: Clicou em editar tarefa:', tarefa.titulo);
    // Garantir que a tarefa tenha habitoId
    const tarefaComHabitoId = {
      ...tarefa,
      habitoId: tarefa.habitoId || habitoId
    };
    setTarefaEditando(tarefaComHabitoId);
    setDialogAberto(true);
  };

  const handleSalvar = async (data: Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (tarefaEditando) {
        await updateTarefa(tarefaEditando.id, data);
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        await createTarefa(data);
        toast.success('Tarefa criada com sucesso!');
      }
      // Recarregar a lista de tarefas
      const response = await getTarefasByHabito(habitoId);
      const tarefasComHabitoId = (response.data || []).map(normalizarTarefa);
      setTarefas(tarefasComHabitoId);
      setTarefaEditando(undefined);
      setDialogAberto(false);
      onRefresh();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error('Erro ao salvar tarefa');
    }
  };

  const handleDeletar = (tarefaId: string) => {
    console.log('🗑️ LOCAL: Clicou em deletar tarefa:', tarefaId);
    setTarefaParaDeletar(tarefaId);
    setDeleteDialogAberto(true);
  };

  const confirmarDeletar = async () => {
    if (tarefaParaDeletar) {
      try {
        await deleteTarefa(tarefaParaDeletar);
        // Recarregar a lista de tarefas
        const response = await getTarefasByHabito(habitoId);
        const tarefasComHabitoId = (response.data || []).map((t: Tarefa) => ({
          ...t,
          habitoId: t.habitoId || habitoId
        }));
        setTarefas(tarefasComHabitoId);
        toast.success('Tarefa excluída com sucesso!');
        onRefresh();
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        toast.error('Erro ao excluir tarefa');
      }
    }
    setDeleteDialogAberto(false);
    setTarefaParaDeletar(null);
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        Carregando tarefas...
      </div>
    );
  }

  if (tarefas.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        Nenhuma tarefa neste hábito
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUNAS.map((coluna) => (
          <KanbanColumn
            key={coluna.id}
            coluna={coluna}
            tarefas={tarefas.filter((t) => t.status === coluna.id)}
            onDrop={handleDrop}
            onEdit={handleEditar}
            onDelete={handleDeletar}
          />
        ))}
      </div>

      <TarefaDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        tarefa={tarefaEditando}
        habitoIdPadrao={habitoId}
        onSave={handleSalvar}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogAberto} onOpenChange={setDeleteDialogAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarDeletar} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface KanbanColumnProps {
  coluna: { id: StatusTarefa; titulo: string };
  tarefas: Tarefa[];
  onDrop: (tarefaId: string, status: StatusTarefa) => void;
  onEdit: (tarefa: Tarefa) => void;
  onDelete: (tarefaId: string) => void;
}

function KanbanColumn({ coluna, tarefas, onDrop, onEdit, onDelete }: KanbanColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'TAREFA',
    drop: (item: { id: string }) => onDrop(item.id, coluna.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop as any}
      className={`flex-shrink-0 w-72 bg-gray-50 rounded-lg p-3 transition-colors ${
        isOver && canDrop ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">{coluna.titulo}</h4>
        <Badge variant="secondary">{tarefas.length}</Badge>
      </div>
      <div className="space-y-2">
        {tarefas.map((tarefa) => (
          <TarefaCard key={tarefa.id} tarefa={tarefa} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

interface TarefaCardProps {
  tarefa: Tarefa;
  onEdit: (tarefa: Tarefa) => void;
  onDelete: (tarefaId: string) => void;
}

function TarefaCard({ tarefa, onEdit, onDelete }: TarefaCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TAREFA',
    item: { id: tarefa.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getPrioridadeCor = (prioridade?: Prioridade) => {
    if (!prioridade) return 'border-l-gray-300';
    const cores: Record<Prioridade, string> = {
      baixa: 'border-l-green-500',
      media: 'border-l-yellow-500',
      alta: 'border-l-red-500',
    };
    return cores[prioridade];
  };

  const isPrazoAtrasado = () => {
    if (!tarefa.prazo || tarefa.status === 'concluida') return false;
    return new Date(tarefa.prazo) < new Date();
  };

  return (
    <div ref={drag as any}>
      <Card
        className={`p-3 cursor-move border-l-4 ${getPrioridadeCor(tarefa.prioridade)} ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h5 className="text-sm flex-1">{tarefa.titulo}</h5>
          <DropdownMenu onOpenChange={(open: boolean) => open && console.log('🏠 LOCAL: Menu abriu!')}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                console.log('✏️ LOCAL: Clicou em EDITAR');
                onEdit(tarefa);
              }}>
                <Edit className="h-3 w-3 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  console.log('🗑️ LOCAL: Clicou em EXCLUIR');
                  onDelete(tarefa.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {tarefa.descricao && (
          <p className="text-xs text-gray-500 line-clamp-2">{tarefa.descricao}</p>
        )}

        <div className="flex items-center gap-1">
          <Progress value={tarefa.progresso} className="flex-1 h-1" />
          <span className="text-xs text-gray-500">{tarefa.progresso}%</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          {tarefa.prazo && (
            <div className={`flex items-center gap-1 ${isPrazoAtrasado() ? 'text-red-600' : ''}`}>
              {isPrazoAtrasado() && <AlertCircle className="h-3 w-3" />}
              <Clock className="h-3 w-3" />
              <span>{new Date(tarefa.prazo).toLocaleDateString()}</span>
            </div>
          )}
          {tarefa.estimativaHoras && (
            <span>{tarefa.horasGastas || 0}h / {tarefa.estimativaHoras}h</span>
          )}
        </div>
      </div>
    </Card>
    </div>
  );
}
