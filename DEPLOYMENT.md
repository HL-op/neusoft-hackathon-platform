# 部署文档

## 服务器要求

### 硬件要求
- CPU: 至少4核
- 内存: 至少8GB
- 磁盘空间: 至少50GB
- 网络: 稳定的互联网连接

### 软件要求
- Ubuntu 20.04 LTS或更高版本
- Docker 20.10.0或更高版本
- Docker Compose 1.29.0或更高版本
- Git
- Nginx (已包含在Docker Compose中)
- SSL证书 (用于HTTPS)

## 安装步骤

### 1. 服务器准备

1. 更新系统
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. 安装Docker和Docker Compose
   ```bash
   # 安装Docker
   sudo apt install docker.io -y
   
   # 安装Docker Compose
   sudo apt install docker-compose -y
   
   # 启动Docker服务
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. 安装Git
   ```bash
   sudo apt install git -y
   ```

### 2. 项目部署

1. 克隆代码仓库
   ```bash
   git clone https://github.com/HL-op/neusoft-hackathon-platform.git
   cd neusoft-hackathon-platform
   ```

2. 配置环境变量
   ```bash
   cp .env.example .env
   # 编辑.env文件，填写相应的配置
   nano .env
   ```

3. 配置Nginx SSL证书
   ```bash
   # 创建证书目录
   mkdir -p nginx/certs
   
   # 将SSL证书文件复制到目录中
   # fullchain.pem 和 privkey.pem
   ```

4. 构建并启动服务
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

5. 配置定期备份
   ```bash
   # 给备份脚本添加执行权限
   chmod +x scripts/backup.sh
   
   # 添加到crontab
   crontab scripts/crontab.txt
   ```

### 3. GitHub Actions配置

1. 在GitHub仓库中设置以下Secrets：
   - `SERVER_HOST`: 服务器IP地址
   - `SERVER_USERNAME`: 服务器用户名
   - `SERVER_PASSWORD`: 服务器密码
   - `SERVER_PORT`: SSH端口（可选，默认22）

2. 推送代码到main分支，触发自动部署

## 运维指南

### 服务管理

- 启动所有服务
  ```bash
  docker-compose -f docker-compose.prod.yml up -d
  ```

- 停止所有服务
  ```bash
  docker-compose -f docker-compose.prod.yml down
  ```

- 查看服务状态
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```

- 查看服务日志
  ```bash
  docker-compose -f docker-compose.prod.yml logs -f
  ```

### 数据库管理

- 备份数据库
  ```bash
  ./scripts/backup.sh
  ```

- 恢复数据库
  ```bash
  docker exec -i neusoft-hackathon-platform_postgres_1 psql -U hackathon -d hackathon < backup_file.sql
  ```

### 监控系统

- Prometheus监控: https://your-domain.com/prometheus
- Grafana监控: https://your-domain.com/grafana
  - 默认用户名: admin
  - 默认密码: 在.env文件中配置

### 常见问题处理

1. **服务启动失败**
   - 检查Docker服务是否运行
   - 检查端口是否被占用
   - 查看服务日志获取详细错误信息

2. **数据库连接失败**
   - 检查数据库服务是否运行
   - 检查数据库配置是否正确
   - 检查网络连接是否正常

3. **SSL证书问题**
   - 确保SSL证书文件存在且权限正确
   - 确保证书未过期
   - 检查Nginx配置是否正确

4. **Judge0评测服务问题**
   - 检查Judge0服务是否运行
   - 检查网络连接是否正常
   - 查看Judge0日志获取详细错误信息

## 性能优化

1. **Docker优化**
   - 配置Docker镜像加速
   - 限制容器资源使用

2. **Nginx优化**
   - 启用gzip压缩
   - 配置缓存策略
   - 调整worker进程数

3. **数据库优化**
   - 配置PostgreSQL性能参数
   - 定期清理无用数据
   - 创建适当的索引

## 安全措施

1. **服务器安全**
   - 配置防火墙
   - 禁用root登录
   - 使用SSH密钥认证

2. **应用安全**
   - 定期更新依赖包
   - 配置合适的文件权限
   - 启用HTTPS

3. **数据安全**
   - 定期备份数据
   - 加密敏感信息
   - 限制数据库访问权限

## 版本更新

1. **手动更新**
   ```bash
   # 拉取最新代码
   git pull origin main
   
   # 停止并重新构建服务
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. **自动更新**
   - 推送代码到main分支，GitHub Actions会自动部署

## 联系方式

- 技术支持: [your-email@example.com]
- GitHub Issues: https://github.com/HL-op/neusoft-hackathon-platform/issues
