import React, { useState, useMemo, useEffect } from 'react';
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
import { toast } from 'sonner';

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
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar hábitos quando o componente montar ou objetivoId mudar
  useEffect(() => {
    const carregarHabitos = async () => {
      try {
        setLoading(true);
        const response = await getHabitosByObjetivo(objetivoId);
        // Garantir que todos os hábitos tenham o objetivoId
        const habitosComObjetivoId = (response.data || []).map((h: Habito) => ({
          ...h,
          objetivoId: h.objetivoId || objetivoId
        }));
        setHabitos(habitosComObjetivoId);
      } catch (error) {
        console.error('Erro ao carregar hábitos:', error);
        setHabitos([]);
      } finally {
        setLoading(false);
      }
    };

    carregarHabitos();
  }, [objetivoId]);

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
    // Garantir que o hábito tenha o objetivoId antes de editar
    const habitoComObjetivoId = {
      ...habito,
      objetivoId: habito.objetivoId || objetivoId
    };
    setHabitoEditando(habitoComObjetivoId);
    setDialogAberto(true);
  };

  const handleSalvar = async (data: Omit<Habito, 'id' | 'createdAt' | 'updatedAt' | 'progresso'>) => {
    try {
      if (habitoEditando) {
        await updateHabito(habitoEditando.id, data);
        toast.success('Hábito atualizado com sucesso!');
      } else {
        await createHabito({ ...data, progresso: 0 });
        toast.success('Hábito criado com sucesso!');
      }
      // Recarregar a lista de hábitos
      const response = await getHabitosByObjetivo(objetivoId);
      const habitosComObjetivoId = (response.data || []).map((h: Habito) => ({
        ...h,
        objetivoId: h.objetivoId || objetivoId
      }));
      setHabitos(habitosComObjetivoId);
      onRefresh();
    } catch (error) {
      console.error('Erro ao salvar hábito:', error);
      toast.error('Erro ao salvar hábito');
    }
  };

  const handleDeletar = (id: string) => {
    setHabitoParaDeletar(id);
    setDeleteDialogAberto(true);
  };

  const confirmarDeletar = async () => {
    if (habitoParaDeletar) {
      try {
        await deleteHabito(habitoParaDeletar);
        toast.success('Hábito excluído com sucesso!');
        // Recarregar a lista de hábitos
        const response = await getHabitosByObjetivo(objetivoId);
        const habitosComObjetivoId = (response.data || []).map((h: Habito) => ({
          ...h,
          objetivoId: h.objetivoId || objetivoId
        }));
        setHabitos(habitosComObjetivoId);
        onRefresh();
      } catch (error) {
        console.error('Erro ao deletar hábito:', error);
        toast.error('Erro ao excluir hábito');
      }
    }
    setDeleteDialogAberto(false);
    setHabitoParaDeletar(null);
  };

  const handleMarcarFeito = async (id: string) => {
    try {
      await marcarHabitoFeito(id);
      toast.success('Hábito marcado como feito!');
      // Recarregar a lista de hábitos
      const response = await getHabitosByObjetivo(objetivoId);
      const habitosComObjetivoId = (response.data || []).map((h: Habito) => ({
        ...h,
        objetivoId: h.objetivoId || objetivoId
      }));
      setHabitos(habitosComObjetivoId);
      onRefresh();
    } catch (error) {
      console.error('Erro ao marcar hábito como feito:', error);
      toast.error('Erro ao marcar hábito como feito');
    }
  };

  const handleResetarCiclo = async (id: string) => {
    try {
      await resetarHabitoCiclo(id);
      toast.success('Ciclo do hábito resetado!');
      // Recarregar a lista de hábitos
      const response = await getHabitosByObjetivo(objetivoId);
      const habitosComObjetivoId = (response.data || []).map((h: Habito) => ({
        ...h,
        objetivoId: h.objetivoId || objetivoId
      }));
      setHabitos(habitosComObjetivoId);
      onRefresh();
    } catch (error) {
      console.error('Erro ao resetar ciclo do hábito:', error);
      toast.error('Erro ao resetar ciclo do hábito');
    }
  };

  const getStatusBadge = (status: StatusHabito) => {
    const variants: Record<StatusHabito, string> = {
      ativo: 'text-white',
      pausado: 'bg-yellow-100 text-yellow-800',
      concluido: 'bg-blue-100 text-blue-800',
    };
    const labels: Record<StatusHabito, string> = {
      ativo: 'Ativo',
      pausado: 'Pausado',
      concluido: 'Concluído',
    };
    const bgColors: Record<StatusHabito, string> = {
      ativo: '#4CAF50',
      pausado: '#FFD54F',
      concluido: '#42A5F5',
    };
    return (
      <Badge 
        className={variants[status]} 
        style={{ backgroundColor: bgColors[status] }}
      >
        {labels[status]}
      </Badge>
    );
  };

  const getFrequenciaLabel = (frequencia: string) => {
    const labels: Record<string, string> = {
      diario: 'Diário',
      semanal: 'Semanal',
      mensal: 'Mensal',
    };
    return labels[frequencia] || frequencia;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Carregando hábitos...</p>
      </div>
    );
  }

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

      <div className="border-2 rounded-lg shadow-sm" style={{ 
        backgroundColor: '#E8F5E9', 
        borderColor: '#C8E6C9' 
      }}>
        <Table>
          <TableHeader>
            <TableRow className="hover:opacity-90" style={{ backgroundColor: '#E8F5E9' }}>
              <TableHead className="w-12 p-3" style={{ color: '#2E7D32' }}>
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
              <TableHead className="w-12 p-3" style={{ color: '#2E7D32' }}></TableHead>
              <TableHead className="p-3" style={{ color: '#2E7D32', fontWeight: 600 }}>Título</TableHead>
              <TableHead className="p-3" style={{ color: '#2E7D32', fontWeight: 600 }}>Frequência</TableHead>
              <TableHead className="p-3" style={{ color: '#2E7D32', fontWeight: 600 }}>Realizações</TableHead>
              <TableHead className="p-3" style={{ color: '#2E7D32', fontWeight: 600 }}>Status</TableHead>
              <TableHead className="p-3" style={{ color: '#2E7D32', fontWeight: 600 }}>Progresso</TableHead>
              <TableHead className="w-12 p-3" style={{ color: '#2E7D32' }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {habitos.map((habito) => (
              <React.Fragment key={habito.id}>
                <TableRow 
                  className="hover:opacity-90 transition-opacity" 
                  style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}
                >
                  <TableCell className="p-3">
                    <Checkbox
                      checked={selectedHabitos.has(habito.id)}
                      onCheckedChange={() => toggleSelected(habito.id)}
                    />
                  </TableCell>
                  <TableCell className="p-3">
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
                  <TableCell className="p-3">
                    <div>
                      <div style={{ color: '#2E7D32', fontWeight: 600 }}>{habito.titulo}</div>
                      {habito.descricao && (
                        <div className="text-sm" style={{ color: '#5C8D5E' }}>{habito.descricao}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-3" style={{ color: '#2E7D32' }}>{getFrequenciaLabel(habito.frequencia)}</TableCell>
                  <TableCell className="p-3">
                    <div className="flex items-center gap-2">
                      <span style={{ color: '#2E7D32' }}>
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
                  <TableCell className="p-3">{getStatusBadge(habito.status)}</TableCell>
                  <TableCell className="p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{
                              width: `${habito.progresso}%`,
                              background: 'linear-gradient(to right, #FFD54F, #FBC02D)'
                            }}
                          />
                        </div>
                        <span className="text-sm" style={{ color: '#2E7D32' }}>{habito.progresso}%</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-3">
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
                    <TableCell colSpan={8} className="p-0" style={{ backgroundColor: '#E8F5E9' }}>
                      <div className="p-3">
                        <TarefasExpandedRow 
                          objetivoId={objetivoId}
                          habitoId={habito.id} 
                          onRefresh={onRefresh}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
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
