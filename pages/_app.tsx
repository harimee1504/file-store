import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ConvexReactClient } from 'convex/react';

export default function App({ Component, pageProps }: AppProps) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
    const convex = new ConvexReactClient(convexUrl);
    return (
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string}>
            <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
            <Component {...pageProps} />
            </ConvexProviderWithClerk>
        </ClerkProvider>
    )
}
