import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["recharts", "lucide-react"],
    // Cache routeur côté client : revenir sur un onglet ne refait pas le rendu serveur.
    // Les mutations appellent revalidatePath, qui vide ce cache.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
