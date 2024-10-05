


/** @type {import('next').NextConfig} */
const nextConfig = {
  
  experimental: {
    serverComponentsExternalPackages: ['@vercel/postgres'],
  },
  env: {
    POSTGRES_URL: process.env.POSTGRES_URL,
  },
  };
  
  export default nextConfig;