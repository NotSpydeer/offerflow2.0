# OfferFlow - 求职简历投递管理系统

一个基于 Next.js + SQLite 的本地求职管理 Web 应用。

## 快速启动

### Windows
双击运行 `start.bat`，或在命令行执行：
```
start.bat
```

### macOS / Linux
```bash
chmod +x start.sh
./start.sh
```

### 手动启动
```bash
npm install
npx prisma db push
npm run dev
```

然后访问 http://localhost:3000

---

## 功能模块

| 路径 | 功能 |
|------|------|
| `/dashboard` | 数据统计面板（卡片+饼图+柱状图） |
| `/applications` | 岗位投递管理（列表/看板视图） |
| `/resumes` | 简历版本管理（上传/标签） |
| `/interviews` | 面试记录时间线 |

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: TailwindCSS
- **数据库**: SQLite + Prisma ORM
- **图表**: Recharts
- **拖拽看板**: @hello-pangea/dnd
- **OCR**: Tesseract.js

## 项目结构

```
e:/OfferFlow/
├── prisma/schema.prisma    # 数据库模型
├── src/
│   ├── app/               # 页面 + API Routes
│   ├── components/        # UI组件
│   ├── lib/               # 工具函数
│   └── types/             # TypeScript类型
└── public/uploads/        # 文件上传目录
```
