import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //* insert the ip address from the npm run dev
  allowedDevOrigins: ['198.168.92.168']
};

export default nextConfig;
