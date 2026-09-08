import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Allows real-device iPhone testing against the local LAN development server.
  allowedDevOrigins: ["192.168.1.184"],
};

export default nextConfig;
