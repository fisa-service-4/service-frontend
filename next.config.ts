import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    output: "standalone",

    async rewrites() {
        return [
            {
                source: "/api/v1/ai/chat/sessions/:sessionId/messages",
                destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/api/v1/ai/chat/sessions/:sessionId/messages`,
            },
            {
                source: "/api/v1/ai/chat/sessions/:sessionId",
                destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/api/v1/ai/chat/sessions/:sessionId`,
            },
            {
                source: "/api/v1/ai/chat/sessions",
                destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/api/v1/ai/chat/sessions`,
            },
            {
                source: "/api/v1/ai/chat/run",
                destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/api/v1/ai/chat/run`,
            },
            {
                source: "/api/v1/ai/:path*",
                destination: `${process.env.AI_SERVER_URL ?? "http://localhost:8000"}/api/v1/ai/:path*`,
            },
            {
                source: "/api/:path*",
                destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/api/:path*`,
            },
            {
                source: "/mydata/:path*",
                destination: `${process.env.MYDATA_URL ?? "http://localhost:8084"}/mydata/:path*`,
            },
            {
                source: "/baas/:path*",
                destination: `${process.env.TRANSACTION_URL || "http://localhost:8083"}/baas/:path*`
            },
        ];
    },
};

export default nextConfig;
