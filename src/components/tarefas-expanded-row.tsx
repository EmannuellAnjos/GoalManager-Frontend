import { useState } from 'react';
import { Plus, LayoutList, LayoutGrid } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { TarefaDialog } from './tarefa-dialog';
import { TarefasTable } from './tarefas-table';
import { TarefasKanbanLocal } from './tarefas-kanban-local';

interface TarefasExpandedRowProps {
  objetivoId: string;
  habitoId: string;
  onRefresh: () => void;
}

export function TarefasExpandedRow({ objetivoId, habitoId, onRefresh }: TarefasExpandedRowProps) {
  const [modoKanban, setModoKanban] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);

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
          objetivoId={objetivoId}
          habitoId={habitoId}
          onRefresh={onRefresh}
        />
      ) : (
        <TarefasTable
          objetivoId={objetivoId}
          habitoId={habitoId}
          onRefresh={onRefresh}
        />
      )}

      <TarefaDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        objetivoIdPadrao={objetivoId}
        habitoIdPadrao={habitoId}
        onSave={() => {
          onRefresh();
          setDialogAberto(false);
        }}
      />
    </div>
  );
}
