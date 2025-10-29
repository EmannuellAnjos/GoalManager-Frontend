import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, MoreVertical, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
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
import { Habito, StatusHabito } from '../lib/types';
import { 
  getHabitosByObjetivo, 
  updateHabito,
  deleteHabito,
  createHabito,
  marcarHabitoFeito,
  resetarHabitoCiclo,
} from '../lib/api';
import { HabitoDialog } from './habito-dialog';
import { TarefasExpandedRow } from './tarefas-expanded-row';
import { toast } from 'sonner@2.0.3';

interface HabitosExpandedRowProps {
  objetivoId: string;
  onRefresh: () => void;
}

export function HabitosExpandedRow({ objetivoId, onRefresh }: HabitosExpandedRowProps) {
  const [expandedHabitos, setExpandedHabitos] = useState<Set<string>>(new Set());
  const [selectedHabitos, setSelectedHabitos] = useState<Set<string>>(new Set());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [habitoEditando, setHabitoEditando] = useState<Habito | undefined>();
  const [deleteDialogAberto, setDeleteDialogAberto] = useState(false);
  const [habitoParaDeletar, setHabitoParaDeletar] = useState<string | null>(null);

  const habitos = getHabitosByObjetivo(objetivoId);

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedHabitos);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedHabitos(newSet);
  };

  const toggleSelected = (id: string) => {
    const newSet = new Set(selectedHabitos);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedHabitos(newSet);
  };

  const handleCriar = () => {
    setHabitoEditando(undefined);
    setDialogAberto(true);
  };

  const handleEditar = (habito: Habito) => {
    setHabitoEditando(habito);
    setDialogAberto(true);
  };

  const handleSalvar = (data: Omit<Habito, 'id' | 'createdAt' | 'updatedAt' | 'progresso'>) => {
    if (habitoEditando) {
      updateHabito(habitoEditando.id, data);
      toast.success('Hábito atualizado com sucesso!');
    } else {
      createHabito({ ...data, progresso: 0 });
      toast.success('Hábito criado com sucesso!');
    }
    onRefresh();
  };

  const handleDeletar = (id: string) => {
    setHabitoParaDeletar(id);
    setDeleteDialogAberto(true);
  };

  const confirmarDeletar = () => {
    if (habitoParaDeletar) {
      deleteHabito(habitoParaDeletar);
      toast.success('Hábito excluído com sucesso!');
      onRefresh();
    }
    setDeleteDialogAberto(false);
    setHabitoParaDeletar(null);
  };

  const handleMarcarFeito = (id: string) => {
    marcarHabitoFeito(id);
    toast.success('Hábito marcado como feito!');
    onRefresh();
  };

  const handleResetarCiclo = (id: string) => {
    resetarHabitoCiclo(id);
    toast.success('Ciclo do hábito resetado!');
    onRefresh();
  };

  const getStatusBadge = (status: StatusHabito) => {
    const variants: Record<StatusHabito, string> = {
      ativo: 'bg-green-100 text-green-800',
      pausado: 'bg-yellow-100 text-yellow-800',
      concluido: 'bg-blue-100 text-blue-800',
    };
    const labels: Record<StatusHabito, string> = {
      ativo: 'Ativo',
      pausado: 'Pausado',
      concluido: 'Concluído',
    };
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  const getFrequenciaLabel = (frequencia: string) => {
    const labels: Record<string, string> = {
      diario: 'Diário',
      semanal: 'Semanal',
      mensal: 'Mensal',
    };
    return labels[frequencia] || frequencia;
  };

  if (habitos.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Nenhum hábito neste objetivo</p>
        <Button onClick={handleCriar} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Hábito
        </Button>
        <HabitoDialog
          open={dialogAberto}
          onOpenChange={setDialogAberto}
          habito={habitoEditando}
          objetivoIdPadrao={objetivoId}
          onSave={handleSalvar}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Hábitos do Objetivo</h3>
        <Button onClick={handleCriar} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Hábito
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={habitos.length > 0 && selectedHabitos.size === habitos.length}
                  onCheckedChange={() => {
                    if (selectedHabitos.size === habitos.length) {
                      setSelectedHabitos(new Set());
                    } else {
                      setSelectedHabitos(new Set(habitos.map((h) => h.id)));
                    }
                  }}
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Realizações</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {habitos.map((habito) => (
              <>
                <TableRow key={habito.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedHabitos.has(habito.id)}
                      onCheckedChange={() => toggleSelected(habito.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(habito.id)}
                    >
                      {expandedHabitos.has(habito.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{habito.titulo}</div>
                      {habito.descricao && (
                        <div className="text-sm text-gray-500">{habito.descricao}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getFrequenciaLabel(habito.frequencia)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>
                        {habito.realizadosNoPeriodo} / {habito.alvoPorPeriodo}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarcarFeito(habito.id)}
                        disabled={habito.status !== 'ativo'}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(habito.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Progress value={habito.progresso} className="flex-1" />
                        <span className="text-sm">{habito.progresso}%</span>
                      </div>
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
                        <DropdownMenuItem onClick={() => handleMarcarFeito(habito.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Marcar Feito
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetarCiclo(habito.id)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Resetar Ciclo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditar(habito)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeletar(habito.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {expandedHabitos.has(habito.id) && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-gray-100 p-0">
                      <TarefasExpandedRow 
                        objetivoId={objetivoId}
                        habitoId={habito.id} 
                        onRefresh={onRefresh}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <HabitoDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        habito={habitoEditando}
        objetivoIdPadrao={objetivoId}
        onSave={handleSalvar}
      />

      <AlertDialog open={deleteDialogAberto} onOpenChange={setDeleteDialogAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este hábito? Esta ação também excluirá todas as
              tarefas vinculadas. Esta ação não pode ser desfeita.
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
