import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    output: "standalone",

    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${process.env.BACKEND_URL ?? "http://service-backend:8080"}/api/:path*`,
            },
            {
                source: "/mydata/:path*",
                destination: `${process.env.MYDATA_URL ?? "http://mydata-server:8084"}/mydata/:path*`,
            },
            {
                source: "/baas/:path*",
                destination: `${process.env.TRANSACTION_URL || "http://transaction-server:8083"}/baas/:path*`
            },
        ];
    },
};

export default nextConfig;
