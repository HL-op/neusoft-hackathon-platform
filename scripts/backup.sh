#!/bin/bash

# 备份脚本
# 定期备份数据库和重要数据

# 配置变量
BACKUP_DIR="/home/ubuntu/neusoft-hackathon-platform/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.tar.gz"
DB_CONTAINER="neusoft-hackathon-platform_postgres_1"
DB_NAME="hackathon"
DB_USER="hackathon"
RETENTION_DAYS=7

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份数据库
docker exec -t "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"

# 备份重要配置文件
cp -r /home/ubuntu/neusoft-hackathon-platform/.env "$BACKUP_DIR/"
cp -r /home/ubuntu/neusoft-hackathon-platform/nginx/ "$BACKUP_DIR/nginx_${TIMESTAMP}/"
cp -r /home/ubuntu/neusoft-hackathon-platform/docker-compose.prod.yml "$BACKUP_DIR/"

# 压缩备份文件
tar -czf "$BACKUP_DIR/$BACKUP_FILE" "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql" "$BACKUP_DIR/.env" "$BACKUP_DIR/nginx_${TIMESTAMP}/" "$BACKUP_DIR/docker-compose.prod.yml"

# 清理临时文件
rm -f "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
rm -rf "$BACKUP_DIR/nginx_${TIMESTAMP}/"
rm -f "$BACKUP_DIR/.env"
rm -f "$BACKUP_DIR/docker-compose.prod.yml"

# 清理过期备份文件
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Backup completed: $BACKUP_DIR/$BACKUP_FILE"
