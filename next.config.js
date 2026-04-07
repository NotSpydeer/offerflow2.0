/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js', '@prisma/client', '@vercel/blob', 'unpdf', 'mammoth'], // ✅ 修改：新增 pdf-parse、mammoth
  },
}

module.exports = nextConfig
