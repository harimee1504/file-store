'use client';

import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { Overlay } from './overlay';
import { formatDistanceToNow, addDays, set } from 'date-fns';
import { useAuth } from '@clerk/clerk-react';
import { Footer } from './footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Actions } from '@/components/actions';
import { MoreHorizontal, UserCog } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getFileType, getFileColor, getFileIcon } from '@/lib/file-types';
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';

interface FileCardProps {
    id: string;
    title: string;
    authorName: string;
    authorId: string;
    orgId: string;
    trash: boolean;
    isFavorite: boolean;
    createdAt: number;
    fileStoreId: string;
    metaData: any;
    layout?: 'grid' | 'list';
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
    trash,
    createdAt,
    fileStoreId,
    orgId,
    layout,
    metaData,
}: FileCardProps) => {
    const { userId, getToken } = useAuth();
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
    const authorLabel = userId === authorId ? 'You' : authorName;
    const createdAtLabel = formatDistanceToNow(createdAt, { addSuffix: true });
    const deleteDateLabel = trash ? formatDistanceToNow(addDays(new Date(createdAt), 15), { addSuffix: true }) : null;

    const [hovering, setHovering] = useState(false);
    const [fileUrl, setFileUrl] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const fileType = getFileType(metaData.contentType);
    const FileIconComponent = getFileIcon(fileType);

    const provideAccess = useMutation(api.file.provideAccessToFile);

    const [users, setUsers] = useState<any[]>([]);

    const members = useQuery(api.files.getFileMembers,{
        fileId: id as Id<'files'>,
        orgId: orgId
    })

    useEffect(() => {
        const fetchUsers = async () => {
            if (typeof window !== 'undefined' && window.Clerk) {
                try {
                    const usersList = await window.Clerk.organization.getMemberships();
                    const user_id = await window.Clerk.user.id;
                    const userData = usersList.data.map((user: any) => ({
                        user_id: user.publicUserData.userId,
                        firstname: user.publicUserData.firstName,
                        lastname: user.publicUserData.lastName,
                        imageUrl: user.publicUserData.imageUrl,
                    }));
                    const usersExceptAuthor = userData.filter((user:any)=>user.user_id !== authorId && user.user_id !== user_id)
                    setUsers(usersExceptAuthor);
                } catch (error) {
                    console.error('Error fetching users from Clerk:', error);
                }
            }
        };

        fetchUsers();
    }, [orgId]);

    useEffect(()=>{
        if(members){
            setSelectedUsers(members);
        }
    },[members])



    const fetchImage = async ({ storageId, getToken }: ImageProps) => {
        if (fileType !== 'image') return;
        
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

    const handleUserCogClick = () => {
        setOpenDialog(true);
    };

    const handleUserSelect = (userId: string) => {
        setSelectedUsers((prev) => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSubmit = async() => {
        try {
            await provideAccess({
                fileId: id as Id<'files'>,
                orgId: orgId,
                userIds: selectedUsers
            });
            toast.success('Permission provided successfully');
        }
        catch (error) {
            console.error('Error providing access to the file:', error);
            toast.error('Failed to providing access to the file');
        } finally {
            setOpenDialog(false);
        }
    };

    const handleCancel = () => {
        setOpenDialog(false);
        setSelectedUsers([]);
    };

    return (
        <div
            className="h-56 w-52 group aspect-square border rounded-lg flex flex-col overflow-hidden justify-between ml-8"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <div className={cn("relative flex-1", getFileColor(fileType))}>
                {fileType === 'image' && fileUrl ? (
                    <Image
                        fill
                        src={fileUrl}
                        alt={title}
                        className="object-cover"
                        quality={20}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Image src={FileIconComponent} alt="File icon" className="w-16 h-16 opacity-75" width={64} height={64} />
                    </div>
                )}
                <Overlay />
                <Actions
                    id={id}
                    title={title}
                    fileUrl={fileUrl}
                    trash={trash}
                    orgId={orgId}
                    side="right"
                    align="end"
                    sideOffset={12}
                    isAuthor={window.Clerk.user.id === authorId}
                >
                    <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-2 outline-none">
                        <MoreHorizontal className={cn("opacity-75 hover:opacity-100 transition-opacity",
                            fileType === 'image' && 'text-white'
                        )} />
                    </button>
                </Actions>
                {!trash && <button 
                    className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-2 outline-none"
                    onClick={handleUserCogClick}
                >
                    <UserCog className={cn("opacity-75 hover:opacity-100 transition-opacity",
                        fileType === 'image' && 'text-white'
                    )} />
                </button>}
                
            </div>
            <Footer
                isFavorite={isFavorite}
                title={title}
                authorLabel={authorLabel}
                createdAtLabel={createdAtLabel}
                deleteDateLabel={deleteDateLabel}
                onClick={() => {}}
                disabled={false}
                fileId={id}
                hovering={hovering}
            />
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogOverlay className="bg-black/30" />
                <DialogContent className="bg-white shadow-lg rounded-lg p-6">
                    <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
                    {users.length !== 0 && 
                    <>
                    <Input 
                        placeholder="Search users..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="border rounded-md p-2 mb-4"
                    />
                    <div className="max-h-60 overflow-y-auto">
                        {users.filter(user => 
                            `${user.firstname} ${user.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(user => (
                            <div key={user.user_id} onClick={() => handleUserSelect(user.user_id)} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                                <img src={user.imageUrl} alt={`${user.firstname} ${user.lastname}`} className="w-8 h-8 rounded-full mr-2" />
                                <span>{user.firstname} {user.lastname}</span>
                                <input 
                                    type="checkbox" 
                                    checked={selectedUsers.includes(user.user_id)} 
                                    readOnly 
                                    className="ml-auto"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4">
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSubmit}>Submit</Button>
                    </div>
                    </>
                    }
                    {users.length === 0 && <h2>No users available</h2>}
                </DialogContent>
            </Dialog>
        </div>
    );
};

FileCard.skeleton = () => {
    return (
        <div className="aspect-[100/127] rounded-lg overflow-hidden">
            <Skeleton className="w-full h-full" />
        </div>
    );
};

export default FileCard;