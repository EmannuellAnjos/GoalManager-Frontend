import { useState, useMemo, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Edit, AlertCircle, Clock, Search, Filter, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
import { Tarefa, StatusTarefa, Prioridade, Objetivo, Habito } from '../lib/types';
import { getTarefas, updateTarefa, getObjetivos, getHabitos, createTarefa, deleteTarefa } from '../lib/api';
import { TarefaDialog } from './tarefa-dialog';
import { toast } from 'sonner';

const COLUNAS: { id: StatusTarefa; titulo: string }[] = [
  { id: 'backlog', titulo: 'Backlog' },
  { id: 'a_fazer', titulo: 'A Fazer' },
  { id: 'fazendo', titulo: 'Fazendo' },
  { id: 'bloqueada', titulo: 'Bloqueada' },
  { id: 'concluida', titulo: 'Concluída' },
];

export function KanbanGlobal() {
  const [busca, setBusca] = useState('');
  const [filtroHabito, setFiltroHabito] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todos');
  const [filtroPrazo, setFiltroPrazo] = useState<string>('todos');
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | undefined>();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [deleteDialogAberto, setDeleteDialogAberto] = useState(false);
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<string | null>(null);
  
  // Estados para dados assíncronos
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [tarefasResponse, objetivosResponse, habitosResponse] = await Promise.all([
          getTarefas(),
          getObjetivos(),
          getHabitos(),
        ]);
        
        setTarefas(tarefasResponse.data);
        setObjetivos(objetivosResponse.data);
        setHabitos(habitosResponse.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const tarefasFiltradas = useMemo(() => {
    let resultado = [...tarefas];

    // Busca por texto
    if (busca) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter(
        (t) =>
          t.titulo.toLowerCase().includes(buscaLower) ||
          t.descricao?.toLowerCase().includes(buscaLower)
      );
    }

    // Filtro por hábito
    if (filtroHabito !== 'todos') {
      resultado = resultado.filter((t) => t.habitoId === filtroHabito);
    }

    // Filtro por prioridade
    if (filtroPrioridade !== 'todos') {
      resultado = resultado.filter((t) => t.prioridade === filtroPrioridade);
    }

    // Filtro por prazo
    if (filtroPrazo !== 'todos') {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      resultado = resultado.filter((t) => {
        if (!t.prazo) return false;
        const prazoDate = new Date(t.prazo);
        prazoDate.setHours(0, 0, 0, 0);

        switch (filtroPrazo) {
          case 'atrasado':
            return prazoDate < hoje && t.status !== 'concluida';
          case 'hoje':
            return prazoDate.getTime() === hoje.getTime();
          case 'semana':
            const umaSemana = new Date(hoje);
            umaSemana.setDate(umaSemana.getDate() + 7);
            return prazoDate >= hoje && prazoDate <= umaSemana;
          case 'mes':
            const umMes = new Date(hoje);
            umMes.setMonth(umMes.getMonth() + 1);
            return prazoDate >= hoje && prazoDate <= umMes;
          default:
            return true;
        }
      });
    }

    return resultado;
  }, [tarefas, busca, filtroHabito, filtroPrioridade, filtroPrazo]);

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
      setTarefas(prev => prev.map(tarefa => 
        tarefa.id === tarefaId ? response.data : tarefa
      ));
      
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
    console.log('✏️ Clicou em editar tarefa:', tarefa.titulo);
    setTarefaEditando(tarefa);
    setDialogAberto(true);
  };

  const handleDeletar = (tarefaId: string) => {
    console.log('🗑️ Clicou em deletar tarefa:', tarefaId);
    setTarefaParaDeletar(tarefaId);
    setDeleteDialogAberto(true);
  };

  const confirmarDeletar = async () => {
    if (tarefaParaDeletar) {
      try {
        await deleteTarefa(tarefaParaDeletar);
        setTarefas(prev => prev.filter(t => t.id !== tarefaParaDeletar));
        toast.success('Tarefa excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        toast.error('Erro ao excluir tarefa');
      }
    }
    setDeleteDialogAberto(false);
    setTarefaParaDeletar(null);
  };

  const handleCriar = () => {
    setTarefaEditando(undefined);
    setDialogAberto(true);
  };

  const handleSalvar = async (data: Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (tarefaEditando) {
        const response = await updateTarefa(tarefaEditando.id, data);
        setTarefas(prev => prev.map(tarefa => 
          tarefa.id === tarefaEditando.id ? response.data : tarefa
        ));
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        const response = await createTarefa(data);
        setTarefas(prev => [...prev, response.data]);
        toast.success('Tarefa criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error('Erro ao salvar tarefa');
    }
  };

  const limparFiltros = () => {
    setBusca('');
    setFiltroHabito('todos');
    setFiltroPrioridade('todos');
    setFiltroPrazo('todos');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tarefas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCriar}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filtroHabito} onValueChange={setFiltroHabito}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Hábito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Hábitos</SelectItem>
              {habitos.map((hab) => (
                <SelectItem key={hab.id} value={hab.id}>
                  {hab.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Prioridades</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroPrazo} onValueChange={setFiltroPrazo}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Prazo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Prazos</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
            </SelectContent>
          </Select>

          {(busca || filtroHabito !== 'todos' || 
            filtroPrioridade !== 'todos' || filtroPrazo !== 'todos') && (
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          Mostrando {tarefasFiltradas.length} de {tarefas.length} tarefas
        </div>
      </div>

      {/* Kanban Board */}
      <DndProvider backend={HTML5Backend}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUNAS.map((coluna) => (
            <KanbanColumn
              key={coluna.id}
              coluna={coluna}
              tarefas={tarefasFiltradas.filter((t) => t.status === coluna.id)}
              onDrop={handleDrop}
              onEdit={handleEditar}
              onDelete={handleDeletar}
              objetivos={objetivos}
              habitos={habitos}
            />
          ))}
        </div>
      </DndProvider>

      {/* Dialog */}
      <TarefaDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        tarefa={tarefaEditando}
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
    </div>
  );
}

interface KanbanColumnProps {
  coluna: { id: StatusTarefa; titulo: string };
  tarefas: Tarefa[];
  onDrop: (tarefaId: string, status: StatusTarefa) => void;
  onEdit: (tarefa: Tarefa) => void;
  onDelete: (tarefaId: string) => void;
  objetivos: any[];
  habitos: any[];
}

function KanbanColumn({ coluna, tarefas, onDrop, onEdit, onDelete, objetivos, habitos }: KanbanColumnProps) {
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
      className={`flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4 transition-colors ${
        isOver && canDrop ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">{coluna.titulo}</h3>
        <Badge variant="secondary">{tarefas.length}</Badge>
      </div>
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {tarefas.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-8">
            Nenhuma tarefa
          </div>
        ) : (
          tarefas.map((tarefa) => (
            <TarefaCard
              key={tarefa.id}
              tarefa={tarefa}
              onEdit={onEdit}
              onDelete={onDelete}
              objetivos={objetivos}
              habitos={habitos}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TarefaCardProps {
  tarefa: Tarefa;
  onEdit: (tarefa: Tarefa) => void;
  onDelete: (tarefaId: string) => void;
  objetivos: any[];
  habitos: any[];
}

function TarefaCard({ tarefa, onEdit, onDelete, objetivos, habitos }: TarefaCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TAREFA',
    item: { id: tarefa.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const habito = habitos.find((h) => h.id === tarefa.habitoId);

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
        className={`p-4 cursor-move border-l-4 ${getPrioridadeCor(tarefa.prioridade)} ${
          isDragging ? 'opacity-50' : ''
        } hover:shadow-md transition-shadow`}
      >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h5 className="flex-1">{tarefa.titulo}</h5>
          <DropdownMenu onOpenChange={(open: boolean) => open && console.log('🎯 GLOBAL: Menu abriu!')}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                console.log('✏️ GLOBAL: Clicou em EDITAR');
                onEdit(tarefa);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  console.log('🗑️ GLOBAL: Clicou em EXCLUIR');
                  onDelete(tarefa.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {tarefa.descricao && (
          <p className="text-sm text-gray-600 line-clamp-2">{tarefa.descricao}</p>
        )}

        {habito && (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {habito.titulo}
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Progress value={tarefa.progresso} className="flex-1 h-2" />
          <span className="text-sm text-gray-600">{tarefa.progresso}%</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          {tarefa.prazo && (
            <div className={`flex items-center gap-1 ${isPrazoAtrasado() ? 'text-red-600' : 'text-gray-500'}`}>
              {isPrazoAtrasado() && <AlertCircle className="h-4 w-4" />}
              <Clock className="h-4 w-4" />
              <span>{new Date(tarefa.prazo).toLocaleDateString()}</span>
            </div>
          )}
          {tarefa.estimativaHoras && (
            <span className="text-gray-500">
              {tarefa.horasGastas || 0}h / {tarefa.estimativaHoras}h
            </span>
          )}
        </div>
      </div>
    </Card>
    </div>
  );
}
