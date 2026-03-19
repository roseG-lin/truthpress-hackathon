/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prefer worker_threads on this machine because child_process spawn is blocked.
  experimental: {
    workerThreads: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/cafe",
          destination: "/truth-ladder",
        },
      ],
    };
  },
  webpack(config) {
    return config;
  },
};

export default nextConfig;
