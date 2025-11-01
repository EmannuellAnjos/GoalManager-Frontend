import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Edit, AlertCircle, Clock, MoreVertical, Trash2, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Tarefa, StatusTarefa, Prioridade } from '../lib/types';
import { getTarefasByHabito, updateTarefa, deleteTarefa } from '../lib/api';
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
  objetivoId: string;
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

export function TarefasKanbanLocal({ objetivoId, habitoId, onRefresh }: TarefasKanbanLocalProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <KanbanContent objetivoId={objetivoId} habitoId={habitoId} onRefresh={onRefresh} />
    </DndProvider>
  );
}

function KanbanContent({ objetivoId, habitoId, onRefresh }: TarefasKanbanLocalProps) {
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | undefined>();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [deleteDialogAberto, setDeleteDialogAberto] = useState(false);
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar tarefas quando o componente montar ou habitoId mudar
  useEffect(() => {
    const carregarTarefas = async () => {
      try {
        setLoading(true);
        const response = await getTarefasByHabito(habitoId);
        setTarefas(response.data || []);
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
    try {
      await updateTarefa(tarefaId, { status: novoStatus });
      toast.success('Status da tarefa atualizado!');
      // Recarregar a lista de tarefas
      const response = await getTarefasByHabito(habitoId);
      setTarefas(response.data || []);
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  const handleEditar = (tarefa: Tarefa) => {
    console.log('✏️ LOCAL: Clicou em editar tarefa:', tarefa.titulo);
    setTarefaEditando(tarefa);
    setDialogAberto(true);
  };

  const handleCriar = () => {
    setTarefaEditando(undefined);
    setDialogAberto(true);
  };

  const handleSalvar = async (data: Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (tarefaEditando) {
      try {
        await updateTarefa(tarefaEditando.id, data);
        toast.success('Tarefa atualizada com sucesso!');
        // Recarregar a lista de tarefas
        const response = await getTarefasByHabito(habitoId);
        setTarefas(response.data || []);
        onRefresh();
      } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        toast.error('Erro ao atualizar tarefa');
      }
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
        setTarefas(response.data || []);
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
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">Tarefas em Kanban</h4>
        <Button onClick={handleCriar} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Tarefa
        </Button>
      </div>

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
        objetivoIdPadrao={objetivoId}
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
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TAREFA',
    drop: (item: { id: string }) => onDrop(item.id, coluna.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop as any}
      className={`flex-shrink-0 w-72 bg-gray-50 rounded-lg p-3 ${
        isOver ? 'ring-2 ring-blue-500' : ''
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
    <Card
      ref={drag as any}
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
  );
}
