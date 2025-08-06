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
      allowedDevOrigins: ['https://9003-firebase-studio-1754164732326.cluster-3gc7bglotjgwuxlqpiut7yyqt4.cloudworkstations.dev'], // Bu satırı ekleyin
    };

export default nextConfig;