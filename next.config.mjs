/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Step 1: Rewrite node:fs → fs, node:https → https, etc.
      // NormalModuleReplacementPlugin runs before resolve.fallback and handles
      // the node: URI scheme that webpack otherwise cannot resolve.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );

      // Step 2: Stub the bare names to false (empty module) in the browser bundle.
      // pptxgenjs only exercises these code paths in Node environments.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        http: false,
        zlib: false,
        stream: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;

