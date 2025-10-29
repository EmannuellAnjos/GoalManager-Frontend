import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, Search, Filter, MoreVertical, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
import { Objetivo, Habito, Tarefa, StatusObjetivo } from '../lib/types';
import { 
  getObjetivos, 
  getHabitos, 
  getTarefas,
  updateObjetivo,
  deleteObjetivo,
  createObjetivo,
  deleteObjetivos,
} from '../lib/api';
import { ObjetivoDialog } from './objetivo-dialog';
import { HabitosExpandedRow } from './habitos-expanded-row';
import { toast } from 'sonner@2.0.3';

export function ObjetivosView() {
  const [expandedObjetivos, setExpandedObjetivos] = useState<Set<string>>(new Set());
  const [selectedObjetivos, setSelectedObjetivos] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [ordenacao, setOrdenacao] = useState<{ campo: string; direcao: 'asc' | 'desc' }>({
    campo: 'updatedAt',
    direcao: 'desc',
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 50;

  const [dialogAberto, setDialogAberto] = useState(false);
  const [objetivoEditando, setObjetivoEditando] = useState<Objetivo | undefined>();
  const [deleteDialogAberto, setDeleteDialogAberto] = useState(false);
  const [objetivoParaDeletar, setObjetivoParaDeletar] = useState<string | null>(null);
  const [, setRefresh] = useState(0);

  const objetivos = getObjetivos();
  const habitos = getHabitos();
  const tarefas = getTarefas();

  const objetivosFiltrados = useMemo(() => {
    let resultado = [...objetivos];

    // Busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter(
        (obj) =>
          obj.titulo.toLowerCase().includes(buscaLower) ||
          obj.descricao?.toLowerCase().includes(buscaLower)
      );
    }

    // Filtro de status
    if (filtroStatus !== 'todos') {
      resultado = resultado.filter((obj) => obj.status === filtroStatus);
    }

    // Ordenação
    resultado.sort((a, b) => {
      let valorA: any = a[ordenacao.campo as keyof Objetivo];
      let valorB: any = b[ordenacao.campo as keyof Objetivo];

      if (typeof valorA === 'string') valorA = valorA.toLowerCase();
      if (typeof valorB === 'string') valorB = valorB.toLowerCase();

      if (valorA < valorB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });

    return resultado;
  }, [objetivos, busca, filtroStatus, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(objetivosFiltrados.length / itensPorPagina);
  const objetivosPaginados = objetivosFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedObjetivos);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedObjetivos(newSet);
  };

  const toggleSelected = (id: string) => {
    const newSet = new Set(selectedObjetivos);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedObjetivos(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedObjetivos.size === objetivosPaginados.length) {
      setSelectedObjetivos(new Set());
    } else {
      setSelectedObjetivos(new Set(objetivosPaginados.map((obj) => obj.id)));
    }
  };

  const handleCriar = () => {
    setObjetivoEditando(undefined);
    setDialogAberto(true);
  };

  const handleEditar = (objetivo: Objetivo) => {
    setObjetivoEditando(objetivo);
    setDialogAberto(true);
  };

  const handleSalvar = (data: Omit<Objetivo, 'id' | 'createdAt' | 'updatedAt' | 'progresso'>) => {
    if (objetivoEditando) {
      updateObjetivo(objetivoEditando.id, data);
      toast.success('Objetivo atualizado com sucesso!');
    } else {
      createObjetivo({ ...data, progresso: 0 });
      toast.success('Objetivo criado com sucesso!');
    }
    setRefresh((r) => r + 1);
  };

  const handleDeletar = (id: string) => {
    setObjetivoParaDeletar(id);
    setDeleteDialogAberto(true);
  };

  const confirmarDeletar = () => {
    if (objetivoParaDeletar) {
      deleteObjetivo(objetivoParaDeletar);
      toast.success('Objetivo excluído com sucesso!');
      setRefresh((r) => r + 1);
    }
    setDeleteDialogAberto(false);
    setObjetivoParaDeletar(null);
  };

  const handleDeletarSelecionados = () => {
    const count = deleteObjetivos(Array.from(selectedObjetivos));
    toast.success(`${count} objetivo(s) excluído(s) com sucesso!`);
    setSelectedObjetivos(new Set());
    setRefresh((r) => r + 1);
  };

  const getStatusBadge = (status: StatusObjetivo) => {
    const variants: Record<StatusObjetivo, string> = {
      planejado: 'bg-blue-100 text-blue-800',
      em_andamento: 'bg-yellow-100 text-yellow-800',
      concluido: 'bg-green-100 text-green-800',
      arquivado: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<StatusObjetivo, string> = {
      planejado: 'Planejado',
      em_andamento: 'Em Andamento',
      concluido: 'Concluído',
      arquivado: 'Arquivado',
    };
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho e Filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar objetivos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="planejado">Planejado</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="arquivado">Arquivado</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleCriar}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Objetivo
          </Button>

          {selectedObjetivos.size > 0 && (
            <Button variant="destructive" onClick={handleDeletarSelecionados}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir ({selectedObjetivos.size})
            </Button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    objetivosPaginados.length > 0 &&
                    selectedObjetivos.size === objetivosPaginados.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead className="cursor-pointer" onClick={() => {
                setOrdenacao({
                  campo: 'titulo',
                  direcao: ordenacao.campo === 'titulo' && ordenacao.direcao === 'asc' ? 'desc' : 'asc',
                });
              }}>
                Título
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objetivosPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhum objetivo encontrado
                </TableCell>
              </TableRow>
            ) : (
              objetivosPaginados.map((objetivo) => (
                <>
                  <TableRow key={objetivo.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedObjetivos.has(objetivo.id)}
                        onCheckedChange={() => toggleSelected(objetivo.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(objetivo.id)}
                      >
                        {expandedObjetivos.has(objetivo.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{objetivo.titulo}</div>
                        {objetivo.descricao && (
                          <div className="text-sm text-gray-500">{objetivo.descricao}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(objetivo.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Progress value={objetivo.progresso} className="flex-1" />
                          <span className="text-sm">{objetivo.progresso}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {objetivo.inicio && <div>Início: {new Date(objetivo.inicio).toLocaleDateString()}</div>}
                        {objetivo.fim && <div>Fim: {new Date(objetivo.fim).toLocaleDateString()}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditar(objetivo)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeletar(objetivo.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedObjetivos.has(objetivo.id) && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-gray-50 p-0">
                        <HabitosExpandedRow 
                          objetivoId={objetivo.id} 
                          onRefresh={() => setRefresh((r) => r + 1)}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {(paginaAtual - 1) * itensPorPagina + 1} a{' '}
            {Math.min(paginaAtual * itensPorPagina, objetivosFiltrados.length)} de{' '}
            {objetivosFiltrados.length} objetivos
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let pageNum;
                if (totalPaginas <= 5) {
                  pageNum = i + 1;
                } else if (paginaAtual <= 3) {
                  pageNum = i + 1;
                } else if (paginaAtual >= totalPaginas - 2) {
                  pageNum = totalPaginas - 4 + i;
                } else {
                  pageNum = paginaAtual - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={paginaAtual === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaginaAtual(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ObjetivoDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        objetivo={objetivoEditando}
        onSave={handleSalvar}
      />

      <AlertDialog open={deleteDialogAberto} onOpenChange={setDeleteDialogAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este objetivo? Esta ação também excluirá todos os
              hábitos e tarefas vinculados. Esta ação não pode ser desfeita.
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
