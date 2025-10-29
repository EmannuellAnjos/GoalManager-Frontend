import { useState, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Edit, AlertCircle, Clock, Search, Filter, Plus } from 'lucide-react';
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
import { Tarefa, StatusTarefa, Prioridade } from '../lib/types';
import { getTarefas, updateTarefa, getObjetivos, getHabitos, createTarefa } from '../lib/api';
import { TarefaDialog } from './tarefa-dialog';
import { toast } from 'sonner@2.0.3';

const COLUNAS: { id: StatusTarefa; titulo: string }[] = [
  { id: 'backlog', titulo: 'Backlog' },
  { id: 'a_fazer', titulo: 'A Fazer' },
  { id: 'fazendo', titulo: 'Fazendo' },
  { id: 'bloqueada', titulo: 'Bloqueada' },
  { id: 'concluida', titulo: 'Concluída' },
];

export function KanbanGlobal() {
  const [busca, setBusca] = useState('');
  const [filtroObjetivo, setFiltroObjetivo] = useState<string>('todos');
  const [filtroHabito, setFiltroHabito] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todos');
  const [filtroPrazo, setFiltroPrazo] = useState<string>('todos');
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | undefined>();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [, setRefresh] = useState(0);

  const tarefas = getTarefas();
  const objetivos = getObjetivos();
  const habitos = getHabitos();

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

    // Filtro por objetivo
    if (filtroObjetivo !== 'todos') {
      resultado = resultado.filter((t) => t.objetivoId === filtroObjetivo);
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
  }, [tarefas, busca, filtroObjetivo, filtroHabito, filtroPrioridade, filtroPrazo]);

  const habitosFiltrados = useMemo(() => {
    if (filtroObjetivo === 'todos') return habitos;
    return habitos.filter((h) => h.objetivoId === filtroObjetivo);
  }, [habitos, filtroObjetivo]);

  const handleDrop = (tarefaId: string, novoStatus: StatusTarefa) => {
    updateTarefa(tarefaId, { status: novoStatus });
    toast.success('Status da tarefa atualizado!');
    setRefresh((r) => r + 1);
  };

  const handleEditar = (tarefa: Tarefa) => {
    setTarefaEditando(tarefa);
    setDialogAberto(true);
  };

  const handleCriar = () => {
    setTarefaEditando(undefined);
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
    setRefresh((r) => r + 1);
  };

  const limparFiltros = () => {
    setBusca('');
    setFiltroObjetivo('todos');
    setFiltroHabito('todos');
    setFiltroPrioridade('todos');
    setFiltroPrazo('todos');
  };

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
          <Select value={filtroObjetivo} onValueChange={setFiltroObjetivo}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Objetivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Objetivos</SelectItem>
              {objetivos.map((obj) => (
                <SelectItem key={obj.id} value={obj.id}>
                  {obj.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroHabito} onValueChange={setFiltroHabito}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Hábito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Hábitos</SelectItem>
              {habitosFiltrados.map((hab) => (
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

          {(busca || filtroObjetivo !== 'todos' || filtroHabito !== 'todos' || 
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
    </div>
  );
}

interface KanbanColumnProps {
  coluna: { id: StatusTarefa; titulo: string };
  tarefas: Tarefa[];
  onDrop: (tarefaId: string, status: StatusTarefa) => void;
  onEdit: (tarefa: Tarefa) => void;
  objetivos: any[];
  habitos: any[];
}

function KanbanColumn({ coluna, tarefas, onDrop, onEdit, objetivos, habitos }: KanbanColumnProps) {
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
      className={`flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4 ${
        isOver ? 'ring-2 ring-blue-500' : ''
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
  objetivos: any[];
  habitos: any[];
}

function TarefaCard({ tarefa, onEdit, objetivos, habitos }: TarefaCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TAREFA',
    item: { id: tarefa.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const objetivo = objetivos.find((o) => o.id === tarefa.objetivoId);
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
    <Card
      ref={drag}
      className={`p-4 cursor-move border-l-4 ${getPrioridadeCor(tarefa.prioridade)} ${
        isDragging ? 'opacity-50' : ''
      } hover:shadow-md transition-shadow`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h5 className="flex-1">{tarefa.titulo}</h5>
          <Button variant="ghost" size="sm" onClick={() => onEdit(tarefa)} className="h-7 w-7 p-0">
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        {tarefa.descricao && (
          <p className="text-sm text-gray-600 line-clamp-2">{tarefa.descricao}</p>
        )}

        {(objetivo || habito) && (
          <div className="flex flex-wrap gap-1">
            {objetivo && (
              <Badge variant="outline" className="text-xs">
                {objetivo.titulo}
              </Badge>
            )}
            {habito && (
              <Badge variant="outline" className="text-xs">
                {habito.titulo}
              </Badge>
            )}
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
  );
}
