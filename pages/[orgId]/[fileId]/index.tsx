'use client';

import { useConvex, useQuery } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { useOrganization, useUser, useClerk } from '@clerk/clerk-react';
import { FileIcon, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Id } from '@/convex/_generated/dataModel';
import { FileCard } from '@/pages/_components/file-card';
import Link from 'next/link';
import { formatDistanceToNowLib } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';

interface MetadataProps {
    _id: string;
    _creationTime: number;
    contentType: string;
    sha256: string;
    size: number;
}

interface ErrorState {
    type: 'org' | 'file' | 'loading' | null;
    message: string;
}

interface FileData {
    _id: Id<"files">;
    _creationTime: number;
    title: string;
    fileStoreId: string;
    metaData: MetadataProps;
    authorId: string;
    authorName: string;
    orgId: string;
    trash: boolean;
    isFavorite: boolean;
}

export default function SharedFilePage() {
    const params = useParams();
    const router = useRouter();
    const convex = useConvex();
    const { organization, isLoaded: orgIsLoaded } = useOrganization();
    const { user } = useUser();
    const { setActive } = useClerk();
    const [isValidatingAccess, setIsValidatingAccess] = useState(true);
    const [error, setError] = useState<ErrorState>({ type: null, message: '' });
    const [fileData, setFileData] = useState<FileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [accessRequestData, setAccessRequestData] = useState<any>(null);

    const rawFileId = params?.fileId as string;
    const rawOrgId = params?.orgId as string;

    const isValidOrgFormat = /^org_[a-zA-Z0-9]+$/.test(rawOrgId);
    const isValidFileFormat = /^[a-z0-9]{32}$/.test(rawFileId);

    useEffect(() => {
        if (!isValidOrgFormat) {
            setError({
                type: 'org',
                message: 'Invalid organization ID format'
            });
            setIsLoading(false);
            return;
        }

        if (!isValidFileFormat) {
            setError({
                type: 'file',
                message: 'Invalid file ID format'
            });
            setIsLoading(false);
            return;
        }

        setError({ type: null, message: '' });
    }, [rawOrgId, rawFileId, isValidOrgFormat, isValidFileFormat]);

    const fileId = isValidFileFormat ? (rawFileId as Id<"files">) : null;
    const orgId = isValidOrgFormat ? rawOrgId : null;

    // Check if the organization exists and user has access
    useEffect(() => {
        if (!orgIsLoaded || error.type) {
            setIsLoading(false);
            return;
        }

        if (organization?.id !== orgId) {
            setActive({ organization: orgId })
                .then(() => {
                    setIsValidatingAccess(false);
                })
                .catch((error) => {
                    console.error('Error validating organization access:', error);
                    setError({
                        type: 'org',
                        message: "This organization doesn't exist or you don't have access to it"
                    });
                    setIsLoading(false);
                });
        } else {
            setIsValidatingAccess(false);
        }
    }, [orgId, orgIsLoaded, organization, setActive, error.type]);

    // Handle query errors
    useEffect(() => {
        if (!orgId || !fileId || !user?.id) {
            setIsLoading(false);
            return;
        }
        if (isValidatingAccess) return;

        const getFile = async () => {
            try {
                const file = await convex.query(api.file.getFile, {
                    id: fileId,
                    orgId,
                });
                setFileData(file as FileData);
                setIsLoading(false);
            } catch (error: any) {
                console.error('Error fetching file:', error);
                const errorMessage = error.data?.message || error.message || '';
                
                if (errorMessage.includes('Access denied')) {
                    // If access is denied, try to fetch the access request
                    try {
                        const accessRequest = await convex.query(api.file.getAccessRequest, {
                            fileId,
                            userId: user.id,
                        });
                        setAccessRequestData(accessRequest);
                        setFileData(null); // This will trigger the access denied UI
                    } catch (accessError) {
                        console.error('Error fetching access request:', accessError);
                    }
                } else {
                    setError({
                        type: 'file',
                        message: 'An error occurred while fetching the file'
                    });
                }
                setIsLoading(false);
            }
        };

        getFile();
    }, [isValidatingAccess, orgId, fileId, convex, user]);

    const requestAccess = useMutation(api.file.requestAccess);

    const handleRequestAccess = async (user: any) => {
        if (!fileId || !orgId) return;

        try {
            await requestAccess({
                fileId,
                orgId,
                userId: user.id,
                userEmail: user.primaryEmailAddress?.emailAddress || '',
            });
            
            // After successful request, fetch the updated access request data
            const accessRequest = await convex.query(api.file.getAccessRequest, {
                fileId,
                userId: user.id,
            });
            setAccessRequestData(accessRequest);
            
            toast.success('Access request sent successfully');
        } catch (error: any) {
            console.error('Error requesting access:', error);
            toast.error(error?.message || 'Failed to send access request');
        }
    };

    // Render error state
    const renderError = () => (
        <div className="min-h-screen w-full flex flex-col bg-background">
            <header className="w-full border-b border-border h-16 flex items-center px-6">
                <Link
                    href="/"
                    className="flex items-center text-sm hover:opacity-75 transition"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to home
                </Link>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="rounded-xl border-2 border-dashed border-destructive p-10 flex flex-col items-center gap-4">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <h1 className="text-2xl font-bold">Invalid {error.type === 'org' ? 'Organization' : 'File'}</h1>
                    <p className="text-muted-foreground text-center max-w-md">
                        {error.message}
                    </p>
                    <Button asChild size="lg">
                        <Link href="/">
                            Go to Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );

    // Show error state if there's an error
    if (error.type) {
        return renderError();
    }

    // Show loading state while validating access or loading data
    if (isLoading || isValidatingAccess) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-pulse">
                        {isValidatingAccess ? 'Validating access...' : 'Loading...'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Please wait while we {isValidatingAccess ? 'verify your permissions' : 'load the file'}
                    </p>
                </div>
            </div>
        );
    }

    const renderAccessDenied = () => (
        <div className="min-h-screen w-full flex flex-col bg-background">
            <header className="w-full border-b border-border h-16 flex items-center px-6">
                <Link
                    href="/"
                    className="flex items-center text-sm hover:opacity-75 transition"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to home
                </Link>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 flex flex-col items-center gap-4">
                    <FileIcon className="h-10 w-10 text-gray-400" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground text-center max-w-md">
                        You don't have access to this file. Please request
                        access to view it.
                    </p>
                    {accessRequestData ? (
                        <div className="flex flex-col items-center gap-2">
                            <Button disabled size="lg" variant="outline">
                                Access Requested
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                Requested{' '}
                                {formatDistanceToNowLib(
                                    new Date(accessRequestData.createdAt).getTime()
                                )}{' '}
                            </p>
                        </div>
                    ) : (
                        <Button onClick={()=>handleRequestAccess(user)} size="lg">
                            Request Access
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    // Show access denied state
    if (!fileData) {
        return renderAccessDenied();
    }

    const metadata: MetadataProps = {
        _creationTime: fileData.metaData?._creationTime,
        _id: fileData.metaData?._id,
        contentType: fileData.metaData?.contentType || 'application/octet-stream',
        sha256: fileData.metaData?.sha256,
        size: fileData.metaData?.size,
    };

    return (
        <div className="min-h-screen w-full flex flex-col bg-background">
            <header className="w-full border-b border-border h-16 flex items-center justify-between px-6">
                <Link
                    href="/"
                    className="flex items-center text-sm hover:opacity-75 transition"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to home
                </Link>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        Last updated{' '}
                        {formatDistanceToNowLib(fileData._creationTime)} ago
                    </p>
                </div>
            </header>
            <main className="flex-1 flex flex-col items-center p-6">
                <div className="w-full max-w-5xl space-y-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold truncate">
                            {fileData.title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Shared by {fileData.authorName}
                        </p>
                    </div>
                    <div className="w-full">
                        <FileCard
                            id={fileData._id}
                            title={fileData.title}
                            authorName={fileData.authorName}
                            authorId={fileData.authorId}
                            orgId={fileData.orgId}
                            trash={fileData.trash}
                            isFavorite={fileData.isFavorite}
                            createdAt={fileData._creationTime}
                            fileStoreId={fileData.fileStoreId}
                            metaData={metadata}
                            layout="grid"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

