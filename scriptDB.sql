-- =========================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS - GOALMANAGER
-- =========================================================================
-- Versão: 1.0
-- Data: 29 de Outubro de 2025
-- SGBD: MySQL 8.0+
-- Charset: UTF8MB4 (suporte completo Unicode)
-- Collation: utf8mb4_unicode_ci
-- =========================================================================

-- Criar banco de dados
DROP DATABASE IF EXISTS goalmanager;
CREATE DATABASE goalmanager 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE goalmanager;

-- =========================================================================
-- CONFIGURAÇÕES INICIAIS
-- =========================================================================

-- Configurar timezone
SET time_zone = '+00:00';

-- Configurar modo SQL para compatibilidade
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- =========================================================================
-- TABELAS DE USUÁRIOS E AUTENTICAÇÃO
-- =========================================================================

-- Tabela de usuários
CREATE TABLE usuarios (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT NULL,
    preferencias JSON NULL,
    ativo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    ultimo_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_ativo (ativo),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Tabela de tokens de autenticação
CREATE TABLE tokens_auth (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    tipo ENUM('access', 'refresh', 'reset_password', 'verify_email') NOT NULL,
    expires_at DATETIME NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_usuario_id (usuario_id)
) ENGINE=InnoDB;

-- =========================================================================
-- TABELAS PRINCIPAIS DO SISTEMA
-- =========================================================================

-- Tabela de objetivos
CREATE TABLE objetivos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    inicio DATE NULL,
    fim DATE NULL,
    status ENUM('planejado', 'em_andamento', 'concluido', 'arquivado') NOT NULL DEFAULT 'planejado',
    progresso DECIMAL(5,2) DEFAULT 0.00 CHECK (progresso >= 0 AND progresso <= 100),
    cor VARCHAR(7) NULL COMMENT 'Cor em hexadecimal (#RRGGBB)',
    icone VARCHAR(50) NULL COMMENT 'Nome do ícone',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_status (status),
    INDEX idx_progresso (progresso),
    INDEX idx_inicio_fim (inicio, fim),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_titulo_descricao (titulo, descricao)
) ENGINE=InnoDB;

-- Tabela de hábitos
CREATE TABLE habitos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    objetivo_id CHAR(36) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    frequencia ENUM('diario', 'semanal', 'mensal') NOT NULL,
    alvo_por_periodo INT NOT NULL CHECK (alvo_por_periodo > 0),
    realizados_no_periodo INT DEFAULT 0 CHECK (realizados_no_periodo >= 0),
    status ENUM('ativo', 'pausado', 'concluido') NOT NULL DEFAULT 'ativo',
    progresso DECIMAL(5,2) DEFAULT 0.00 CHECK (progresso >= 0 AND progresso <= 100),
    periodo_inicio DATE NULL COMMENT 'Início do período atual de contagem',
    cor VARCHAR(7) NULL,
    icone VARCHAR(50) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (objetivo_id) REFERENCES objetivos(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_objetivo_id (objetivo_id),
    INDEX idx_status (status),
    INDEX idx_frequencia (frequencia),
    INDEX idx_progresso (progresso),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_titulo_descricao (titulo, descricao)
) ENGINE=InnoDB;

-- Tabela de tarefas
CREATE TABLE tarefas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    objetivo_id CHAR(36) NULL,
    habito_id CHAR(36) NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    prioridade ENUM('baixa', 'media', 'alta') NULL,
    status ENUM('backlog', 'a_fazer', 'fazendo', 'bloqueada', 'concluida') NOT NULL DEFAULT 'backlog',
    estimativa_horas DECIMAL(6,2) NULL CHECK (estimativa_horas >= 0),
    horas_gastas DECIMAL(6,2) DEFAULT 0.00 CHECK (horas_gastas >= 0),
    prazo DATE NULL,
    progresso DECIMAL(5,2) DEFAULT 0.00 CHECK (progresso >= 0 AND progresso <= 100),
    posicao INT NULL COMMENT 'Posição para ordenação personalizada',
    tags JSON NULL COMMENT 'Array de tags para categorização',
    anexos JSON NULL COMMENT 'Array de URLs de anexos',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (objetivo_id) REFERENCES objetivos(id) ON DELETE SET NULL,
    FOREIGN KEY (habito_id) REFERENCES habitos(id) ON DELETE SET NULL,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_objetivo_id (objetivo_id),
    INDEX idx_habito_id (habito_id),
    INDEX idx_status (status),
    INDEX idx_prioridade (prioridade),
    INDEX idx_prazo (prazo),
    INDEX idx_progresso (progresso),
    INDEX idx_posicao (posicao),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_titulo_descricao (titulo, descricao)
) ENGINE=InnoDB;

