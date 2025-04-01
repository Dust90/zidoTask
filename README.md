# zidoTask - 任务管理系统

一个现代化的任务管理系统，使用 Next.js 和 Supabase 构建。支持团队协作、项目管理和多视图任务跟踪。

## 功能特点

- 多视图任务管理
  - 列表视图
  - 日历视图
  - 看板视图
  - 统计视图
- 团队协作功能
  - 团队创建和管理
  - 项目组织
  - 成员角色管理
  - 邀请链接系统
- 任务管理
  - 优先级设置
  - 标签分类
  - 状态追踪
  - 项目关联
- 响应式设计，支持移动端和桌面端
- 实时数据同步
- 多种认证方式
  - 邮箱密码登录
  - Google OAuth
  - Gitea OAuth

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (认证和数据库)
- Chart.js
- React Beautiful DND
- Docker (部署)

## 开发环境设置

1. 克隆仓库：
   ```bash
   git clone https://github.com/Dust90/zidoTask.git
   cd zidoTask
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 创建环境变量文件：
   ```bash
   cp .env.example .env.local
   ```
   然后编辑 `.env.local` 文件，填入必要的环境变量。

4. 启动开发服务器：
   ```bash
   npm run dev
   ```

5. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)


## 环境变量配置

创建一个 `.env.local` 文件，包含以下变量：

```
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
NEXT_PUBLIC_GITEA_CLIENT_ID=Gitea OAuth客户端ID
GITEA_CLIENT_SECRET=Gitea OAuth客户端密钥
NEXT_PUBLIC_GITEA_URL=Gitea服务器URL
```

## 数据库初始化

ZidoTask 使用 Supabase 作为数据库和认证系统。按照以下步骤初始化数据库：

1. 创建 Supabase 项目：
   - 在 [Supabase 控制台](https://app.supabase.io/) 创建一个新项目
   - 记下项目 URL 和匿名密钥，填入 `.env.local` 文件

2. 初始化数据库结构：
   - 使用 Supabase 迁移工具应用迁移脚本：
     ```bash
     npx supabase link --project-ref 你的项目ID
     npx supabase db push
     ```
   - 或者手动在 Supabase SQL 编辑器中运行迁移脚本：
     ```bash
     # 复制迁移脚本内容
     cat supabase/migrations/20250401001000_init.sql
     ```
     然后将内容粘贴到 Supabase SQL 编辑器中执行

3. 配置 OAuth 提供商（可选）：
   - 在 Supabase 控制台中，导航到 Authentication > Providers
   - 启用并配置 Google 和/或 Gitea OAuth

4. 设置存储桶：
   - 迁移脚本会自动创建两个存储桶：`avatars`（公开）和 `files`（私有）
   - 确认存储桶已正确创建并设置了适当的 RLS 策略

5. 验证数据库设置：
   - 检查所有表是否已创建
   - 确认 RLS 策略是否已应用
   - 测试用户注册和认证流程

迁移脚本 `20250401001000_init.sql` 包含完整的数据库结构、约束、索引、RLS 策略和触发器，确保系统安全性和数据完整性。

## 项目结构

```
zidoTask/
├── src/
│   ├── app/              # Next.js 应用路由
│   │   ├── auth/         # 认证相关页面
│   │   ├── dashboard/    # 仪表盘页面
│   │   ├── invitations/  # 邀请处理
│   │   ├── projects/     # 项目管理
│   │   └── teams/        # 团队管理
│   ├── components/       # React 组件
│   │   ├── views/        # 主要视图组件
│   │   ├── tasks/        # 任务相关组件
│   │   ├── teams/        # 团队相关组件
│   │   └── projects/     # 项目相关组件
│   ├── lib/              # 工具函数和API
│   │   ├── api.ts        # API请求函数
│   │   ├── supabase.ts   # Supabase客户端
│   │   └── types.ts      # TypeScript类型定义
│   └── styles/           # 全局样式
├── public/               # 静态资源
├── supabase/             # Supabase迁移和配置
└── ...
```

## 数据库结构

ZidoTask 使用 Supabase 作为后端数据库，主要表结构包括：

- `profiles`: 用户资料
- `tasks`: 任务信息
- `tags`: 标签定义
- `task_tags`: 任务-标签关联
- `teams`: 团队信息
- `team_members`: 团队成员关联
- `projects`: 项目信息
- `project_members`: 项目成员关联

## Docker 部署

项目包含完整的 Docker 部署配置：

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 使用部署脚本部署到远程服务器
./deploy.sh -h 服务器地址 -u 用户名 -e .env.production
```

## 贡献指南

欢迎为 ZidoTask 项目做出贡献！以下是一些贡献指南：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证。详情请见 [LICENSE](./LICENSE) 文件。

## 联系方式

如有问题或建议，请通过 Issues 提出，或联系项目维护者。
