import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Habito, StatusHabito, Frequencia } from '../lib/types';
import { getObjetivos } from '../lib/api';

interface HabitoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habito?: Habito;
  objetivoIdPadrao?: string;
  onSave: (data: Omit<Habito, 'id' | 'createdAt' | 'updatedAt' | 'progresso'>) => void;
}

export function HabitoDialog({ open, onOpenChange, habito, objetivoIdPadrao, onSave }: HabitoDialogProps) {
  const [formData, setFormData] = useState<Omit<Habito, 'id' | 'createdAt' | 'updatedAt' | 'progresso'>>({
    objetivoId: objetivoIdPadrao || '',
    titulo: '',
    descricao: '',
    frequencia: 'diario',
    alvoPorPeriodo: 1,
    realizadosNoPeriodo: 0,
    status: 'ativo',
  });

  const objetivos = getObjetivos();

  useEffect(() => {
    if (habito) {
      setFormData({
        objetivoId: habito.objetivoId,
        titulo: habito.titulo,
        descricao: habito.descricao || '',
        frequencia: habito.frequencia,
        alvoPorPeriodo: habito.alvoPorPeriodo,
        realizadosNoPeriodo: habito.realizadosNoPeriodo,
        status: habito.status,
      });
    } else {
      setFormData({
        objetivoId: objetivoIdPadrao || objetivos[0]?.id || '',
        titulo: '',
        descricao: '',
        frequencia: 'diario',
        alvoPorPeriodo: 1,
        realizadosNoPeriodo: 0,
        status: 'ativo',
      });
    }
  }, [habito, open, objetivoIdPadrao]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.objetivoId) return;
    
    onSave({
      ...formData,
      descricao: formData.descricao || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{habito ? 'Editar Hábito' : 'Novo Hábito'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="objetivoId">Objetivo *</Label>
              <Select
                value={formData.objetivoId}
                onValueChange={(value) => setFormData({ ...formData, objetivoId: value })}
              >
                <SelectTrigger id="objetivoId">
                  <SelectValue placeholder="Selecione um objetivo" />
                </SelectTrigger>
                <SelectContent>
                  {objetivos.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id}>
                      {obj.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Exercícios Físicos"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o hábito..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequencia">Frequência</Label>
                <Select
                  value={formData.frequencia}
                  onValueChange={(value: Frequencia) => setFormData({ ...formData, frequencia: value })}
                >
                  <SelectTrigger id="frequencia">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alvoPorPeriodo">Alvo por Período</Label>
                <Input
                  id="alvoPorPeriodo"
                  type="number"
                  min="1"
                  value={formData.alvoPorPeriodo}
                  onChange={(e) => setFormData({ ...formData, alvoPorPeriodo: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="realizadosNoPeriodo">Realizados no Período</Label>
                <Input
                  id="realizadosNoPeriodo"
                  type="number"
                  min="0"
                  value={formData.realizadosNoPeriodo}
                  onChange={(e) => setFormData({ ...formData, realizadosNoPeriodo: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: StatusHabito) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {habito ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
