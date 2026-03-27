@echo off
echo ============================================
echo  OfferFlow - 求职简历投递管理系统
echo ============================================
echo.

:: 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] 安装依赖包...
call npm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)

echo.
echo [2/4] 初始化数据库...
call npx prisma db push
if %errorlevel% neq 0 (
    echo [错误] 数据库初始化失败
    pause
    exit /b 1
)

echo.
echo [3/4] 生成 Prisma Client...
call npx prisma generate

echo.
echo [4/4] 启动开发服务器...
echo.
echo ============================================
echo  访问地址: http://localhost:3000
echo  按 Ctrl+C 停止服务
echo ============================================
echo.
call npm run dev
