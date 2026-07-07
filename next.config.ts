import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //* insert the ip address from the npm run dev
  allowedDevOrigins: ['192.168.1.42']
};

export default nextConfig;
