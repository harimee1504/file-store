/** @type {import('next').NextConfig} */
import { NextFederationPlugin } from '@module-federation/nextjs-mf';

const nextConfig = {
    reactStrictMode: true,
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
      },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
      },
    transpilePackages: ['@tsparticles/react'],
    experimental: {
        esmExternals: false,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
            },
            {
                protocol: 'https',
                hostname: 'proper-dachshund-429.convex.cloud',
            },
            {
                protocol: 'https',
                hostname: 'proper-dachshund-429.convex.site',
            },
        ],
    },
    webpack: (config) => {

        config.plugins.push(
            new NextFederationPlugin({
                name: 'filestore',
                filename: 'static/chunks/remoteEntry.js',
                remotes: {
                    // 'auth': 'auth@http://localhost:4000/_next/static/chunks/remoteEntry.js',
                    'auth': 'auth@https://auth-layout.vercel.app/_next/static/chunks/remoteEntry.js',
                },
                exposes: {
                    // "./MainContent" : "./pages/_file-store/_components/main-content.tsx",
                    "./ConvexProvider" : "./providers/convex-client-provider.tsx",
                },
                shared: [
                    'react',
                    'react-dom',
                    '@clerk/clerk-react',
                ]
            })
        );
        return config;
    },
};

export default nextConfig;
