# Neusoft Hackathon Platform

广东东软学院人工智能学院黑客松竞赛平台

## 技术栈

- **前端**：Next.js 15 App Router + TypeScript + Tailwind CSS v3 + Shadcn UI
- **后端**：Next.js API Routes + Prisma ORM
- **数据库**：PostgreSQL（生产）/ SQLite（开发）
- **认证**：NextAuth.js
- **代码评测**：Judge0 CE（Docker部署）
- **AI功能**：DeepSeek API（代码分析和评分）
- **部署**：Docker Compose + GitHub Actions

## 项目结构

```
neusoft-hackathon-platform/
├── app/
│   ├── auth/           # 认证相关
│   ├── dashboard/      # 仪表板页面
│   │   ├── admin/      # 管理员仪表板
│   │   ├── judge/      # 评委仪表板
│   │   └── participant/ # 参与者仪表板
│   ├── api/            # API 路由
│   ├── generated/      # 生成的代码
│   ├── globals.css     # 全局样式
│   ├── layout.tsx      # 布局组件
│   └── page.tsx        # 主页
├── prisma/            # Prisma 配置
├── public/            # 静态资源
├── .github/           # GitHub Actions
├── docker-compose.yml  # Docker 配置
├── Dockerfile         # Docker 构建文件
├── package.json       # 依赖配置
├── tsconfig.json      # TypeScript 配置
└── .env.example       # 环境变量模板
```

## 快速开始

### 本地开发

1. **克隆仓库**
   ```bash
   git clone https://github.com/HL-op/neusoft-hackathon-platform.git
   cd neusoft-hackathon-platform
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填写必要的环境变量
   ```

4. **初始化数据库**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

   访问 http://localhost:3000

### Docker 部署

1. **构建和运行容器**
   ```bash
   docker-compose up --build
   ```

2. **初始化数据库**
   ```bash
   docker exec -it neusoft-hackathon-platform-app-1 npx prisma migrate dev --name init
   ```

   访问 http://localhost:3000

## 主要功能

1. **用户认证**
   - 邮箱密码登录
   - 角色管理（管理员、评委、参与者）

2. **竞赛管理**
   - 创建和管理竞赛
   - 管理题目和测试用例

3. **代码评测**
   - 集成 Judge0 CE 进行代码评测
   - 实时评测结果

4. **AI 辅助**
   - 集成 DeepSeek API 进行代码分析
   - AI 辅助评分

5. **排行榜**
   - 实时更新排行榜
   - 详细的得分统计

6. **管理后台**
   - 用户管理
   - 竞赛管理
   - 题目管理
   - 系统状态监控

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| DATABASE_PROVIDER | 数据库提供商 | sqlite |
| DATABASE_URL | 数据库连接字符串 | file:./dev.db |
| NEXTAUTH_SECRET | NextAuth 密钥 | - |
| NEXTAUTH_URL | NextAuth 回调 URL | http://localhost:3000 |
| DEEPSEEK_API_KEY | DeepSeek API 密钥 | - |
| JUDGE0_API_URL | Judge0 API URL | http://localhost:2358 |
| JUDGE0_API_KEY | Judge0 API 密钥 | - |
| SMTP_HOST | SMTP 服务器主机 | - |
| SMTP_PORT | SMTP 服务器端口 | - |
| SMTP_USER | SMTP 用户名 | - |
| SMTP_PASSWORD | SMTP 密码 | - |
| EMAIL_FROM | 发件人邮箱 | - |

## 部署

### Vercel 部署

1. **创建 Vercel 项目**
   - 访问 https://vercel.com
   - 导入 GitHub 仓库

2. **配置环境变量**
   - 在 Vercel 项目设置中添加必要的环境变量

3. **部署**
   - Vercel 会自动部署代码

### GitHub Actions

- 项目包含自动部署工作流
- 推送到 main 分支会自动触发部署

## 开发指南

### 代码规范

- 使用 ESLint 和 Prettier 保持代码风格一致
- 遵循 TypeScript 最佳实践
- 提交前运行 `npm run lint` 和 `npm run format`

### 数据库迁移

- 添加或修改模型后运行：
  ```bash
  npx prisma migrate dev --name <migration-name>
  ```

- 生成 Prisma 客户端：
  ```bash
  npx prisma generate
  ```

## 许可证

MIT License

## 联系我们

- 项目维护者：HL-op
- 邮箱：74501323+HL-op@users.noreply.github.com