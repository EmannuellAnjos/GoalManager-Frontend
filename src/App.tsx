import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { ObjetivosView } from './components/objetivos-view';
import { KanbanGlobal } from './components/kanban-global';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('hierarquica');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="space-y-2">
            <h1 className="text-3xl">Sistema de Objetivos, Hábitos e Tarefas</h1>
            <p className="text-gray-600">
              Gerencie seus objetivos, acompanhe hábitos e organize tarefas com progresso
              automatizado
            </p>
          </div>

          {/* Navegação entre Visões */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="hierarquica" className="flex items-center gap-2">
                <LayoutList className="h-4 w-4" />
                Visão Hierárquica
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Kanban Global
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hierarquica" className="mt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Visão Hierárquica</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Expanda objetivos para ver seus hábitos</li>
                    <li>• Expanda hábitos para ver tarefas (tabela ou kanban)</li>
                    <li>• Use os filtros, busca e ordenação em cada nível</li>
                    <li>• Progresso calculado automaticamente (tarefas → hábitos → objetivos)</li>
                  </ul>
                </div>
                <ObjetivosView />
              </div>
            </TabsContent>

            <TabsContent value="kanban" className="mt-6">
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">Kanban Global</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Visualize todas as tarefas organizadas por status</li>
                    <li>• Arraste e solte entre colunas para mudar status</li>
                    <li>• Filtre por objetivo, hábito, prioridade e prazo</li>
                    <li>• Tarefas com prazo atrasado são destacadas em vermelho</li>
                  </ul>
                </div>
                <KanbanGlobal />
              </div>
            </TabsContent>
          </Tabs>

          {/* Informações do Sistema */}
          <div className="border-t pt-6 mt-8">
            <details className="space-y-2">
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                ℹ️ Sobre o Sistema
              </summary>
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Regras de Progresso:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Tarefas:</strong> Quando status = "Concluída", progresso = 100%.
                      Caso contrário, é editável manualmente (0-99%).
                    </li>
                    <li>
                      <strong>Hábitos:</strong> Progresso = (realizados no período / alvo por
                      período) × 100. Use o botão "Marcar Feito" para incrementar.
                    </li>
                    <li>
                      <strong>Objetivos:</strong> Progresso = média do progresso de todos os
                      hábitos e tarefas vinculados ao objetivo.
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Funcionalidades:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>CRUD completo para Objetivos, Hábitos e Tarefas</li>
                    <li>Busca, filtros, ordenação e paginação (50 itens/página)</li>
                    <li>Seleção em massa e exclusão em lote</li>
                    <li>Barras de progresso em todos os níveis</li>
                    <li>Drag-and-drop no Kanban atualiza status automaticamente</li>
                    <li>Toggle entre tabela e kanban no nível de hábito</li>
                    <li>Destaque visual para prazos atrasados</li>
                    <li>Validações e confirmações de exclusão</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dados de Exemplo:</h4>
                  <p>
                    O sistema já vem com 3 objetivos, 5 hábitos e 15 tarefas pré-cadastrados,
                    cobrindo diferentes cenários: tarefas concluídas, em andamento, atrasadas,
                    bloqueadas, etc.
                  </p>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
