import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Objetivo, StatusObjetivo } from '../lib/types';

interface ObjetivoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objetivo?: Objetivo;
  onSave: (data: Omit<Objetivo, 'id' | 'createdAt' | 'updatedAt' | 'progresso'>) => void;
}

export function ObjetivoDialog({ open, onOpenChange, objetivo, onSave }: ObjetivoDialogProps) {
  const [formData, setFormData] = useState<Omit<Objetivo, 'id' | 'createdAt' | 'updatedAt' | 'progresso'>>({
    titulo: '',
    descricao: '',
    inicio: '',
    fim: '',
    status: 'planejado',
  });

  useEffect(() => {
    if (objetivo) {
      setFormData({
        titulo: objetivo.titulo,
        descricao: objetivo.descricao || '',
        inicio: objetivo.inicio || '',
        fim: objetivo.fim || '',
        status: objetivo.status,
      });
    } else {
      setFormData({
        titulo: '',
        descricao: '',
        inicio: '',
        fim: '',
        status: 'planejado',
      });
    }
  }, [objetivo, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) return;
    
    onSave({
      ...formData,
      descricao: formData.descricao || undefined,
      inicio: formData.inicio || undefined,
      fim: formData.fim || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{objetivo ? 'Editar Objetivo' : 'Novo Objetivo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Melhorar Saúde e Bem-estar"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o objetivo..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inicio">Data de Início</Label>
                <Input
                  id="inicio"
                  type="date"
                  value={formData.inicio}
                  onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fim">Data de Término</Label>
                <Input
                  id="fim"
                  type="date"
                  value={formData.fim}
                  onChange={(e) => setFormData({ ...formData, fim: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: StatusObjetivo) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planejado">Planejado</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {objetivo ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
