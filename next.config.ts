/** @fileoverview Local development origins and valid route-glob production tracing exclusions. */
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
    "localhost",
    "localhost:3000",
    ...localAddresses
  ],

  async rewrites() {
    const pythonBackendUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000";
    return [
      { source: "/api/dashboard-data", destination: `${pythonBackendUrl}/api/dashboard-data` },
      { source: "/api/dashboard-data/:path*", destination: `${pythonBackendUrl}/api/dashboard-data/:path*` },
      { source: "/api/daily-drilldown", destination: `${pythonBackendUrl}/api/daily-drilldown` },
      { source: "/api/daily-drilldown/:path*", destination: `${pythonBackendUrl}/api/daily-drilldown/:path*` },
      { source: "/api/available-years", destination: `${pythonBackendUrl}/api/available-years` },
      { source: "/api/available-years/:path*", destination: `${pythonBackendUrl}/api/available-years/:path*` },
      { source: "/api/available-export-dates", destination: `${pythonBackendUrl}/api/available-export-dates` },
      { source: "/api/available-export-dates/:path*", destination: `${pythonBackendUrl}/api/available-export-dates/:path*` },
      { source: "/api/monthly-breakdown/:path*", destination: `${pythonBackendUrl}/api/monthly-breakdown/:path*` },
      { source: "/api/export-excel", destination: `${pythonBackendUrl}/api/export-excel` },
      { source: "/api/export-excel/:path*", destination: `${pythonBackendUrl}/api/export-excel/:path*` },
      { source: "/api/import-file", destination: `${pythonBackendUrl}/api/import-file` },
      { source: "/api/import-file/:path*", destination: `${pythonBackendUrl}/api/import-file/:path*` },
      { source: "/health", destination: `${pythonBackendUrl}/health` },
    ];
  },

  outputFileTracingExcludes: {
    '/*': ['./python_backend/**/*'],
  },
};

export default nextConfig;
