import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",

    async rewrites() {
        return [
            {
                source: "/api/v1/ai/:path*",
                destination: "http://service-ai-server:8000/api/v1/ai/:path*",
            },
            {
                source: "/api/:path*",
                destination: "http://service-backend:8080/api/:path*",
            },
            {
                source: "/mydata/:path*",
                destination: "http://mydata-server:8084/mydata/:path*",
            },
            {
                source: "/baas/:path*",
                destination: "http://transaction-server:8083/baas/:path*",
            },
        ];
    },
};

export default nextConfig;