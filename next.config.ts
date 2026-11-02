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

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  async rewrites() {
    const pythonBackendUrl = process.env.INTERNAL_API_URL || "http://127.0.0.1:8000";
    return [
      { source: "/api/dashboard-data", destination: `${pythonBackendUrl}/api/dashboard-data` },
      { source: "/api/dashboard-data/:path*", destination: `${pythonBackendUrl}/api/dashboard-data/:path*` },
      { source: "/api/daily-drilldown", destination: `${pythonBackendUrl}/api/daily-drilldown` },
      { source: "/api/daily-drilldown/:path*", destination: `${pythonBackendUrl}/api/daily-drilldown/:path*` },
      { source: "/api/available-export-dates", destination: `${pythonBackendUrl}/api/available-export-dates` },
      { source: "/api/available-export-dates/:path*", destination: `${pythonBackendUrl}/api/available-export-dates/:path*` },
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

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.deepgram.com; media-src 'self' blob: data:; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
