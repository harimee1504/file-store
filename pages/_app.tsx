'use client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ConvexReactClient } from 'convex/react';
import { ModalProvider } from '@/providers/modal-providers';

interface WrapperProps {
    children: React.ReactNode;
    data: {
        navMain: {
            title: string;
            url: string;
            icon: string;
            isActive: boolean;
            items: {
                title: string;
                args?: {};
                icon: string;
                url: () => void;
            }[];
        }[];
    };
}

const Wrapper = dynamic<WrapperProps>(() => import('auth/wrapper'!), {
    ssr: false,
});

function ConvexClientProvider({ children }: { children: React.ReactNode }) {
    const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const { isLoaded } = useAuth();

    if (!isLoaded) {
        return null;
    }

    return (
        <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
            {children}
        </ConvexProviderWithClerk>
    );
}

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const data = {
        navMain: [
            {
                title: 'File Store',
                url: '#',
                icon: 'FileBox',
                isActive: true,
                items: [
                    {
                        title: 'Files',
                        args: {},
                        icon: 'Folders',
                        url: () => {
                            router.push({
                                query: {},
                            });
                        },
                    },
                    {
                        title: 'Favourites',
                        icon: 'FolderHeart',
                        url: () => {
                            router.push({
                                query: { favourite: true },
                            });
                        },
                    },
                    {
                        title: 'Recycle Bin',
                        icon: 'Trash2',
                        url: () => {
                            router.push({
                                query: { trash: true },
                            });
                        },
                    },
                    {
                        title: 'Access Requests',
                        icon: 'UserPlus',
                        url: () => {
                            router.push({
                                query: { accessRequests: true },
                            });
                        },
                    },
                ],
            },
        ],
    };

    return (
        <ClerkProvider
            publishableKey={
                process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string
            }
        >
            <Wrapper data={data}>
                <ConvexClientProvider>
                    <ModalProvider />
                    <Component {...pageProps} />
                </ConvexClientProvider>
            </Wrapper>
        </ClerkProvider>
    );
}
