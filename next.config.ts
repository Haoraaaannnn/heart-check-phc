/**
 * @fileoverview Next.js Configuration.
 *
 * Configures development origins, asset tracing boundaries, and build behaviors.
 * Excludes backend Python virtual environments and data folders from Node output file tracing.
 *
 * @module next.config
 */

import type { NextConfig } from "next";

/**
 * Global Next.js application configuration object.
 */
const nextConfig: NextConfig = {
  /* config options here */
  //* insert the ip address from the npm run dev when running the app on a different device in the same network
  allowedDevOrigins: ['10.34.233.24'],
  outputFileTracingExcludes: {
    '*': ['./python_backend/**/*'],
  },
};

export default nextConfig;
