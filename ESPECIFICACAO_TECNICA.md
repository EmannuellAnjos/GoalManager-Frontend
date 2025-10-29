# Especificação Técnica - GoalManager
## Sistema de Controle de Objetivos, Hábitos e Tarefas

**Versão:** 1.0  
**Data:** 29 de Outubro de 2025  
**Repositório:** https://github.com/EmannuellAnjos/GoalManager

---

## 1. Visão Geral do Projeto

### 1.1 Propósito
O GoalManager é uma aplicação web para gerenciamento pessoal integrado de:
- **Objetivos:** Metas de longo prazo com data de início/fim
- **Hábitos:** Atividades recorrentes vinculadas aos objetivos
- **Tarefas:** Ações específicas que podem ser vinculadas a objetivos ou hábitos

### 1.2 Características Principais
- Interface moderna e responsiva desenvolvida em React + TypeScript
- Sistema hierárquico com cálculo automático de progresso
- Duas visões principais: Hierárquica e Kanban Global
- CRUD completo com filtros, busca e ordenação
- Funcionalidade drag-and-drop para mudança de status
- Sistema de notificações e alerts

### 1.3 Stack Tecnológica
- **Frontend:** React 18.3.1, TypeScript, Vite
- **UI Library:** Radix UI + Tailwind CSS
- **Estado:** Gerenciamento local com hooks React
- **Dados:** Mock data (preparado para integração com API)
- **Build:** Vite.js
- **Ícones:** Lucide React

---

## 2. Arquitetura do Sistema

### 2.1 Estrutura de Pastas
```
src/
├── components/           # Componentes React
│   ├── ui/              # Componentes base (Radix UI)
│   ├── figma/           # Componentes específicos
│   └── *.tsx            # Componentes de funcionalidade
├── lib/                 # Lógica de negócio
│   ├── types.ts         # Tipos TypeScript
│   ├── api.ts           # Simulação de API
│   ├── mock-data.ts     # Dados de exemplo
│   └── progress-calculator.ts # Cálculos de progresso
├── styles/              # Estilos globais
└── guidelines/          # Documentação
```

### 2.2 Padrões Arquiteturais
- **Component-Based Architecture:** Componentes reutilizáveis e modulares
- **Custom Hooks:** Para lógica de estado compartilhada
- **Separation of Concerns:** Separação entre UI, lógica e dados
- **TypeScript-First:** Tipagem forte em toda aplicação

---

## 3. Modelo de Dados

### 3.1 Entidades Principais

#### Objetivo
```typescript
interface Objetivo {
  id: string;
  titulo: string;
  descricao?: string;
  inicio?: string;        // ISO date
  fim?: string;          // ISO date
  status: StatusObjetivo; // 'planejado' | 'em_andamento' | 'concluido' | 'arquivado'
  progresso: number;     // 0-100 (calculado automaticamente)
  createdAt: string;
  updatedAt: string;
}
```

#### Hábito
```typescript
interface Habito {
  id: string;
  objetivoId: string;           // FK para Objetivo
  titulo: string;
  descricao?: string;
  frequencia: Frequencia;       // 'diario' | 'semanal' | 'mensal'
  alvoPorPeriodo: number;      // Meta de realizações por período
  realizadosNoPeriodo: number; // Realizações atuais
  status: StatusHabito;        // 'ativo' | 'pausado' | 'concluido'
  progresso: number;           // Calculado: (realizados/alvo) * 100
  createdAt: string;
  updatedAt: string;
}
```

