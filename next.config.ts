import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //* insert the ip address from the npm run dev when running the app on a different device in the same network
  allowedDevOrigins: ['192.168.1.42']
};

export default nextConfig;
