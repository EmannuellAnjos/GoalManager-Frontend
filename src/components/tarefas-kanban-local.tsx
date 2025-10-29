import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Edit, AlertCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Tarefa, StatusTarefa, Prioridade } from '../lib/types';
import { getTarefasByHabito, updateTarefa } from '../lib/api';
import { TarefaDialog } from './tarefa-dialog';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

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

  const tarefas = getTarefasByHabito(habitoId);

  const handleDrop = (tarefaId: string, novoStatus: StatusTarefa) => {
    updateTarefa(tarefaId, { status: novoStatus });
    toast.success('Status da tarefa atualizado!');
    onRefresh();
  };

  const handleEditar = (tarefa: Tarefa) => {
    setTarefaEditando(tarefa);
    setDialogAberto(true);
  };

  const handleSalvar = (data: Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (tarefaEditando) {
      updateTarefa(tarefaEditando.id, data);
      toast.success('Tarefa atualizada com sucesso!');
      onRefresh();
    }
  };

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
    </>
  );
}

interface KanbanColumnProps {
  coluna: { id: StatusTarefa; titulo: string };
  tarefas: Tarefa[];
  onDrop: (tarefaId: string, status: StatusTarefa) => void;
  onEdit: (tarefa: Tarefa) => void;
}

function KanbanColumn({ coluna, tarefas, onDrop, onEdit }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TAREFA',
    drop: (item: { id: string }) => onDrop(item.id, coluna.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
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
          <TarefaCard key={tarefa.id} tarefa={tarefa} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

interface TarefaCardProps {
  tarefa: Tarefa;
  onEdit: (tarefa: Tarefa) => void;
}

function TarefaCard({ tarefa, onEdit }: TarefaCardProps) {
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
      ref={drag}
      className={`p-3 cursor-move border-l-4 ${getPrioridadeCor(tarefa.prioridade)} ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h5 className="text-sm flex-1">{tarefa.titulo}</h5>
          <Button variant="ghost" size="sm" onClick={() => onEdit(tarefa)} className="h-6 w-6 p-0">
            <Edit className="h-3 w-3" />
          </Button>
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
