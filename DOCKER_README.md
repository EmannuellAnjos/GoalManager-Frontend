# Docker Setup - GoalManager Database

Este diretório contém a configuração Docker completa para o banco de dados do projeto GoalManager.

## 🚀 Quick Start

```bash
# 1. Copiar arquivo de ambiente
cp .env.example .env

# 2. Ajustar configurações no .env (opcional)
# Edite o arquivo .env conforme necessário

# 3. Iniciar todos os serviços
docker-compose up -d

# 4. Verificar status dos containers
docker-compose ps

# 5. Acessar logs
docker-compose logs -f mysql
```

## 📋 Serviços Incluídos

| Serviço | Porta | Descrição | Acesso |
|---------|-------|-----------|---------|
| **MySQL** | 3306 | Banco de dados principal | `mysql://localhost:3306` |
| **phpMyAdmin** | 8080 | Interface web para MySQL | http://localhost:8080 |
| **Adminer** | 8081 | Interface alternativa leve | http://localhost:8081 |

## 🔐 Credenciais Padrão

### MySQL
- **Host:** localhost:3306
- **Database:** goalmanager
- **Username:** goalmanager_user
- **Password:** goalmanager_pass123
- **Root Password:** root123!@#

### phpMyAdmin/Adminer
- Use as mesmas credenciais do MySQL
- Ou use root com a senha root

> ⚠️ **IMPORTANTE:** Altere as senhas padrão em produção!

## 📂 Estrutura de Arquivos

```
docker/
├── mysql/
│   └── conf.d/
│       └── my.cnf          # Configurações otimizadas do MySQL
docker-compose.yml          # Orquestração dos containers
.env.example               # Template de variáveis de ambiente
scriptDB.sql              # Script de criação do banco
```

## 🛠️ Comandos Úteis

### Gerenciamento Básico
```bash
# Iniciar serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Reiniciar um serviço específico
docker-compose restart mysql

# Ver logs em tempo real
docker-compose logs -f mysql

# Verificar status
docker-compose ps
```

### Backup e Restore
```bash
# Fazer backup
docker-compose exec mysql mysqldump -u root -p goalmanager > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose exec -i mysql mysql -u root -p goalmanager < backup.sql

# Backup de volumes Docker
docker run --rm -v goalmanager_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_data_backup.tar.gz /data
```

### Desenvolvimento
```bash
# Acessar container MySQL
docker-compose exec mysql bash

# Executar SQL direto
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Monitorar performance
docker-compose exec mysql mysqladmin -u root -p processlist

# Ver configurações ativas
docker-compose exec mysql mysql -u root -p -e "SHOW VARIABLES LIKE 'innodb%';"
```

### Limpeza
```bash
# Parar e remover containers (mantém volumes)
docker-compose down

# Remover tudo incluindo volumes (CUIDADO!)
docker-compose down -v

# Limpar imagens não utilizadas
docker system prune
```

## ⚙️ Configurações Avançadas

### Personalizar Configurações MySQL

Edite o arquivo `docker/mysql/conf.d/my.cnf`:

```ini
[mysqld]
# Aumentar buffer pool para mais performance
innodb_buffer_pool_size = 512M

# Ajustar conexões máximas
max_connections = 500
```

### Variáveis de Ambiente

Principais variáveis no arquivo `.env`:

```env
# MySQL
MYSQL_ROOT_PASSWORD=sua_senha_super_segura
MYSQL_PASSWORD=senha_da_aplicacao

# Portas (se houver conflito)
MYSQL_PORT=3307
PHPMYADMIN_PORT=8081

# Timezone
TZ=America/Sao_Paulo
```

## 🔍 Monitoramento e Troubleshooting

### Health Checks
```bash
# Verificar saúde dos containers
docker-compose ps

# Logs de health check
docker inspect goalmanager_mysql | grep -A 10 "Health"
```

### Performance Monitoring
```bash
# Ver uso de recursos
docker stats

# Monitorar queries lentas
docker-compose exec mysql tail -f /var/log/mysql/slow.log

# Verificar processos MySQL
docker-compose exec mysql mysqladmin -u root -p processlist
```

### Problemas Comuns

1. **Container não inicia:**
   ```bash
   # Ver logs detalhados
   docker-compose logs mysql
   
   # Verificar permissões
   docker-compose exec mysql ls -la /var/lib/mysql
   ```

2. **Erro de conexão:**
   ```bash
   # Testar conectividade
   docker-compose exec mysql mysqladmin ping -u root -p
   
   # Verificar usuários
   docker-compose exec mysql mysql -u root -p -e "SELECT user,host FROM mysql.user;"
   ```

3. **Performance lenta:**
   ```bash
   # Verificar configurações
   docker-compose exec mysql mysql -u root -p -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';"
   
   # Analisar queries
   docker-compose exec mysql mysql -u root -p -e "SHOW PROCESSLIST;"
   ```

## 📊 Volumes Persistentes

Os dados são salvos em volumes Docker nomeados:

- `goalmanager_mysql_data` - Dados do MySQL
- `goalmanager_mysql_logs` - Logs do MySQL

Para fazer backup dos volumes:
```bash
docker run --rm -v goalmanager_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

## 🚀 Deploy para Produção

### Configurações Essenciais
1. **Altere todas as senhas padrão**
2. **Configure firewall apropriado**
3. **Use volumes externos para backup**
4. **Configure SSL/TLS**
5. **Implemente monitoramento**

### Docker Compose para Produção
```yaml
# Adicionar ao docker-compose.yml
services:
  mysql:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
    environment:
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/mysql_root_password
    secrets:
      - mysql_root_password

secrets:
  mysql_root_password:
    file: ./secrets/mysql_root_password.txt
```

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique os logs: `docker-compose logs -f`
2. Consulte a documentação oficial do MySQL/Redis
3. Abra issue no repositório do projeto

## 🔄 Updates

Para atualizar as imagens:

```bash
# Baixar novas versões
docker-compose pull

# Recriar containers
docker-compose up -d --force-recreate
```

---

**Última atualização:** 29 de Outubro de 2025  
**Versão:** 1.0