#### Tarefa
```typescript
interface Tarefa {
  id: string;
  objetivoId?: string;      // FK opcional para Objetivo
  habitoId?: string;        // FK opcional para Hábito
  titulo: string;
  descricao?: string;
  prioridade?: Prioridade;  // 'baixa' | 'media' | 'alta'
  status: StatusTarefa;     // 'backlog' | 'a_fazer' | 'fazendo' | 'bloqueada' | 'concluida'
  estimativaHoras?: number;
  horasGastas?: number;
  prazo?: string;           // ISO date
  progresso: number;        // 0-99 editável, 100 quando status='concluida'
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Relacionamentos
- **1:N** - Um Objetivo possui muitos Hábitos
- **1:N** - Um Objetivo pode ter muitas Tarefas diretas
- **1:N** - Um Hábito pode ter muitas Tarefas
- **Hierárquico** - Objetivo → Hábitos → Tarefas

### 3.3 Regras de Negócio

#### Cálculo de Progresso
1. **Tarefas:** 
   - Status "Concluída" = 100%
   - Outros status = editável manualmente (0-99%)

2. **Hábitos:**
   - Progresso = (realizados no período / alvo por período) × 100
   - Botão "Marcar Feito" incrementa `realizadosNoPeriodo`

3. **Objetivos:**
   - Progresso = média dos progressos de hábitos e tarefas vinculados
   - Recalculado automaticamente a cada mudança

---

## 4. Funcionalidades Detalhadas

### 4.1 Visão Hierárquica

#### Objetivos (Nível 1)
- **Listagem:** Tabela com busca, filtros por status, ordenação
- **CRUD:** Criar, editar, excluir objetivos
- **Seleção múltipla:** Exclusão em lote
- **Expansão:** Clique para mostrar hábitos vinculados
- **Progresso:** Barra visual com porcentagem

#### Hábitos (Nível 2)
- **Visualização:** Expandindo um objetivo
- **Gestão:** Mesmo CRUD dos objetivos
- **Ação especial:** Botão "Marcar Feito" para incrementar realizações
- **Expansão:** Mostra tarefas em tabela ou kanban local

#### Tarefas (Nível 3)
- **Duas visualizações:**
  - **Tabela:** Lista tradicional com todos os campos
  - **Kanban Local:** Cards organizados por status
- **Funcionalidades:** CRUD completo, drag-and-drop no kanban

### 4.2 Kanban Global

#### Visão Geral
- **Colunas:** Backlog, A Fazer, Fazendo, Bloqueada, Concluída
- **Cards:** Todas as tarefas do sistema organizadas por status
- **Interação:** Drag-and-drop entre colunas atualiza status automaticamente

#### Filtros Avançados
- Por objetivo específico
- Por hábito específico  
- Por prioridade (baixa, média, alta)
- Por prazo (intervalo de datas)
- Combinação de múltiplos filtros

#### Indicadores Visuais
- **Prioridade:** Badges coloridos
- **Prazo:** Tarefas atrasadas destacadas em vermelho
- **Progresso:** Barras de progresso nos cards

### 4.3 Funcionalidades Transversais

#### Sistema de Busca
- **Escopo:** Títulos e descrições
- **Tempo real:** Filtro instantâneo durante digitação
- **Múltiplos níveis:** Funciona em objetivos, hábitos e tarefas

#### Filtros e Ordenação
- **Filtros por status:** Múltipla seleção
- **Ordenação:** Por qualquer coluna (ASC/DESC)
- **Paginação:** 50 itens por página
- **Estado persistente:** Filtros mantidos durante navegação

#### Notificações
- **Toast messages:** Confirmações de ações
- **Alerts de confirmação:** Para exclusões
- **Feedback visual:** Loading states e validações

---

## 5. Interface do Usuário

### 5.1 Design System
- **Base:** Radix UI para acessibilidade e comportamentos
- **Estilização:** Tailwind CSS para styling
- **Tema:** Design system consistente com tokens de cor
- **Responsividade:** Mobile-first approach

### 5.2 Componentes Principais

#### Layout
- **Header:** Título e descrição do sistema
- **Navigation:** Tabs para alternar entre visões
- **Content:** Área principal com conteúdo dinâmico
- **Sidebar:** Filtros e ações contextuais

#### Componentes de Dados
- **Tables:** Listagem com sorting e paginação
- **Cards:** Visualização em Kanban
- **Progress Bars:** Indicadores visuais de progresso
- **Badges:** Status e prioridades

#### Modais e Dialogs
- **CRUD Dialogs:** Formulários para criar/editar
- **Confirmation Alerts:** Para ações destrutivas
- **Info Tooltips:** Ajuda contextual

### 5.3 Estados da Interface
- **Loading:** Skeleton loaders durante carregamento
- **Empty States:** Mensagens quando não há dados
- **Error States:** Tratamento de erros com retry
- **Success States:** Confirmações de ações

---

## 6. Fluxos de Usuário

### 6.1 Fluxo Principal - Gerenciar Objetivo

1. **Criar Objetivo**
   - Acessar visão hierárquica
   - Clicar "Novo Objetivo"
   - Preencher formulário (título, descrição, datas)
   - Confirmar criação

2. **Adicionar Hábitos**
   - Expandir objetivo criado
   - Clicar "Novo Hábito"
   - Definir frequência e meta
   - Confirmar criação

3. **Gerenciar Tarefas**
   - Expandir hábito
   - Escolher visualização (tabela/kanban)
   - Adicionar tarefas com prioridades e prazos
   - Atualizar progresso/status

4. **Acompanhar Progresso**
   - Visualizar barras de progresso em tempo real
   - Marcar hábitos como "feitos"
   - Mover tarefas no kanban
   - Ver progresso do objetivo atualizar automaticamente

### 6.2 Fluxo Alternativo - Kanban Global

1. **Visão Geral**
   - Alternar para aba "Kanban Global"
   - Visualizar todas as tarefas organizadas

2. **Gerenciar Tarefas**
   - Arrastar tarefas entre colunas
   - Aplicar filtros para focar em objetivos específicos
   - Editar tarefas através de double-click

3. **Monitorar Prazos**
   - Identificar tarefas atrasadas (highlight vermelho)
   - Priorizar trabalho baseado em urgência

---

## 7. Requisitos Técnicos

### 7.1 Requisitos Funcionais
- [RF01] Sistema deve permitir CRUD completo de Objetivos, Hábitos e Tarefas
- [RF02] Cálculo automático de progresso em todos os níveis
- [RF03] Filtros e busca em tempo real
- [RF04] Drag-and-drop para mudança de status no Kanban
- [RF05] Seleção múltipla e operações em lote
- [RF06] Ordenação por qualquer campo
- [RF07] Paginação automática (50 itens/página)
- [RF08] Sistema de notificações e confirmações

### 7.2 Requisitos Não-Funcionais
- [RNF01] Interface responsiva (mobile, tablet, desktop)
- [RNF02] Tempo de resposta < 200ms para operações locais
- [RNF03] Acessibilidade WCAG 2.1 AA (via Radix UI)
- [RNF04] Tipagem TypeScript 100% coverage
- [RNF05] Compatibilidade com browsers modernos (ES2020+)
- [RNF06] Bundle size otimizado com tree-shaking

### 7.3 Requisitos de Performance
- **Rendering:** Virtual scrolling para listas grandes
- **State Management:** Otimização com useMemo/useCallback
- **Bundle:** Code splitting por rotas
- **Assets:** Lazy loading de componentes pesados

---

## 8. Estrutura de Componentes

### 8.1 Hierarquia de Componentes
```
App
├── ObjetivosView
│   ├── ObjetivoDialog (CRUD)
│   ├── HabitosExpandedRow
│   │   ├── HabitoDialog (CRUD)
│   │   └── TarefasExpandedRow
│   │       ├── TarefasTable
│   │       └── TarefasKanbanLocal
│   └── TarefaDialog (CRUD)
└── KanbanGlobal
    ├── FilterPanel
    ├── KanbanColumn []
    └── TaskCard []
