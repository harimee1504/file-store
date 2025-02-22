import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import {
    Authenticated,
    ConvexReactClient,
    Unauthenticated,
} from 'convex/react';
import MainContent from './_components/main-content';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import {
    ClerkProvider,
    RedirectToSignIn,
    SignedIn,
    SignedOut,
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
    publishableKey: string;
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
                ],
            },
        ],
    };

    return (
        <Wrapper
            data={data}
            publishableKey={
                process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string
            }
        >
            <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
                <Unauthenticated>
                    <RedirectToSignIn />
                </Unauthenticated>
                <Authenticated>
                    <MainContent />
                </Authenticated>
            </ConvexProviderWithClerk>
        </Wrapper>
    );
};

export default Page;
