import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimisations pour le dev
  experimental: {
    // Réduire la consommation mémoire
    webpackMemoryOptimizations: true,
  },

  // Images externes autorisées
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Désactiver la vérification TypeScript pendant le build (plus rapide)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