```

### 8.2 Componentes Reutilizáveis
- **UI Components:** Button, Input, Table, Dialog, etc. (Radix UI)
- **Business Components:** ProgressBar, StatusBadge, PriorityBadge
- **Layout Components:** PageHeader, FilterBar, ActionToolbar

### 8.3 Custom Hooks
```typescript
// Hooks personalizados identificados no código
useObjetivos()    // Gerenciamento de objetivos
useHabitos()      // Gerenciamento de hábitos  
useTarefas()      // Gerenciamento de tarefas
useFilters()      // Estado de filtros
usePagination()   // Controle de paginação
```

---

## 9. API Mock e Preparação para Backend

### 9.1 Estrutura Atual (Mock)
- **Arquivo:** `src/lib/api.ts`
- **Dados:** Arrays em memória com dados iniciais
- **Funções:** Simulação completa de CRUD operations

### 9.2 Endpoints Preparados
```typescript
// Objetivos
getObjetivos(): Objetivo[]
getObjetivo(id: string): Objetivo
createObjetivo(data): Objetivo
updateObjetivo(id: string, data): Objetivo
deleteObjetivo(id: string): void
deleteObjetivos(ids: string[]): void

// Hábitos (similar para Tarefas)
getHabitos(): Habito[]
getHabito(id: string): Habito
createHabito(data): Habito
updateHabito(id: string, data): Habito
deleteHabito(id: string): void
incrementarHabito(id: string): Habito

