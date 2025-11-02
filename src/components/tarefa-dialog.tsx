import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tarefa, StatusTarefa, Prioridade, Habito } from '../lib/types';
import { getHabitos } from '../lib/api';
import { Slider } from './ui/slider';
import { toast } from 'sonner';

interface TarefaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefa?: Tarefa;
  habitoIdPadrao?: string; // Hábito padrão (obrigatório ao criar nova tarefa)
  onSave: (data: Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function TarefaDialog({ 
  open, 
  onOpenChange, 
  tarefa, 
  habitoIdPadrao, 
  onSave 
}: TarefaDialogProps) {
  const [formData, setFormData] = useState<Omit<Tarefa, 'id' | 'createdAt' | 'updatedAt'>>({
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

  // Estados para dados assíncronos
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar hábitos quando o dialog abrir
  useEffect(() => {
    if (open) {
      const carregarHabitos = async () => {
        try {
          setLoading(true);
          // Resetar formData enquanto carrega, mas manter habitoIdPadrao se fornecido
          setFormData({
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
          const habitosResponse = await getHabitos();
          setHabitos(habitosResponse.data);
        } catch (error) {
          console.error('Erro ao carregar hábitos:', error);
          toast.error('Erro ao carregar hábitos');
        } finally {
          setLoading(false);
        }
      };

      carregarHabitos();
    } else {
      // Limpar estados quando dialog fecha
      setFormData({
        habitoId: '',
        titulo: '',
        descricao: '',
        prioridade: 'media',
        status: 'backlog',
        estimativaHoras: undefined,
        horasGastas: undefined,
        prazo: '',
        progresso: 0,
      });
      setHabitos([]);
    }
  }, [open, habitoIdPadrao]);

  // Preencher formData apenas após hábitos serem carregados
  useEffect(() => {
    if (open && !loading) {
      if (tarefa) {
        // Converter estimativaHoras e horasGastas garantindo que 0 seja preservado
        // Se o valor for 0, false, null, undefined ou string vazia, manter undefined
        // Caso contrário, converter para número
        let estimativaHoras: number | undefined;
        if (tarefa.estimativaHoras !== null && tarefa.estimativaHoras !== undefined && tarefa.estimativaHoras !== '') {
          const valor = typeof tarefa.estimativaHoras === 'string' ? parseFloat(tarefa.estimativaHoras) : Number(tarefa.estimativaHoras);
          estimativaHoras = !isNaN(valor) ? valor : undefined;
        } else {
          estimativaHoras = undefined;
        }
        
        let horasGastas: number | undefined;
        if (tarefa.horasGastas !== null && tarefa.horasGastas !== undefined && tarefa.horasGastas !== '') {
          const valor = typeof tarefa.horasGastas === 'string' ? parseFloat(tarefa.horasGastas) : Number(tarefa.horasGastas);
          horasGastas = !isNaN(valor) ? valor : undefined;
        } else {
          horasGastas = undefined;
        }
        
        setFormData({
          habitoId: tarefa.habitoId,
          titulo: tarefa.titulo,
          descricao: tarefa.descricao || '',
          prioridade: tarefa.prioridade || 'media',
          status: tarefa.status,
          estimativaHoras: estimativaHoras,
          horasGastas: horasGastas,
          prazo: tarefa.prazo || '',
          progresso: tarefa.progresso,
        });
      } else {
        // Para nova tarefa, usar habitoIdPadrao se fornecido
        setFormData({
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
    }
  }, [tarefa?.id, open, habitoIdPadrao, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação obrigatória
    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    
    // Garantir que habitoId está presente - usar habitoIdPadrao se necessário
    const habitoIdFinal = formData.habitoId || habitoIdPadrao || '';
    
    if (!habitoIdFinal) {
      toast.error('Hábito é obrigatório');
      return;
    }
    
    const dataToSave = {
      ...formData,
      habitoId: habitoIdFinal,
      descricao: formData.descricao || undefined,
      prazo: formData.prazo || undefined,
    };
    
    try {
      await onSave(dataToSave);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error('Erro ao salvar tarefa');
    }
    // Não fechar o diálogo aqui - deixar o componente pai fechar após o sucesso
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tarefa ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">Carregando...</span>
          </div>
        ) : (
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

            <div className="space-y-2">
              <Label htmlFor="habitoId">Hábito *</Label>
              <Select
                key={`hab-${formData.habitoId || 'none'}-${habitos.length}-${tarefa?.id || 'new'}`}
                value={formData.habitoId || habitoIdPadrao || ''}
                onValueChange={(value: string) => {
                  setFormData({ ...formData, habitoId: value });
                }}
              >
                <SelectTrigger id="habitoId">
                  <SelectValue placeholder={loading ? "Carregando hábitos..." : "Selecione um hábito"} />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : habitos.length === 0 ? (
                    <SelectItem value="empty" disabled>Nenhum hábito encontrado</SelectItem>
                  ) : (
                    habitos.map((hab) => (
                      <SelectItem key={hab.id} value={hab.id}>
                        {hab.titulo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select
                  key={`prio-${formData.prioridade || 'media'}`}
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
                  key={`status-${formData.status}`}
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
                  value={formData.estimativaHoras !== null && formData.estimativaHoras !== undefined 
                    ? formData.estimativaHoras 
                    : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      estimativaHoras: value !== '' ? parseFloat(value) || 0 : undefined 
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horasGastas">Horas Gastas</Label>
                <Input
                  id="horasGastas"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.horasGastas !== null && formData.horasGastas !== undefined 
                    ? formData.horasGastas 
                    : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      horasGastas: value !== '' ? parseFloat(value) || 0 : undefined 
                    });
                  }}
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
                onValueChange={([value]:any) => setFormData({ ...formData, progresso: value })}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
