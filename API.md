# API Documentation - GoalManager Backend
## Especificação Completa de Rotas REST

**Versão:** 1.0  
**Data:** 29 de Outubro de 2025  
**Base URL:** `https://api.goalmanager.com/v1`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Endpoints - Objetivos](#endpoints---objetivos)
4. [Endpoints - Hábitos](#endpoints---hábitos)
5. [Endpoints - Tarefas](#endpoints---tarefas)
6. [Endpoints - Utilitários](#endpoints---utilitários)
7. [Códigos de Status](#códigos-de-status)
8. [Tipos de Dados](#tipos-de-dados)
9. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

Esta API RESTful fornece todos os endpoints necessários para o frontend GoalManager. Baseada na análise do código atual, todas as funções mock foram mapeadas para rotas HTTP apropriadas.

### Características da API
- **Arquitetura:** REST com JSON
- **Autenticação:** Bearer Token (JWT)
- **Paginação:** Query parameters com limite padrão de 50 itens
- **Filtros:** Suporte a múltiplos filtros via query string
- **Ordenação:** Suporte a ordenação por qualquer campo
- **Progresso:** Cálculo automático de progresso em cascata

---

## 🔐 Autenticação

Todos os endpoints (exceto health check) requerem autenticação via Bearer Token.

```http
Authorization: Bearer <jwt_token>
```

**Headers obrigatórios:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

---

## 🎯 Endpoints - Objetivos

### `GET /objetivos`
Lista todos os objetivos do usuário com suporte a filtros e paginação.

**Query Parameters:**
```
?busca=string          # Busca em título/descrição
&status=string[]       # Filtro por status (múltiplos)
&inicio=date           # Data início (YYYY-MM-DD)
&fim=date             # Data fim (YYYY-MM-DD)
&orderBy=string       # Campo para ordenação
&orderDir=asc|desc    # Direção da ordenação
&page=number          # Página (padrão: 1)
&limit=number         # Itens por página (padrão: 50)
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "obj-123",
      "titulo": "Melhorar Saúde e Bem-estar",
      "descricao": "Objetivo de cuidar melhor da saúde física e mental",
      "inicio": "2025-01-01",
      "fim": "2025-12-31",
      "status": "em_andamento",
      "progresso": 65.5,
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-10-29T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### `GET /objetivos/:id`
Retorna um objetivo específico.

**Response 200:**
```json
{
  "data": {
    "id": "obj-123",
    "titulo": "Melhorar Saúde e Bem-estar",
    "descricao": "Objetivo de cuidar melhor da saúde física e mental",
    "inicio": "2025-01-01",
    "fim": "2025-12-31",
    "status": "em_andamento",
    "progresso": 65.5,
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": "2025-10-29T10:00:00Z"
  }
}
```

### `POST /objetivos`
Cria um novo objetivo.

**Request Body:**
```json
{
  "titulo": "Novo Objetivo",
  "descricao": "Descrição opcional",
  "inicio": "2025-11-01",
  "fim": "2025-12-31",
  "status": "planejado",
  "progresso": 0
}
```

**Response 201:**
```json
{
  "data": {
    "id": "obj-456",
    "titulo": "Novo Objetivo",
    "descricao": "Descrição opcional",
    "inicio": "2025-11-01",
    "fim": "2025-12-31",
    "status": "planejado",
    "progresso": 0,
    "createdAt": "2025-10-29T10:00:00Z",
    "updatedAt": "2025-10-29T10:00:00Z"
  }
}
```

### `PUT /objetivos/:id`
Atualiza um objetivo existente.

**Request Body:** (campos opcionais)
```json
{
  "titulo": "Título atualizado",
  "descricao": "Nova descrição",
  "status": "em_andamento"
}
```

**Response 200:** *(mesmo formato do GET)*

### `DELETE /objetivos/:id`
Remove um objetivo e todos os hábitos/tarefas vinculados.

**Response 204:** *(sem conteúdo)*

### `DELETE /objetivos`
Remove múltiplos objetivos.

**Request Body:**
```json
{
  "ids": ["obj-123", "obj-456", "obj-789"]
}
```

**Response 200:**
```json
{
  "message": "3 objetivos removidos com sucesso",
  "deletedCount": 3
}
```

---

## 🔄 Endpoints - Hábitos

### `GET /habitos`
Lista todos os hábitos do usuário.

**Query Parameters:**
```
?objetivoId=string     # Filtro por objetivo
&busca=string          # Busca em título/descrição
&status=string[]       # Filtro por status
&frequencia=string[]   # Filtro por frequência
&orderBy=string        # Campo para ordenação
&orderDir=asc|desc     # Direção da ordenação
&page=number           # Página
&limit=number          # Itens por página
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "hab-123",
      "objetivoId": "obj-123",
      "titulo": "Exercícios Físicos",
      "descricao": "Praticar atividade física regularmente",
      "frequencia": "semanal",
      "alvoPorPeriodo": 5,
      "realizadosNoPeriodo": 3,
      "status": "ativo",
      "progresso": 60.0,
      "createdAt": "2025-01-05T10:00:00Z",
      "updatedAt": "2025-10-29T10:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

### `GET /habitos/:id`
Retorna um hábito específico.

### `GET /objetivos/:objetivoId/habitos`
Lista hábitos de um objetivo específico.

### `POST /habitos`
Cria um novo hábito.

**Request Body:**
```json
{
  "objetivoId": "obj-123",
  "titulo": "Novo Hábito",
  "descricao": "Descrição opcional",
  "frequencia": "diario",
  "alvoPorPeriodo": 1,
  "realizadosNoPeriodo": 0,
  "status": "ativo"
}
```

### `PUT /habitos/:id`
Atualiza um hábito existente.

### `DELETE /habitos/:id`
Remove um hábito e tarefas vinculadas.

### `DELETE /habitos`
Remove múltiplos hábitos.

### `POST /habitos/:id/marcar-feito`
Incrementa contador de realizações do hábito.

**Response 200:**
```json
{
  "data": {
    "id": "hab-123",
    "realizadosNoPeriodo": 4,
    "progresso": 80.0,
    "updatedAt": "2025-10-29T10:00:00Z"
  }
}
```

### `POST /habitos/:id/reset-ciclo`
Reseta contador de realizações para zero.

**Response 200:**
```json
{
  "data": {
    "id": "hab-123",
    "realizadosNoPeriodo": 0,
    "progresso": 0.0,
    "updatedAt": "2025-10-29T10:00:00Z"
  }
}
```

---

## ✅ Endpoints - Tarefas

### `GET /tarefas`
Lista todas as tarefas do usuário.

**Query Parameters:**
```
?objetivoId=string     # Filtro por objetivo
&habitoId=string       # Filtro por hábito
&busca=string          # Busca em título/descrição
&status=string[]       # Filtro por status
&prioridade=string[]   # Filtro por prioridade
&prazoInicio=date      # Prazo a partir de
&prazoFim=date         # Prazo até
&orderBy=string        # Campo para ordenação
&orderDir=asc|desc     # Direção da ordenação
&page=number           # Página
&limit=number          # Itens por página
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "tar-123",
      "objetivoId": "obj-123",
      "habitoId": "hab-123",
      "titulo": "Fazer exercícios na academia",
      "descricao": "Treino de força completo",
      "prioridade": "alta",
      "status": "fazendo",
      "estimativaHoras": 2.0,
      "horasGastas": 0.5,
      "prazo": "2025-10-30",
      "progresso": 25.0,
      "createdAt": "2025-10-29T10:00:00Z",
      "updatedAt": "2025-10-29T12:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

### `GET /tarefas/:id`
Retorna uma tarefa específica.

### `GET /objetivos/:objetivoId/tarefas`
Lista tarefas diretas de um objetivo.

### `GET /habitos/:habitoId/tarefas`
Lista tarefas de um hábito específico.

### `POST /tarefas`
Cria uma nova tarefa.

**Request Body:**
```json
{
  "objetivoId": "obj-123",
  "habitoId": "hab-123",
  "titulo": "Nova Tarefa",
  "descricao": "Descrição opcional",
  "prioridade": "media",
  "status": "backlog",
  "estimativaHoras": 3.0,
  "horasGastas": 0,
  "prazo": "2025-11-05",
  "progresso": 0
}
```

### `PUT /tarefas/:id`
Atualiza uma tarefa existente.

**Request Body:** (campos opcionais)
```json
{
  "status": "concluida",
  "progresso": 100,
  "horasGastas": 2.5
}
```

### `DELETE /tarefas/:id`
Remove uma tarefa.

### `DELETE /tarefas`
Remove múltiplas tarefas.

**Request Body:**
```json
{
  "ids": ["tar-123", "tar-456", "tar-789"]
}
```

---

## 🔧 Endpoints - Utilitários

### `POST /recalcular-progressos`
Força recálculo de todos os progressos do usuário.

**Response 200:**
```json
{
  "message": "Progressos recalculados com sucesso",
  "updatedAt": "2025-10-29T10:00:00Z"
}
```

### `GET /health`
Health check da API (não requer autenticação).

**Response 200:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-29T10:00:00Z",
  "version": "1.0.0"
}
```

### `GET /dashboard`
Dados agregados para dashboard.

**Response 200:**
```json
{
  "data": {
    "totalObjetivos": 15,
    "objetivosAtivos": 8,
    "totalHabitos": 45,
    "habitosAtivos": 32,
    "totalTarefas": 156,
    "tarefasConcluidas": 89,
    "progressoGeral": 72.5
  }
}
```

---

## 📊 Códigos de Status HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| `200`  | OK | Requisição bem-sucedida |
| `201`  | Created | Recurso criado com sucesso |
| `204`  | No Content | Recurso removido com sucesso |
| `400`  | Bad Request | Dados inválidos na requisição |
| `401`  | Unauthorized | Token de autenticação inválido |
| `403`  | Forbidden | Usuário sem permissão |
| `404`  | Not Found | Recurso não encontrado |
| `409`  | Conflict | Conflito (ex: duplicação) |
| `422`  | Unprocessable Entity | Dados válidos mas não processáveis |
| `500`  | Internal Server Error | Erro interno do servidor |

---

## 📝 Tipos de Dados

### Enums

```typescript
// Status
export type StatusObjetivo = 'planejado' | 'em_andamento' | 'concluido' | 'arquivado';
export type StatusHabito = 'ativo' | 'pausado' | 'concluido';
export type StatusTarefa = 'backlog' | 'a_fazer' | 'fazendo' | 'bloqueada' | 'concluida';

// Outros
export type Prioridade = 'baixa' | 'media' | 'alta';
export type Frequencia = 'diario' | 'semanal' | 'mensal';
```

### Estruturas de Erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      {
        "field": "titulo",
        "message": "Título é obrigatório"
      }
    ]
  }
}
```

### Paginação Padrão

```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156,
    "totalPages": 4,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔧 Exemplos de Uso

### Criando um Objetivo Completo

```bash
# 1. Criar objetivo
curl -X POST /api/v1/objetivos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Aprender TypeScript",
    "descricao": "Dominar TypeScript para desenvolvimento web",
    "inicio": "2025-11-01",
    "fim": "2025-12-31",
    "status": "planejado"
  }'

# 2. Criar hábito vinculado
curl -X POST /api/v1/habitos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objetivoId": "obj-456",
    "titulo": "Estudar TypeScript",
    "frequencia": "diario",
    "alvoPorPeriodo": 1,
    "status": "ativo"
  }'

# 3. Criar tarefa vinculada
curl -X POST /api/v1/tarefas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objetivoId": "obj-456",
    "habitoId": "hab-789",
    "titulo": "Ler documentação oficial",
    "prioridade": "alta",
    "status": "a_fazer",
    "estimativaHoras": 3,
    "prazo": "2025-11-05"
  }'
```

### Filtrando Dados

```bash
# Buscar objetivos em andamento
GET /api/v1/objetivos?status=em_andamento&orderBy=progresso&orderDir=desc

# Tarefas de alta prioridade com prazo próximo
GET /api/v1/tarefas?prioridade=alta&prazoFim=2025-11-05&status=a_fazer,fazendo

# Hábitos de um objetivo específico
GET /api/v1/objetivos/obj-123/habitos?status=ativo
```

### Atualizando Status no Kanban

```bash
# Mover tarefa de "A Fazer" para "Fazendo"
curl -X PUT /api/v1/tarefas/tar-123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "fazendo"
  }'
```

### Marcando Hábito como Feito

```bash
# Incrementar contador do hábito
curl -X POST /api/v1/habitos/hab-123/marcar-feito \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛡️ Segurança e Validações

### Validações Obrigatórias

1. **Autenticação:** Todos os endpoints (exceto `/health`)
2. **Autorização:** Usuário só acessa seus próprios dados
3. **Validação de dados:** Campos obrigatórios e tipos corretos
4. **Rate Limiting:** Limite de requisições por minuto
5. **CORS:** Configuração adequada para frontend

### Regras de Negócio

1. **Progresso automático:** Recalcular quando tarefas/hábitos mudam
2. **Cascata de exclusão:** Remover entidades dependentes
3. **Validação de datas:** Início antes do fim
4. **Status válidos:** Transições de status válidas
5. **Limites:** Progresso entre 0-100

### Headers de Resposta

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635552000
Cache-Control: no-cache, no-store, must-revalidate
```

---

## 📋 Checklist de Implementação

### Endpoints Essenciais (Prioridade Alta)
- [ ] `GET/POST/PUT/DELETE /objetivos`
- [ ] `GET/POST/PUT/DELETE /habitos`
- [ ] `GET/POST/PUT/DELETE /tarefas`
- [ ] `POST /habitos/:id/marcar-feito`
- [ ] `POST /recalcular-progressos`

### Funcionalidades Avançadas (Prioridade Média)
- [ ] Filtros e busca em todos os endpoints
- [ ] Paginação com metadados
- [ ] Ordenação por qualquer campo
- [ ] Operações em lote (exclusão múltipla)
- [ ] Dashboard com dados agregados

### Recursos Adicionais (Prioridade Baixa)
- [ ] Export/import de dados
- [ ] Versionamento de API
- [ ] Webhooks para notificações
- [ ] Cache com Redis
- [ ] Logs estruturados

---

**Documento criado em:** 29 de Outubro de 2025  
**Baseado na análise do frontend GoalManager v0.1.0**  
**Total de endpoints:** 25+ rotas mapeadas