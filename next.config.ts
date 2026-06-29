import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //* insert the ip address from the npm run dev
  allowedDevOrigins: ['http://192.168.1.40:3000']
};

export default nextConfig;
