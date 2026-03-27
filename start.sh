#!/bin/bash
echo "============================================"
echo " OfferFlow - 求职简历投递管理系统"
echo "============================================"

# 安装依赖
echo "[1/4] 安装依赖包..."
npm install

# 初始化数据库
echo "[2/4] 初始化数据库..."
npx prisma db push

# 生成 Prisma Client
echo "[3/4] 生成 Prisma Client..."
npx prisma generate

# 启动
echo "[4/4] 启动开发服务器..."
echo ""
echo "访问地址: http://localhost:3000"
npm run dev
