/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@stacks/connect', '@stacks/encryption', '@stacks/common', '@stacks/network'],
}

export default nextConfig
