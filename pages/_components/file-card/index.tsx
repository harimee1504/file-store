'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Overlay } from './overlay';
import { formatDistanceToNow } from 'date-fns';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { Footer } from './footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Actions } from '@/components/actions';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FileCardProps {
    id: string;
    title: string;
    authorName: string;
    authorId: string;
    orgId: string;
    isFavorite: boolean;
    createdAt: number;
    fileStoreId: string;
}

interface ImageProps {
    storageId: string;
    getToken: any;
}

export const FileCard = ({
    id,
    title,
    authorName,
    authorId,
    isFavorite,
    createdAt,
    fileStoreId,
    orgId,
}: FileCardProps) => {
    const { userId, getToken } = useAuth();
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
    const authorLabel = userId === authorId ? 'You' : authorName;
    const createdAtLabel = ""; //formatDistanceToNow(createdAt, { addSuffix: true });
    const [hovering, setHovering] = useState(false);
    const [fileUrl, setFileUrl] = useState('');
    const fetchImage = async ({ storageId, getToken }: ImageProps) => {
        try {
            const token = await getToken({
                template: 'convex',
            });
            const response = await fetch(
                `${convexUrl.split(".")[0]+".convex.site"}/getImage?storageId=${storageId}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!response.ok) {
                console.error('Failed to fetch image', response.statusText);
                return;
            }
            const imageBlob = await response.blob();
            const imageUrl = URL.createObjectURL(imageBlob);
            setFileUrl(imageUrl);
        } catch (error) {
            console.error('Error fetching image:', error);
            return;
        }
    };
    useEffect(() => {
        fetchImage({ storageId: fileStoreId, getToken });
    }, [fileStoreId]);
    return (
        <div
            className="h-56 w-52 group aspect-square border rounded-lg flex flex-col overflow-hidden justify-between ml-4"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <div className="relative flex-1 bg-blue-50">
                <Image
                    fill
                    src={fileUrl}
                    alt={title}
                    className="object-cover"
                    quality={20}
                />
                <Overlay />
                <Actions
                    id={id}
                    title={title}
                    fileUrl={fileUrl}
                    orgId={orgId}
                    side="right"
                    align="end"
                    sideOffset={12}
                >
                    <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-2 outline-none">
                        <MoreHorizontal className="text-white opacity-75 hover:opacity-100 transition-opacity" />
                    </button>
                </Actions>
            </div>
            <Footer
                isFavorite={isFavorite}
                title={title}
                authorLabel={authorLabel}
                createdAtLabel={createdAtLabel}
                onClick={() => {}}
                disabled={false}
                fileId={id}
                hovering={hovering}
            />
        </div>
    );
};

FileCard.skeleton = () => {
    return (
        <div className="aspect-[100/127] rounded-lg overflow-hidden">
            <Skeleton className="w-full h-full " />
        </div>
    );
};

export default FileCard;