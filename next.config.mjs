


/** @type {import('next').NextConfig} */
const nextConfig = {
  
  experimental: {
    serverComponentsExternalPackages: ['@vercel/postgres'],
  },
  env: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  };
  
  export default nextConfig;