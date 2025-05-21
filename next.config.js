/** @type {import('next').NextConfig} */

// Node.js modüllerini ele almak için webpack burada yapılandırılıyor
const path = require('path');

const nextConfig = {
  // Server actions yapılandırması
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Next.js 15.2.1 ile uyumlu optimizasyonlar
    optimizeCss: true
  },
  
  // node-pre-gyp ve diğer sorunlu modüllerin transpile edilmesini engelle
  transpilePackages: [],

  // Node modüllerini webpack'ten hariç tutma
  webpack: (config, { isServer }) => {
    // bcrypt ve node-pre-gyp'yi webpack işleminden tamamen hariç tutuyoruz
    if (isServer) {
      config.externals = [...(config.externals || []), 'bcrypt', '@mapbox/node-pre-gyp'];
    } else {
      // Client tarafında varsa sahte implementasyonları kullan
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'pg-native': false,
        'better-sqlite3': false,
        'node-pre-gyp': false,
        typeorm: false
      };
    }

    // Yalnızca HTML dosyaları için null-loader kullan
    config.module.rules.push({
      test: /\.html$/,
      include: /node_modules/,
      use: 'null-loader'
    });
    
    return config;
  },
  
  // API isteklerini doğru endpoint'e yönlendirmek için rewrites
  async rewrites() {
    return [
      {
        source: '/api/mcapi',
        destination: '/api/mcp',
      },
      {
        source: '/api/mcapi/:path*',
        destination: '/api/mcp/:path*',
      },
    ];
  },

  // Native modülleri NextJS bileşen derlemesinden hariç tut
  serverComponentsExternalPackages: [
    'bcrypt',
    '@mapbox/node-pre-gyp'
  ]
}

module.exports = nextConfig