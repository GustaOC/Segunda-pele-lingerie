/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'zmamgftjxnivlwudgzqm.supabase.co',
      }
    ],
  },
  // Configuração para transpilar módulos se necessário (opcional)
  transpilePackages: ['bcryptjs'],
}

export default nextConfig