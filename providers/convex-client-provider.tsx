'use client';

import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useAuth } from '@clerk/clerk-react';
import { ConvexReactClient } from 'convex/react';

interface ConvexClientProviderProps {
    children: React.ReactNode;
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

const convex = new ConvexReactClient(convexUrl);

const ConvexProvider = ({children}: ConvexClientProviderProps) => {
    return (
        <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
            {children}
        </ConvexProviderWithClerk>
    );
};

export default ConvexProvider;
