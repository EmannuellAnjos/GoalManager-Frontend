import { useState, useMemo, useEffect } from 'react';
import { Edit, Trash2, MoreVertical, AlertCircle, Plus } from 'lucide-react';
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
import { toast } from 'sonner';

interface TarefasTableProps {
  habitoId: string;
  onRefresh: () => void;
}

export function TarefasTable({ habitoId, onRefresh }: TarefasTableProps) {
  const [selectedTarefas, setSelectedTarefas] = useState<Set<string>>(new Set());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | undefined>();
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

  const handleDeletar = (id: string) => {
    setTarefaParaDeletar(id);
    setDeleteDialogAberto(true);
  };

  const confirmarDeletar = async () => {
    if (tarefaParaDeletar) {
      try {
        await deleteTarefa(tarefaParaDeletar);
        toast.success('Tarefa excluída com sucesso!');
        // Recarregar a lista de tarefas
        const response = await getTarefasByHabito(habitoId);
        const tarefasComHabitoId = (response.data || []).map((t: Tarefa) => ({
          ...t,
          habitoId: t.habitoId || habitoId
        }));
        setTarefas(tarefasComHabitoId);
        onRefresh();
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        toast.error('Erro ao excluir tarefa');
      }
    }
    setDeleteDialogAberto(false);
    setTarefaParaDeletar(null);
  };

  const getStatusBadge = (status: StatusTarefa, prazo?: string) => {
    const isAtrasada = prazo && isPrazoAtrasado(prazo) && status !== 'concluida';
    const variants: Record<StatusTarefa, string> = {
      backlog: 'bg-gray-100 text-gray-800',
      a_fazer: isAtrasada ? 'text-white' : 'bg-blue-100 text-blue-800',
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
    const bgColors: Record<StatusTarefa, string> = {
      backlog: '#757575',
      a_fazer: isAtrasada ? '#E53935' : '#42A5F5',
      fazendo: '#FFD54F',
      bloqueada: '#E53935',
      concluida: '#4CAF50',
    };
    return (
      <Badge 
        className={variants[status]} 
        style={isAtrasada ? { backgroundColor: bgColors[status] } : {}}
      >
        {labels[status]}
      </Badge>
    );
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
      <div className="border-2 rounded-lg shadow-sm" style={{ 
        backgroundColor: '#F5F5F5', 
        borderColor: '#E0E0E0' 
      }}>
        <Table>
          <TableHeader>
            <TableRow className="hover:opacity-90" style={{ backgroundColor: '#F5F5F5' }}>
              <TableHead className="w-12 p-3" style={{ color: '#333333' }}>
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
              <TableHead className="p-3" style={{ color: '#333333', fontWeight: 600 }}>Título</TableHead>
              <TableHead className="p-3" style={{ color: '#333333', fontWeight: 600 }}>Prioridade</TableHead>
              <TableHead className="p-3" style={{ color: '#333333', fontWeight: 600 }}>Status</TableHead>
              <TableHead className="p-3" style={{ color: '#333333', fontWeight: 600 }}>Progresso</TableHead>
              <TableHead className="p-3" style={{ color: '#333333', fontWeight: 600 }}>Prazo</TableHead>
              <TableHead className="w-12 p-3" style={{ color: '#333333' }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tarefas.map((tarefa) => (
              <TableRow 
                key={tarefa.id}
                className="hover:opacity-90 transition-opacity" 
                style={{ backgroundColor: '#F5F5F5', color: '#333333' }}
              >
                <TableCell className="p-3">
                  <Checkbox
                    checked={selectedTarefas.has(tarefa.id)}
                    onCheckedChange={() => toggleSelected(tarefa.id)}
                  />
                </TableCell>
                <TableCell className="p-3">
                  <div>
                    <div style={{ color: '#333333', fontWeight: 600 }}>{tarefa.titulo}</div>
                    {tarefa.descricao && (
                      <div className="text-sm" style={{ color: '#6B6B6B' }}>{tarefa.descricao}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-3">{getPrioridadeBadge(tarefa.prioridade)}</TableCell>
                <TableCell className="p-3">{getStatusBadge(tarefa.status, tarefa.prazo)}</TableCell>
                <TableCell className="p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{
                            width: `${tarefa.progresso}%`,
                            background: 'linear-gradient(to right, #FFD54F, #FBC02D)'
                          }}
                        />
                      </div>
                      <span className="text-sm" style={{ color: '#333333' }}>{tarefa.progresso}%</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-3">
                  {tarefa.prazo && (
                    <div className="flex items-center gap-1" style={{ 
                      color: isPrazoAtrasado(tarefa.prazo) && tarefa.status !== 'concluida' ? '#E53935' : '#333333'
                    }}>
                      {isPrazoAtrasado(tarefa.prazo) && tarefa.status !== 'concluida' && (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm">
                        {new Date(tarefa.prazo).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="p-3">
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
