import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tarefa, StatusTarefa, Prioridade } from '../lib/types';
import { getObjetivos, getHabitos } from '../lib/api';
import { Slider } from './ui/slider';

interface TarefaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefa?: Tarefa;
  objetivoIdPadrao?: string;
  habitoIdPadrao?: string;
  onSave: (data: Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function TarefaDialog({ 
  open, 
  onOpenChange, 
  tarefa, 
  objetivoIdPadrao, 
  habitoIdPadrao, 
  onSave 
}: TarefaDialogProps) {
  const [formData, setFormData] = useState<Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>>({
    objetivoId: objetivoIdPadrao || '',
    habitoId: habitoIdPadrao || '',
    titulo: '',
    descricao: '',
    prioridade: 'media',
    status: 'backlog',
    estimativaHoras: undefined,
    horasGastas: undefined,
    prazo: '',
    progresso: 0,
  });

  const objetivos = getObjetivos();
  const habitos = getHabitos();
  const habitosFiltrados = formData.objetivoId 
    ? habitos.filter(h => h.objetivoId === formData.objetivoId)
    : habitos;

  useEffect(() => {
    if (tarefa) {
      setFormData({
        objetivoId: tarefa.objetivoId || '',
        habitoId: tarefa.habitoId || '',
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        prioridade: tarefa.prioridade || 'media',
        status: tarefa.status,
        estimativaHoras: tarefa.estimativaHoras,
        horasGastas: tarefa.horasGastas,
        prazo: tarefa.prazo || '',
        progresso: tarefa.progresso,
      });
    } else {
      setFormData({
        objetivoId: objetivoIdPadrao || '',
        habitoId: habitoIdPadrao || '',
        titulo: '',
        descricao: '',
        prioridade: 'media',
        status: 'backlog',
        estimativaHoras: undefined,
        horasGastas: undefined,
        prazo: '',
        progresso: 0,
      });
    }
  }, [tarefa, open, objetivoIdPadrao, habitoIdPadrao]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) return;
    
    onSave({
      ...formData,
      objetivoId: formData.objetivoId || undefined,
      habitoId: formData.habitoId || undefined,
      descricao: formData.descricao || undefined,
      prazo: formData.prazo || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tarefa ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Completar curso de TypeScript"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva a tarefa..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objetivoId">Objetivo</Label>
                <Select
                  value={formData.objetivoId || 'none'}
                  onValueChange={(value) => {
                    const objetivoId = value === 'none' ? '' : value;
                    setFormData({ ...formData, objetivoId, habitoId: '' });
                  }}
                >
                  <SelectTrigger id="objetivoId">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {objetivos.map((obj) => (
                      <SelectItem key={obj.id} value={obj.id}>
                        {obj.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="habitoId">Hábito</Label>
                <Select
                  value={formData.habitoId || 'none'}
                  onValueChange={(value) => {
                    const habitoId = value === 'none' ? '' : value;
                    setFormData({ ...formData, habitoId });
                  }}
                  disabled={!formData.objetivoId}
                >
                  <SelectTrigger id="habitoId">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {habitosFiltrados.map((hab) => (
                      <SelectItem key={hab.id} value={hab.id}>
                        {hab.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select
                  value={formData.prioridade || 'media'}
                  onValueChange={(value: Prioridade) => setFormData({ ...formData, prioridade: value })}
                >
                  <SelectTrigger id="prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: StatusTarefa) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="a_fazer">A Fazer</SelectItem>
                    <SelectItem value="fazendo">Fazendo</SelectItem>
                    <SelectItem value="bloqueada">Bloqueada</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimativaHoras">Estimativa (horas)</Label>
                <Input
                  id="estimativaHoras"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimativaHoras || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    estimativaHoras: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horasGastas">Horas Gastas</Label>
                <Input
                  id="horasGastas"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.horasGastas || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    horasGastas: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo">Prazo</Label>
              <Input
                id="prazo"
                type="date"
                value={formData.prazo}
                onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="progresso">
                Progresso: {formData.progresso}%
                {formData.status === 'concluida' && ' (Fixo em 100% quando concluída)'}
              </Label>
              <Slider
                id="progresso"
                min={0}
                max={99}
                step={1}
                value={[formData.progresso]}
                onValueChange={([value]) => setFormData({ ...formData, progresso: value })}
                disabled={formData.status === 'concluida'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {tarefa ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
