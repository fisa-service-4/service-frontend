import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/ai/:path*",
        destination: `${process.env.NEXT_PUBLIC_AI_ORIGIN ?? "http://localhost:8000"}/api/v1/ai/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8080"}/api/:path*`,
      },
      {
        source: "/mydata/:path*",
        destination: `${process.env.NEXT_PUBLIC_MYDATA_ORIGIN ?? "http://localhost:8084"}/mydata/:path*`,
      },
    ];
  },
};

export default nextConfig;
