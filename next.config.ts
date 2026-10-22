import type { NextConfig } from "next";
import os from "os";

const networkInterfaces = os.networkInterfaces();
const localAddresses: string[] = [];

Object.values(networkInterfaces).forEach((interfaces) => {
  interfaces?.forEach((iface) => {
    if (iface.family === "IPv4" && !iface.internal) {
      localAddresses.push(iface.address)
      localAddresses.push(`${iface.address}:3000`);
    }
  });
});

const nextConfig: NextConfig = {

  allowedDevOrigins: [
    "localhost:3000",
    ...localAddresses
  ],

  outputFileTracingExcludes: {
    '': ['./python_backend/**/'],
  },
};

export default nextConfig;