import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { ObjetivosView } from './components/objetivos-view';
import { KanbanGlobal } from './components/kanban-global';
import { ApiTestComponent } from './components/api-test';
import { Toaster } from './components/ui/sonner';
import { initializeAuth } from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('hierarquica');
  const [authInitialized, setAuthInitialized] = useState(false);
  const [infoBoxExpanded, setInfoBoxExpanded] = useState(false);

  // Inicializar autenticação quando a aplicação carregar
  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setAuthInitialized(true);
    };
    init();
  }, []);

  // Resetar estado da caixa informativa ao mudar de aba
  useEffect(() => {
    setInfoBoxExpanded(false);
  }, [activeTab]);

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-8 px-2 sm:px-4 lg:px-6" style={{ width: '90%', maxWidth: '90%' }}>
        <div className="space-y-6">
          {/* Cabeçalho com título/subtítulo e botões de navegação no topo */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Primeira linha: Título/Subtítulo e Botões de Navegação */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 mx-auto" style={{ maxWidth: '90%', width: '100%' }}>
              {/* Título e Subtítulo - Centralizado */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h1 className="text-3xl font-bold">Sistema de Objetivos, Hábitos e Tarefas</h1>
                <p className="text-gray-600 mb-4">
                  Gerencie seus objetivos, acompanhe hábitos e organize tarefas com progresso
                  automatizado
                </p>
              </div>

              {/* Botões de Navegação - maior largura e espaçamento */}
              <div className="flex-shrink-0 flex items-center">
                <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1.5 text-muted-foreground gap-1.5">
                  <TabsTrigger value="hierarquica" className="flex items-center gap-2 px-4 py-2 text-sm min-w-[110px]">
                    <LayoutList className="h-4 w-4" />
                    <span className="hidden sm:inline">Hierárquica</span>
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="flex items-center gap-2 px-4 py-2 text-sm min-w-[110px]">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Kanban</span>
                  </TabsTrigger>
                  <TabsTrigger value="api-test" className="flex items-center gap-2 px-4 py-2 text-sm min-w-[110px]">
                    🧪 <span className="hidden sm:inline">Teste</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="hierarquica" className="mt-0">
              <ObjetivosView />
            </TabsContent>

            <TabsContent value="kanban" className="mt-0">
              <KanbanGlobal />
            </TabsContent>

            <TabsContent value="api-test" className="mt-0">
              <ApiTestComponent />
            </TabsContent>
          </Tabs>

          {/* Informações do Sistema e Caixa Informativa - Lado a lado */}
          <div className="border-t pt-6 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sobre o Sistema - Esquerda */}
              <div>
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

              {/* Caixa Informativa - Direita */}
              <div>
                <details 
                  className="space-y-2" 
                  open={infoBoxExpanded}
                  onToggle={(e) => setInfoBoxExpanded((e.target as HTMLDetailsElement).open)}
                >
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    {infoBoxExpanded 
                      ? (activeTab === 'hierarquica' ? 'Ocultar detalhes da visão hierárquica' : 
                         activeTab === 'kanban' ? 'Ocultar detalhes do kanban global' : 
                         'Ocultar detalhes do teste de API')
                      : (activeTab === 'hierarquica' ? 'Mostrar detalhes da visão hierárquica' : 
                         activeTab === 'kanban' ? 'Mostrar detalhes do kanban global' : 
                         'Mostrar detalhes do teste de API')
                    }
                  </summary>
                  <div className="mt-4 transition-all duration-300 ease-in-out">
                    {activeTab === 'hierarquica' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-2">Visão Hierárquica</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Expanda objetivos para ver seus hábitos</li>
                          <li>• Expanda hábitos para ver tarefas (tabela ou kanban)</li>
                          <li>• Use os filtros, busca e ordenação em cada nível</li>
                          <li>• Progresso calculado automaticamente (tarefas → hábitos → objetivos)</li>
                        </ul>
                      </div>
                    )}
                    {activeTab === 'kanban' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-medium text-green-900 mb-2">Kanban Global</h3>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li>• Visualize todas as tarefas organizadas por status</li>
                          <li>• Arraste e solte entre colunas para mudar status</li>
                          <li>• Filtre por hábito, prioridade e prazo</li>
                          <li>• Tarefas com prazo atrasado são destacadas em vermelho</li>
                        </ul>
                      </div>
                    )}
                    {activeTab === 'api-test' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-medium text-yellow-900 mb-2">🧪 Teste de API</h3>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          <li>• Teste as chamadas HTTP para o backend</li>
                          <li>• Verifica se o token de autenticação está sendo enviado</li>
                          <li>• Monitore os logs do backend para confirmar recebimento</li>
                          <li>• User ID fixo: {(import.meta as any).env?.VITE_USER_ID || 'N/A'}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
