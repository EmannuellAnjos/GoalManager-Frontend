import { useState, useMemo } from 'react';
import { Edit, Trash2, MoreVertical, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
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
import { Tarefa, StatusTarefa, Prioridade } from '../lib/types';
import { getTarefasByHabito, updateTarefa, deleteTarefa, createTarefa } from '../lib/api';
import { TarefaDialog } from './tarefa-dialog';
import { toast } from 'sonner@2.0.3';

interface TarefasTableProps {
  objetivoId: string;
  habitoId: string;
  onRefresh: () => void;
}

export function TarefasTable({ objetivoId, habitoId, onRefresh }: TarefasTableProps) {
  const [selectedTarefas, setSelectedTarefas] = useState<Set<string>>(new Set());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | undefined>();
  const [deleteDialogAberto, setDeleteDialogAberto] = useState(false);
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);

  const tarefas = getTarefasByHabito(habitoId);

  const toggleSelected = (id: string) => {
    const newSet = new Set(selectedTarefas);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTarefas(newSet);
  };

  const handleEditar = (tarefa: Tarefa) => {
    setTarefaEditando(tarefa);
    setDialogAberto(true);
  };

  const handleSalvar = (data: Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (tarefaEditando) {
      updateTarefa(tarefaEditando.id, data);
      toast.success('Tarefa atualizada com sucesso!');
    } else {
      createTarefa(data);
      toast.success('Tarefa criada com sucesso!');
    }
    onRefresh();
  };

  const handleDeletar = (id: string) => {
    setTarefaParaDeletar(id);
    setDeleteDialogAberto(true);
  };

  const confirmarDeletar = () => {
    if (tarefaParaDeletar) {
      deleteTarefa(tarefaParaDeletar);
      toast.success('Tarefa excluída com sucesso!');
      onRefresh();
    }
    setDeleteDialogAberto(false);
    setTarefaParaDeletar(null);
  };

  const getStatusBadge = (status: StatusTarefa) => {
    const variants: Record<StatusTarefa, string> = {
      backlog: 'bg-gray-100 text-gray-800',
      a_fazer: 'bg-blue-100 text-blue-800',
      fazendo: 'bg-yellow-100 text-yellow-800',
      bloqueada: 'bg-red-100 text-red-800',
      concluida: 'bg-green-100 text-green-800',
    };
    const labels: Record<StatusTarefa, string> = {
      backlog: 'Backlog',
      a_fazer: 'A Fazer',
      fazendo: 'Fazendo',
      bloqueada: 'Bloqueada',
      concluida: 'Concluída',
    };
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  const getPrioridadeBadge = (prioridade?: Prioridade) => {
    if (!prioridade) return null;
    const variants: Record<Prioridade, string> = {
      baixa: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-red-100 text-red-800',
    };
    const labels: Record<Prioridade, string> = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
    };
    return <Badge className={variants[prioridade]}>{labels[prioridade]}</Badge>;
  };

  const isPrazoAtrasado = (prazo?: string) => {
    if (!prazo) return false;
    return new Date(prazo) < new Date();
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
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={tarefas.length > 0 && selectedTarefas.size === tarefas.length}
                  onCheckedChange={() => {
                    if (selectedTarefas.size === tarefas.length) {
                      setSelectedTarefas(new Set());
                    } else {
                      setSelectedTarefas(new Set(tarefas.map((t) => t.id)));
                    }
                  }}
                />
              </TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tarefas.map((tarefa) => (
              <TableRow key={tarefa.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTarefas.has(tarefa.id)}
                    onCheckedChange={() => toggleSelected(tarefa.id)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div>{tarefa.titulo}</div>
                    {tarefa.descricao && (
                      <div className="text-sm text-gray-500">{tarefa.descricao}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getPrioridadeBadge(tarefa.prioridade)}</TableCell>
                <TableCell>{getStatusBadge(tarefa.status)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Progress value={tarefa.progresso} className="flex-1" />
                      <span className="text-sm">{tarefa.progresso}%</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {tarefa.prazo && (
                    <div className={`flex items-center gap-1 ${isPrazoAtrasado(tarefa.prazo) && tarefa.status !== 'concluida' ? 'text-red-600' : ''}`}>
                      {isPrazoAtrasado(tarefa.prazo) && tarefa.status !== 'concluida' && (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm">
                        {new Date(tarefa.prazo).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditar(tarefa)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeletar(tarefa.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <TarefaDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        tarefa={tarefaEditando}
        objetivoIdPadrao={objetivoId}
        habitoIdPadrao={habitoId}
        onSave={handleSalvar}
      />

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
