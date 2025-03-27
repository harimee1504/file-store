"use client";
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import {
    ConvexReactClient,
} from 'convex/react';
import MainContent from './_components/main-content';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import {
    ClerkProvider,
    useAuth,
} from '@clerk/clerk-react';

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

const Page = () => {
    const router = useRouter();
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
    const convex = new ConvexReactClient(convexUrl);
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
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string}>
            <Wrapper
                data={data}
        >
            <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
                <MainContent />
            </ConvexProviderWithClerk>
        </Wrapper>
        </ClerkProvider>
    );
};

export default Page;
