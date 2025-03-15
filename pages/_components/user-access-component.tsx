import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogOverlay,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAuth, useOrganization } from '@clerk/clerk-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAccessComponentProps {
    fileCard: boolean
    id: string 
    orgId: string 
    userId: string
    authorId: string
    title: string
    trash: boolean
    fileType: string
}

const UserAccessComponent = ({ fileCard=false, id, orgId, userId, authorId, title, trash, fileType }: UserAccessComponentProps) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const { organization } = useOrganization();

    const provideAccess = useMutation(api.file.provideAccessToFile);

    const members = useQuery(api.files.getFileMembers, {
        fileId: id as Id<'files'>,
        orgId: orgId,
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersList = await organization?.getMemberships();
                const user_id = userId;
                const userData = usersList?.data.map((user: any) => ({
                    user_id: user.publicUserData.userId,
                    firstname: user.publicUserData.firstName,
                    lastname: user.publicUserData.lastName,
                    imageUrl: user.publicUserData.imageUrl,
                }));
                const usersExceptAuthor = userData?.filter(
                    (user: any) =>
                        user.user_id !== authorId && user.user_id !== user_id
                );
                setUsers(usersExceptAuthor || []);
            } catch (error) {
                console.error('Error fetching users from Clerk:', error);
            }
        };

        fetchUsers();
    }, [orgId]);

    useEffect(() => {
        if (members) {
            setSelectedUsers(members);
        }
    }, [members]);

    const handleUserCogClick = () => {
        setOpenDialog(true);
    };

    const handleUserSelect = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async () => {
        try {
            await provideAccess({
                fileId: id as Id<'files'>,
                orgId: orgId,
                userIds: selectedUsers,
            });
            toast.success('Permission provided successfully');
        } catch (error) {
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
        <>
            {!trash && (
                <button
                    className={cn("outline-none",
                        fileCard === true && "absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-2 outline-none")}
                    onClick={handleUserCogClick}
                >
                    <UserCog
                        className={cn(
                            'opacity-75 hover:opacity-100 transition-opacity',
                            (fileCard === true && fileType === 'image') ? 'text-white' : ''
                        )}
                    />
                </button>
            )}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogOverlay className="bg-black/30" />
                <DialogContent className="bg-white shadow-lg rounded-lg p-6">
                    <DialogTitle className="text-lg font-semibold">
                        {title}
                    </DialogTitle>
                    {users.length !== 0 && (
                        <>
                            <Input
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border rounded-md p-2 mb-4"
                            />
                            <div className="max-h-60 overflow-y-auto">
                                {users
                                    .filter((user) =>
                                        `${user.firstname} ${user.lastname}`
                                            ?.toLowerCase()
                                            .includes(searchTerm?.toLowerCase())
                                    )
                                    .map((user) => (
                                        <div
                                            key={user.user_id}
                                            onClick={() =>
                                                handleUserSelect(user.user_id)
                                            }
                                            className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                                        >
                                            <img
                                                src={user.imageUrl}
                                                alt={`${user.firstname} ${user.lastname}`}
                                                className="w-8 h-8 rounded-full mr-2"
                                            />
                                            <span>
                                                {user.firstname} {user.lastname}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(
                                                    user.user_id
                                                )}
                                                readOnly
                                                className="ml-auto"
                                            />
                                        </div>
                                    ))}
                            </div>
                            <div className="flex justify-between mt-4">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit}>Submit</Button>
                            </div>
                        </>
                    )}
                    {users.length === 0 && <h2>No users available</h2>}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default UserAccessComponent;