-- =========================================================================
-- TABELAS DE HISTÓRICO E AUDITORIA
-- =========================================================================

-- Tabela de histórico de realizações de hábitos
CREATE TABLE habito_realizacoes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    habito_id CHAR(36) NOT NULL,
    usuario_id CHAR(36) NOT NULL,
    data_realizacao DATE NOT NULL,
    quantidade INT DEFAULT 1 CHECK (quantidade > 0),
    observacoes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (habito_id) REFERENCES habitos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_habito_id (habito_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_data_realizacao (data_realizacao),
    UNIQUE KEY uk_habito_data (habito_id, data_realizacao)
) ENGINE=InnoDB;

-- Tabela de log de alterações (auditoria)
CREATE TABLE audit_log (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    tabela VARCHAR(50) NOT NULL,
    registro_id CHAR(36) NOT NULL,
    acao ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    dados_antigos JSON NULL,
    dados_novos JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_tabela (tabela),
    INDEX idx_registro_id (registro_id),
    INDEX idx_acao (acao),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- =========================================================================
-- TABELAS DE CONFIGURAÇÃO E PERSONALIZAÇÃO
-- =========================================================================

-- Tabela de configurações do sistema
CREATE TABLE configuracoes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor JSON NOT NULL,
    descricao TEXT NULL,
    categoria VARCHAR(50) NOT NULL,
    editavel BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_chave (chave),
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB;

-- =========================================================================
-- VIEWS PARA FACILITAR CONSULTAS
-- =========================================================================

-- View de objetivos com estatísticas
CREATE VIEW vw_objetivos_estatisticas AS
SELECT 
    o.id,
    o.usuario_id,
    o.titulo,
    o.descricao,
    o.inicio,
    o.fim,
    o.status,
    o.progresso,
    o.cor,
    o.icone,
    o.created_at,
    o.updated_at,
    COUNT(DISTINCT h.id) as total_habitos,
    COUNT(DISTINCT CASE WHEN h.status = 'ativo' THEN h.id END) as habitos_ativos,
    COUNT(DISTINCT t.id) as total_tarefas,
    COUNT(DISTINCT CASE WHEN t.status = 'concluida' THEN t.id END) as tarefas_concluidas,
    COALESCE(AVG(h.progresso), 0) as progresso_medio_habitos,
    COALESCE(AVG(CASE WHEN t.status = 'concluida' THEN 100 ELSE t.progresso END), 0) as progresso_medio_tarefas
FROM objetivos o
LEFT JOIN habitos h ON o.id = h.objetivo_id AND h.usuario_id = o.usuario_id
LEFT JOIN tarefas t ON o.id = t.objetivo_id AND t.usuario_id = o.usuario_id
GROUP BY o.id, o.usuario_id, o.titulo, o.descricao, o.inicio, o.fim, o.status, o.progresso, o.cor, o.icone, o.created_at, o.updated_at;

-- View de tarefas com informações relacionadas
CREATE VIEW vw_tarefas_completas AS
SELECT 
    t.id,
    t.usuario_id,
    t.titulo,
    t.descricao,
    t.prioridade,
    t.status,
    t.estimativa_horas,
    t.horas_gastas,
    t.prazo,
    t.progresso,
    t.posicao,
    t.tags,
    t.anexos,
    t.created_at,
    t.updated_at,
    o.titulo as objetivo_titulo,
    o.cor as objetivo_cor,
    h.titulo as habito_titulo,
    h.frequencia as habito_frequencia,
    CASE 
        WHEN t.prazo IS NOT NULL AND t.prazo < CURDATE() AND t.status NOT IN ('concluida') 
        THEN TRUE 
        ELSE FALSE 
    END as em_atraso
FROM tarefas t
LEFT JOIN objetivos o ON t.objetivo_id = o.id
LEFT JOIN habitos h ON t.habito_id = h.id;

-- =========================================================================
-- TRIGGERS PARA AUTOMAÇÃO
-- =========================================================================

DELIMITER $$

-- Trigger para recalcular progresso do hábito quando realizações mudam
CREATE TRIGGER tr_habito_realizacoes_after_insert
AFTER INSERT ON habito_realizacoes
FOR EACH ROW
BEGIN
    CALL sp_recalcular_progresso_habito(NEW.habito_id);
END$$

CREATE TRIGGER tr_habito_realizacoes_after_delete
AFTER DELETE ON habito_realizacoes
FOR EACH ROW
BEGIN
    CALL sp_recalcular_progresso_habito(OLD.habito_id);
END$$

-- Trigger para atualizar progresso quando tarefa muda de status
CREATE TRIGGER tr_tarefas_after_update
AFTER UPDATE ON tarefas
FOR EACH ROW
BEGIN
    -- Se status mudou para concluida, definir progresso como 100
    IF NEW.status = 'concluida' AND OLD.status != 'concluida' THEN
        UPDATE tarefas SET progresso = 100.00 WHERE id = NEW.id;
    END IF;
    
    -- Recalcular progresso dos hábitos e objetivos relacionados
    IF NEW.habito_id IS NOT NULL THEN
        CALL sp_recalcular_progresso_habito(NEW.habito_id);
    END IF;
    
    IF NEW.objetivo_id IS NOT NULL THEN
        CALL sp_recalcular_progresso_objetivo(NEW.objetivo_id);
    END IF;
END$$

-- Trigger para audit log
CREATE TRIGGER tr_objetivos_audit_insert
AFTER INSERT ON objetivos
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (usuario_id, tabela, registro_id, acao, dados_novos)
    VALUES (NEW.usuario_id, 'objetivos', NEW.id, 'CREATE', JSON_OBJECT(
        'titulo', NEW.titulo,
        'status', NEW.status,
        'progresso', NEW.progresso
    ));
END$$

CREATE TRIGGER tr_objetivos_audit_update
AFTER UPDATE ON objetivos
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (usuario_id, tabela, registro_id, acao, dados_antigos, dados_novos)
    VALUES (NEW.usuario_id, 'objetivos', NEW.id, 'UPDATE', 
        JSON_OBJECT('titulo', OLD.titulo, 'status', OLD.status, 'progresso', OLD.progresso),
        JSON_OBJECT('titulo', NEW.titulo, 'status', NEW.status, 'progresso', NEW.progresso)
    );
END$$

DELIMITER ;

-- =========================================================================
-- STORED PROCEDURES
-- =========================================================================

DELIMITER $$

-- Procedure para recalcular progresso do hábito
CREATE PROCEDURE sp_recalcular_progresso_habito(IN habito_id_param CHAR(36))
BEGIN
    DECLARE novo_progresso DECIMAL(5,2);
    DECLARE alvo INT;
    DECLARE realizados INT;
    
    SELECT alvo_por_periodo, realizados_no_periodo 
    INTO alvo, realizados
    FROM habitos 
    WHERE id = habito_id_param;
    
    SET novo_progresso = LEAST(100.00, (realizados / alvo) * 100);
    
    UPDATE habitos 
    SET progresso = novo_progresso,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = habito_id_param;
    
    -- Recalcular progresso do objetivo pai
    SELECT objetivo_id INTO @objetivo_id FROM habitos WHERE id = habito_id_param;
    IF @objetivo_id IS NOT NULL THEN
        CALL sp_recalcular_progresso_objetivo(@objetivo_id);
    END IF;
END$$

-- Procedure para recalcular progresso do objetivo
CREATE PROCEDURE sp_recalcular_progresso_objetivo(IN objetivo_id_param CHAR(36))
BEGIN
    DECLARE novo_progresso DECIMAL(5,2) DEFAULT 0.00;
    
    SELECT AVG(progresso_item) INTO novo_progresso
    FROM (
        SELECT progresso as progresso_item FROM habitos 
        WHERE objetivo_id = objetivo_id_param
        UNION ALL
        SELECT CASE WHEN status = 'concluida' THEN 100.00 ELSE progresso END as progresso_item
        FROM tarefas 
        WHERE objetivo_id = objetivo_id_param AND habito_id IS NULL
    ) items;
    
    UPDATE objetivos 
    SET progresso = COALESCE(novo_progresso, 0.00),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = objetivo_id_param;
END$$

-- Procedure para marcar hábito como feito
CREATE PROCEDURE sp_marcar_habito_feito(
    IN habito_id_param CHAR(36),
    IN usuario_id_param CHAR(36),
    IN data_realizacao_param DATE,
    IN quantidade_param INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Inserir ou atualizar realização
    INSERT INTO habito_realizacoes (habito_id, usuario_id, data_realizacao, quantidade)
    VALUES (habito_id_param, usuario_id_param, data_realizacao_param, quantidade_param)
    ON DUPLICATE KEY UPDATE 
        quantidade = quantidade + quantidade_param,
        observacoes = CONCAT(COALESCE(observacoes, ''), ' [Incrementado]');
    
    -- Atualizar contador no hábito
    UPDATE habitos 
    SET realizados_no_periodo = realizados_no_periodo + quantidade_param,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = habito_id_param AND usuario_id = usuario_id_param;
    
    -- Recalcular progresso
    CALL sp_recalcular_progresso_habito(habito_id_param);
    
    COMMIT;
END$$

-- Procedure para resetar ciclo do hábito
CREATE PROCEDURE sp_resetar_ciclo_habito(
    IN habito_id_param CHAR(36),
    IN usuario_id_param CHAR(36)
)
BEGIN
    UPDATE habitos 
    SET realizados_no_periodo = 0,
        progresso = 0.00,
        periodo_inicio = CURDATE(),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = habito_id_param AND usuario_id = usuario_id_param;
END$$

-- Procedure para dashboard do usuário
CREATE PROCEDURE sp_dashboard_usuario(IN usuario_id_param CHAR(36))
BEGIN
    SELECT 
        COUNT(DISTINCT o.id) as total_objetivos,
        COUNT(DISTINCT CASE WHEN o.status = 'em_andamento' THEN o.id END) as objetivos_ativos,
        COUNT(DISTINCT h.id) as total_habitos,
        COUNT(DISTINCT CASE WHEN h.status = 'ativo' THEN h.id END) as habitos_ativos,
        COUNT(DISTINCT t.id) as total_tarefas,
        COUNT(DISTINCT CASE WHEN t.status = 'concluida' THEN t.id END) as tarefas_concluidas,
        COALESCE(AVG(o.progresso), 0) as progresso_medio_objetivos,
        COUNT(DISTINCT CASE WHEN t.prazo < CURDATE() AND t.status NOT IN ('concluida') THEN t.id END) as tarefas_atrasadas
    FROM usuarios u
    LEFT JOIN objetivos o ON u.id = o.usuario_id
    LEFT JOIN habitos h ON u.id = h.usuario_id
    LEFT JOIN tarefas t ON u.id = t.usuario_id
    WHERE u.id = usuario_id_param
    GROUP BY u.id;
END$$

DELIMITER ;

-- =========================================================================
-- DADOS INICIAIS PARA DESENVOLVIMENTO
-- =========================================================================

-- Configurações padrão do sistema
INSERT INTO configuracoes (chave, valor, descricao, categoria) VALUES
('app_name', '"GoalManager"', 'Nome da aplicação', 'geral'),
('max_objetivos_por_usuario', '50', 'Máximo de objetivos por usuário', 'limites'),
('max_habitos_por_objetivo', '20', 'Máximo de hábitos por objetivo', 'limites'),
('max_tarefas_por_habito', '100', 'Máximo de tarefas por hábito', 'limites'),
('cores_padrao', '["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"]', 'Cores padrão do sistema', 'interface'),
('timezone_padrao', '"UTC"', 'Timezone padrão do sistema', 'geral'),
('notificacoes_email', 'true', 'Habilitar notificações por email', 'notificacoes');

-- Usuário de exemplo para desenvolvimento (senha: 123456)
INSERT INTO usuarios (id, nome, email, senha_hash, ativo, email_verificado) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Usuário Teste', 'teste@goalmanager.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE, TRUE);

-- Objetivos de exemplo
INSERT INTO objetivos (id, usuario_id, titulo, descricao, inicio, fim, status, progresso) VALUES
('obj-1', '550e8400-e29b-41d4-a716-446655440000', 'Melhorar Saúde e Bem-estar', 'Objetivo de cuidar melhor da saúde física e mental', '2025-01-01', '2025-12-31', 'em_andamento', 0.00),
('obj-2', '550e8400-e29b-41d4-a716-446655440000', 'Avançar na Carreira de Desenvolvimento', 'Estudar novas tecnologias e construir projetos práticos', '2025-02-01', '2025-11-30', 'em_andamento', 0.00),
('obj-3', '550e8400-e29b-41d4-a716-446655440000', 'Organizar Finanças Pessoais', 'Criar reserva de emergência e controlar gastos', '2025-03-01', NULL, 'planejado', 0.00);

-- Hábitos de exemplo
INSERT INTO habitos (id, usuario_id, objetivo_id, titulo, descricao, frequencia, alvo_por_periodo, realizados_no_periodo, status) VALUES
('hab-1', '550e8400-e29b-41d4-a716-446655440000', 'obj-1', 'Exercícios Físicos', 'Praticar atividade física regularmente', 'semanal', 5, 3, 'ativo'),
('hab-2', '550e8400-e29b-41d4-a716-446655440000', 'obj-1', 'Meditação Diária', 'Meditar 10 minutos todos os dias', 'diario', 1, 1, 'ativo'),
('hab-3', '550e8400-e29b-41d4-a716-446655440000', 'obj-2', 'Estudar React e TypeScript', 'Dedicar tempo ao estudo de frontend moderno', 'semanal', 10, 7, 'ativo'),
('hab-4', '550e8400-e29b-41d4-a716-446655440000', 'obj-2', 'Contribuir para Open Source', 'Fazer pelo menos 2 PRs por mês', 'mensal', 2, 1, 'ativo'),
('hab-5', '550e8400-e29b-41d4-a716-446655440000', 'obj-3', 'Revisar Gastos Mensais', 'Categorizar e revisar todos os gastos do mês', 'mensal', 1, 0, 'ativo');

-- Tarefas de exemplo
INSERT INTO tarefas (id, usuario_id, objetivo_id, habito_id, titulo, descricao, prioridade, status, estimativa_horas, horas_gastas, prazo, progresso) VALUES
('tar-1', '550e8400-e29b-41d4-a716-446655440000', 'obj-1', 'hab-1', 'Fazer exercícios na academia', 'Treino de força completo', 'alta', 'fazendo', 2.00, 0.50, '2025-10-30', 25.00),
('tar-2', '550e8400-e29b-41d4-a716-446655440000', 'obj-1', 'hab-1', 'Correr no parque', 'Corrida leve de 30 minutos', 'media', 'a_fazer', 0.50, 0.00, '2025-10-31', 0.00),
('tar-3', '550e8400-e29b-41d4-a716-446655440000', 'obj-1', 'hab-2', 'Sessão de meditação matinal', 'Meditação guiada de 10 minutos', 'media', 'concluida', 0.20, 0.20, '2025-10-29', 100.00),
('tar-4', '550e8400-e29b-41d4-a716-446655440000', 'obj-2', 'hab-3', 'Estudar React Hooks', 'Completar tutorial sobre useEffect e useState', 'alta', 'fazendo', 3.00, 1.50, '2025-11-02', 50.00),
('tar-5', '550e8400-e29b-41d4-a716-446655440000', 'obj-2', 'hab-3', 'Projeto prático TypeScript', 'Criar aplicação CRUD com TypeScript', 'alta', 'a_fazer', 8.00, 0.00, '2025-11-10', 0.00),
('tar-6', '550e8400-e29b-41d4-a716-446655440000', 'obj-2', 'hab-4', 'Contribuir para projeto Vue.js', 'Fazer PR para correção de bug', 'media', 'backlog', 4.00, 0.00, '2025-11-15', 0.00),
('tar-7', '550e8400-e29b-41d4-a716-446655440000', 'obj-3', 'hab-5', 'Categorizar gastos de outubro', 'Organizar todas as despesas do mês', 'alta', 'a_fazer', 2.00, 0.00, '2025-11-01', 0.00),
('tar-8', '550e8400-e29b-41d4-a716-446655440000', 'obj-1', NULL, 'Consulta médica anual', 'Check-up médico completo', 'alta', 'a_fazer', 2.00, 0.00, '2025-12-15', 0.00);

-- Realizações de hábitos de exemplo
INSERT INTO habito_realizacoes (habito_id, usuario_id, data_realizacao, quantidade, observacoes) VALUES
('hab-1', '550e8400-e29b-41d4-a716-446655440000', '2025-10-27', 1, 'Treino de força - pernas'),
('hab-1', '550e8400-e29b-41d4-a716-446655440000', '2025-10-28', 1, 'Treino de força - braços'),
('hab-1', '550e8400-e29b-41d4-a716-446655440000', '2025-10-29', 1, 'Corrida leve'),
('hab-2', '550e8400-e29b-41d4-a716-446655440000', '2025-10-29', 1, 'Meditação matinal'),
('hab-3', '550e8400-e29b-41d4-a716-446655440000', '2025-10-27', 2, 'Estudou React Hooks'),
('hab-3', '550e8400-e29b-41d4-a716-446655440000', '2025-10-28', 3, 'Projeto TypeScript'),
('hab-3', '550e8400-e29b-41d4-a716-446655440000', '2025-10-29', 2, 'Review de código'),
('hab-4', '550e8400-e29b-41d4-a716-446655440000', '2025-10-15', 1, 'PR para correção de bug');

-- Recalcular progressos iniciais
CALL sp_recalcular_progresso_habito('hab-1');
CALL sp_recalcular_progresso_habito('hab-2');
CALL sp_recalcular_progresso_habito('hab-3');
CALL sp_recalcular_progresso_habito('hab-4');
CALL sp_recalcular_progresso_habito('hab-5');

CALL sp_recalcular_progresso_objetivo('obj-1');
CALL sp_recalcular_progresso_objetivo('obj-2');
CALL sp_recalcular_progresso_objetivo('obj-3');

-- =========================================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =========================================================================

-- Índices compostos para queries comuns
CREATE INDEX idx_tarefas_usuario_status ON tarefas(usuario_id, status);
CREATE INDEX idx_tarefas_prazo_status ON tarefas(prazo, status);
CREATE INDEX idx_habitos_usuario_objetivo ON habitos(usuario_id, objetivo_id);
CREATE INDEX idx_realizacoes_habito_data ON habito_realizacoes(habito_id, data_realizacao);

-- Índices para performance de ordenação
CREATE INDEX idx_objetivos_progresso_desc ON objetivos(progresso DESC);
CREATE INDEX idx_tarefas_prioridade_prazo ON tarefas(prioridade, prazo);

-- =========================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO FINAL
-- =========================================================================

-- Adicionando comentários às tabelas principais
ALTER TABLE objetivos COMMENT = 'Tabela principal de objetivos dos usuários';
ALTER TABLE habitos COMMENT = 'Hábitos vinculados aos objetivos com controle de frequência';
ALTER TABLE tarefas COMMENT = 'Tarefas específicas que podem ser vinculadas a objetivos ou hábitos';
ALTER TABLE habito_realizacoes COMMENT = 'Histórico de realizações dos hábitos';
ALTER TABLE audit_log COMMENT = 'Log de auditoria para rastreamento de alterações';

-- =========================================================================
-- SCRIPT DE VERIFICAÇÃO E TESTES
-- =========================================================================

-- Verificar estrutura criada
SELECT 
    'Tabelas criadas:' as info,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'goalmanager';

-- Verificar índices criados
SELECT 
    'Índices criados:' as info,
    COUNT(*) as total
FROM information_schema.statistics 
WHERE table_schema = 'goalmanager';

-- Verificar triggers criados
SELECT 
    'Triggers criados:' as info,
    COUNT(*) as total
FROM information_schema.triggers 
WHERE trigger_schema = 'goalmanager';

-- Verificar procedures criadas
SELECT 
    'Procedures criadas:' as info,
    COUNT(*) as total
FROM information_schema.routines 
WHERE routine_schema = 'goalmanager' AND routine_type = 'PROCEDURE';

-- Verificar views criadas
SELECT 
    'Views criadas:' as info,
    COUNT(*) as total
FROM information_schema.views 
WHERE table_schema = 'goalmanager';

-- Teste rápido de funcionamento
SELECT 
    u.nome as usuario,
    COUNT(DISTINCT o.id) as objetivos,
    COUNT(DISTINCT h.id) as habitos,
    COUNT(DISTINCT t.id) as tarefas
FROM usuarios u
LEFT JOIN objetivos o ON u.id = o.usuario_id
LEFT JOIN habitos h ON u.id = h.usuario_id
LEFT JOIN tarefas t ON u.id = t.usuario_id
GROUP BY u.id, u.nome;

-- =========================================================================
-- FIM DO SCRIPT
-- =========================================================================

-- Mensagem de conclusão
SELECT 
    'GoalManager Database' as sistema,
    '1.0' as versao,
    'Banco de dados criado com sucesso!' as status,
    NOW() as data_criacao;

-- Recomendações pós-instalação:
-- 1. Criar usuário específico para a aplicação com permissões limitadas
-- 2. Configurar backup automático
-- 3. Configurar monitoring de performance
-- 4. Revisar configurações de timezone conforme necessidade
-- 5. Implementar rotina de limpeza de logs antigos