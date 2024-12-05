import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Enable static exports
  images: {
    unoptimized: true, // Required for static export
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Ensure that .js files in node_modules are transpiled if necessary
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/@react-three\/drei/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    });
    return config;
  },
};

export default nextConfig;
