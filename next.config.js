/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js', '@prisma/client', '@vercel/blob'], // ✅ 修改：新增 @vercel/blob
  },
}

module.exports = nextConfig
