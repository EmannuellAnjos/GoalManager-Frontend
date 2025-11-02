import { useState } from 'react';
import { Plus, LayoutList, LayoutGrid } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { TarefaDialog } from './tarefa-dialog';
import { TarefasTable } from './tarefas-table';
import { TarefasKanbanLocal } from './tarefas-kanban-local';
import { Tarefa } from '../lib/types';
import { createTarefa } from '../lib/api';
import { toast } from 'sonner';

interface TarefasExpandedRowProps {
  objetivoId: string;
  habitoId: string;
  onRefresh: () => void;
}

export function TarefasExpandedRow({ objetivoId, habitoId, onRefresh }: TarefasExpandedRowProps) {
  const [modoKanban, setModoKanban] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  const handleSalvar = async (data: Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Garantir que habitoId está presente
      const dataComHabitoId = {
        ...data,
        habitoId: data.habitoId || habitoId
      };
      
      const response = await createTarefa(dataComHabitoId);
      
      if (response && response.data) {
        toast.success('Tarefa criada com sucesso!');
        setDialogAberto(false);
        // Forçar recarregamento dos componentes filhos e do componente pai
        setRefreshTrigger(prev => prev + 1);
        setTimeout(() => {
          onRefresh();
        }, 300);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa. Verifique o console para mais detalhes.');
      // Não fechar o diálogo em caso de erro para o usuário poder corrigir
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h4 className="font-medium">Tarefas do Hábito</h4>
          <div className="flex items-center gap-2">
            <LayoutList className="h-4 w-4" />
            <Switch
              checked={modoKanban}
              onCheckedChange={setModoKanban}
              id={`kanban-${habitoId}`}
            />
            <Label htmlFor={`kanban-${habitoId}`} className="cursor-pointer">
              <LayoutGrid className="h-4 w-4" />
            </Label>
          </div>
        </div>
        <Button onClick={() => setDialogAberto(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Tarefa
        </Button>
      </div>

      {modoKanban ? (
        <TarefasKanbanLocal
          key={`kanban-${habitoId}-${refreshTrigger}`}
          habitoId={habitoId}
          onRefresh={onRefresh}
        />
      ) : (
        <TarefasTable
          key={`table-${habitoId}-${refreshTrigger}`}
          habitoId={habitoId}
          onRefresh={onRefresh}
        />
      )}

      <TarefaDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        habitoIdPadrao={habitoId}
        onSave={handleSalvar}
      />
    </div>
  );
}