// Funções especiais
recalcularTodosProgressos(): void
```

### 9.3 Integração Futura com Backend
- **REST API:** Endpoints já mapeados para HTTP calls
- **Estado:** Facilmente migrável para React Query/SWR
- **Otimistic Updates:** Estrutura preparada para UX otimista
- **Error Handling:** Pontos de erro identificados para tratamento

---

## 10. Testes e Qualidade

### 10.1 Estratégia de Testes (Preparada)
- **Unit Tests:** Lógica de negócio (progress-calculator.ts)
- **Component Tests:** Componentes React com RTL
- **Integration Tests:** Fluxos de usuário E2E
- **Type Tests:** Verificação de tipos TypeScript

### 10.2 Qualidade de Código
- **ESLint:** Linting configurado
- **Prettier:** Formatação automática
- **TypeScript strict:** Tipagem rigorosa ativada
- **Husky:** Git hooks para qualidade (preparado)

---

## 11. Deploy e Build

### 11.1 Build de Produção
```bash
npm run build        # Vite build otimizado
npm run preview      # Preview do build local
```

### 11.2 Deploy Options
- **Vercel:** Zero-config deployment (recomendado)
- **Netlify:** Static site hosting
- **GitHub Pages:** Para projetos open source
- **Docker:** Container preparado para deploy

---

## 12. Próximos Passos e Roadmap

### 12.1 Melhorias Imediatas
1. **Persistência:** Integração com localStorage/IndexedDB
2. **PWA:** Service worker para uso offline
3. **Export/Import:** Backup de dados em JSON
4. **Temas:** Dark mode e customização de cores

### 12.2 Features Avançadas
1. **Backend Integration:** API REST real
2. **Authentication:** Sistema de login/usuários
3. **Colaboração:** Compartilhamento de objetivos
4. **Analytics:** Dashboard com métricas e insights
5. **Mobile App:** React Native ou PWA avançada

### 12.3 Otimizações Técnicas
1. **Performance:** Virtual scrolling, lazy loading
2. **Bundle Size:** Análise e otimização de dependências
3. **Accessibility:** Testes automatizados de a11y
4. **Internationalization:** Suporte multi-idiomas

---

## 13. Conclusão

O GoalManager representa uma solução completa e moderna para gestão pessoal de objetivos, hábitos e tarefas. A aplicação foi desenvolvida seguindo as melhores práticas de desenvolvimento frontend, com foco em:

- **Experiência do Usuário:** Interface intuitiva com duas visões complementares
- **Arquitetura Escalável:** Código organizado e preparado para crescimento
- **Tecnologias Modernas:** Stack atual e performático
- **Qualidade de Código:** TypeScript, padrões e estrutura limpa

A implementação atual fornece uma base sólida que pode ser facilmente expandida com funcionalidades avançadas e integração com backend, mantendo a qualidade e performance da experiência do usuário.

---

**Documento gerado em:** 29 de Outubro de 2025  
**Versão da aplicação:** 0.1.0  
**Autor:** Product Manager - Análise do projeto GoalManager