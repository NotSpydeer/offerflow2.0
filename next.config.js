/** @type {import('next').NextConfig} */
const nextConfig = {
  // 实验性功能
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js', '@prisma/client'],
  },
}

module.exports = nextConfig
