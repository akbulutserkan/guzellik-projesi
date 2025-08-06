
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* Mevcut ayarlarınız olduğu gibi kalıyor */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
