"use client";
import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth, useOrganization } from '@clerk/clerk-react';
import { FileCard } from './file-card';
import { Upload, Grid, List, User, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster, toast } from 'sonner';
import { Actions } from "@/components/actions";
import Loader from './Loader';
import { getFileType } from '@/lib/file-types';
import { formatDistanceToNowLib } from '@/lib/utils';
import UserAccessComponent from './user-access-component';
import { Textarea } from "@/components/ui/textarea";
import { Id } from '@/convex/_generated/dataModel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MainContent = () => {
    const router = useRouter();
    const { userId  } = useAuth();
    const { query } = router;
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isUploading, setIsUploading] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFileType, setSelectedFileType] = useState('All');
    const [selectedAuthor, setSelectedAuthor] = useState('');
    const sendFile = useMutation(api.file.create);
    const generateUploadUrl = useMutation(api.file.generateUploadUrl);
    const { organization } = useOrganization();
    const data = useQuery(api.files.getFiles, {
        orgId: organization?.id || '',
        favourite: query.favourite === 'true',
        trash: query.trash === 'true',
    });
    const [comments, setComments] = useState<{ [key: string]: string }>({});
    
    const accessRequests = useQuery(api.file.getAccessRequestsForAuthor, {
        userId: userId || ''
    });

    const userRequests = useQuery(api.file.getAccessRequestsForUser, {
        userId: userId || ''
    });

    const approveAccess = useMutation(api.file.approveAccess);
    const rejectAccess = useMutation(api.file.rejectAccess);

    if (organization === undefined) return <Loader />;
    if (organization === null) return <h2>User don't have access to the organization</h2>;

    async function handleSendImage(event: FormEvent) {
        event.preventDefault();
        setIsUploading(true);

        const toastId = toast.loading('Uploading file...');

        try {
            const postUrl = await generateUploadUrl();

            const result = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': selectedFile!.type },
                body: selectedFile,
            });

            if (!result.ok) {
                throw new Error('Failed to upload file');
            }

            const { storageId } = await result.json();

            await sendFile({
                title: selectedFileName || 'Untitled',
                orgId: organization?.id || '',
                fileStoreId: storageId,
            });

            toast.success('File uploaded successfully', {
                id: toastId,
                description: selectedFileName
            });

            setSelectedFile(null);
            setSelectedFileName('');
            setIsPopupOpen(false);
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Failed to upload file', {
                id: toastId,
                description: 'Please try again'
            });
        } finally {
            setIsUploading(false);
        }
    }

    const UploadButton = () => (
        <Button onClick={() => setIsPopupOpen(true)} className="h-9 w-[200px]">
            <Upload className="size-4 opacity-70" />
            <span>Upload</span>
        </Button>
    );

    const fileTypes = ['All', 'image', 'document', 'spreadsheet', 'presentation', 'pdf', 'zip', 'json', 'other'];
    const authors = Array.from(new Set(data?.map(file => file.authorName))); // Unique authors

    const filteredData = data?.filter(file => {
        const matchesSearch = file.title?.toLowerCase().includes(searchTerm?.toLowerCase());
        const matchesType = selectedFileType === 'All' || getFileType(file.metaData?.contentType || '') === selectedFileType;
        const matchesAuthor = !selectedAuthor || file.authorName === selectedAuthor;
        return matchesSearch && matchesType && matchesAuthor;
    });

    const handleApprove = async (requestId: Id<"accessRequests">, fileId: Id<"files">, userId: string) => {
        try {
            const result = await approveAccess({
                requestId,
                fileId,
                userId,
                comments: comments[requestId] || ''
            });

            if (result.success) {
                toast.success('Access request approved successfully');
                // Clear the comments for this request
                setComments(prev => {
                    const newComments = { ...prev };
                    delete newComments[requestId];
                    return newComments;
                });
            } else {
                throw new Error('Failed to approve access request');
            }
        } catch (error: any) {
            console.error('Error approving access:', error);
            toast.error(error?.message || 'Failed to approve access request');
        }
    };

    const handleReject = async (requestId: Id<"accessRequests">, fileId: Id<"files">, userId: string) => {
        try {
            const result = await rejectAccess({
                requestId,
                fileId,
                userId,
                comments: comments[requestId] || ''
            });

            if (result.success) {
                toast.success('Access request rejected successfully');
                // Clear the comments for this request
                setComments(prev => {
                    const newComments = { ...prev };
                    delete newComments[requestId];
                    return newComments;
                });
            } else {
                throw new Error('Failed to reject access request');
            }
        } catch (error: any) {
            console.error('Error rejecting access:', error);
            toast.error(error?.message || 'Failed to reject access request');
        }
    };

    if (query.accessRequests) {
        if (!accessRequests || !userRequests) {
            return <Loader />;
        }

        const renderAccessRequestsTable = (requests: any[], isUserRequests: boolean = false) => (
            <div className="rounded-md border mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">S.No</TableHead>
                            <TableHead>File Name</TableHead>
                            <TableHead>{isUserRequests ? 'Author Email' : 'Requester Email'}</TableHead>
                            <TableHead>Requested At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Approved At</TableHead>
                            <TableHead className="w-64">Comments</TableHead>
                            {!isUserRequests && <TableHead className="w-32">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isUserRequests ? 7 : 8} className="text-center py-4">
                                    No access requests
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((request, index) => (
                                <TableRow key={request._id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{request.fileName}</TableCell>
                                    <TableCell>{request.requesterEmail}</TableCell>
                                    <TableCell>
                                        {formatDistanceToNowLib(new Date(request._creationTime))}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            request.status === 'approved' 
                                                ? 'bg-green-100 text-green-800'
                                                : request.status === 'rejected'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {request.status === 'approved' && request.updatedAt ? (
                                            formatDistanceToNowLib(new Date(request.updatedAt))
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {!isUserRequests && request.status === 'pending' ? (
                                            <Textarea
                                                placeholder="Add comments (optional)"
                                                value={comments[request._id] || ''}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(prev => ({
                                                    ...prev,
                                                    [request._id]: e.target.value.slice(0, 256)
                                                }))}
                                                className="h-20 resize-none"
                                            />
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                {request.comments || 'No comments'}
                                            </p>
                                        )}
                                    </TableCell>
                                    {!isUserRequests && (
                                        <TableCell>
                                            {request.status === 'pending' && (
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(request._id, request.fileId, request.requesterId)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleReject(request._id, request.fileId, request.requesterId)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        );

        return (
            <section className="flex-1 px-4">
                <div className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight">Access Requests</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage access requests for your files
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="requests-to-you" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                        <TabsTrigger 
                            value="requests-to-you" 
                            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                        >
                            Requests to You
                        </TabsTrigger>
                        <TabsTrigger 
                            value="requests-by-you"
                            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                        >
                            Requests by You
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="requests-to-you">
                        {renderAccessRequestsTable(accessRequests)}
                    </TabsContent>
                    <TabsContent value="requests-by-you">
                        {renderAccessRequestsTable(userRequests, true)}
                    </TabsContent>
                </Tabs>
            </section>
        );
    }

    return (
        <section className="flex-1 px-4">
            <div className="flex items-center justify-between py-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">File Store</h2>
                    <p className="text-sm text-muted-foreground">
                        {query.favourite ? "Manage and organize your favorite files" : query.trash ? "Manage and organize your deleted files" : query.accessRequests ? "Manage and organize your access requests" : "Manage and organize your files"}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <UploadButton />
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
                        <ToggleGroupItem value="grid" aria-label="Grid view">
                            <Grid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view">
                            <List className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <Input
                    type="text"
                    placeholder="Search by filename"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                />
                <select
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value)}
                    className="border rounded p-2"
                >
                    {fileTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
                <select
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="border rounded p-2"
                >
                    <option value="">All Authors</option>
                    {authors.map(author => (
                        <option key={author} value={author}>{author}</option>
                    ))}
                </select>
            </div>

            {data === undefined ? (
                <Loader />
            ) : (
                <AnimatePresence>
                    {isPopupOpen && (
                        <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                            >
                                <DialogContent className="p-6 bg-white rounded-lg shadow-lg">
                                    <DialogTitle className="text-lg font-semibold">Upload File</DialogTitle>
                                    <form onSubmit={handleSendImage} className="flex flex-col mt-4">
                                        <Label htmlFor="file-upload" className="mb-2">Select a file:</Label>
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 5 * 1024 * 1024) { // 5MB limit
                                                        toast.error('File too large', {
                                                            description: 'Please upload a file smaller than 5MB'
                                                        });
                                                        return;
                                                    }
                                                    setSelectedFile(file);
                                                    setSelectedFileName(file.name);
                                                }
                                            }}
                                            className="mb-4"
                                            accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.json,.xlsx,.xls,.doc,.docx,.ppt,.pptx,.zip,.pdf"
                                        />
                                        <div className="flex justify-end">
                                            <Button type="button" onClick={() => setIsPopupOpen(false)} className="mr-2">Cancel</Button>
                                            <Button type="submit" disabled={!selectedFile || isUploading}>
                                                {isUploading ? 'Uploading...' : 'Upload'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </motion.div>
                        </Dialog>
                    )}
                </AnimatePresence>
            )}

            {viewMode === 'grid' ? (
                <ScrollArea className="h-[calc(100vh-12rem)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
                        {filteredData?.length === 0 ? (
                            <div className="col-span-full text-center text-gray-500">
                                {query.favourite ? "No favorite files available" : query.trash ? "No deleted files available" : "No files available. Get started by uploading a file."}
                            </div>
                        ) : (
                            filteredData?.map((file) => (
                                <div key={file._id} className="w-full">
                                    <FileCard
                                        id={file._id}
                                        title={file.title}
                                        authorName={file.authorName}
                                        authorId={file.authorId}
                                        createdAt={file._creationTime}
                                        orgId={file.orgId}
                                        trash={file.trash || false}
                                        isFavorite={file.isFavorite || false}
                                        fileStoreId={file.fileStoreId || ''}
                                        metaData={file.metaData}
                                        deletedBy={file.deletedBy}
                                        deletedAt={file.deletedAt}
                                        layout="grid"
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Modified</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>User Access</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500">
                                        {query.favourite ? "No favorite files available" : query.trash ? "No deleted files available" : "No files available. Get started by uploading a file."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData?.map((file) => (
                                        <TableRow key={file._id}>
                                            <TableCell className="font-medium">
                                                {file.title}
                                            </TableCell>
                                            <TableCell>
                                                {formatDistanceToNowLib(new Date(file._creationTime))}
                                            </TableCell>
                                            <TableCell className="flex items-center gap-2">
                                                <User className="h-4 w-4 opacity-70" />
                                                {file.authorName}
                                            </TableCell>
                                            <TableCell>
                                                <UserAccessComponent fileCard={false} id={file._id} orgId={file.orgId} userId={userId || ''} authorId={file.authorId} title={file.title} trash={file.trash} fileType={getFileType(file.metaData?.contentType)}/>
                                            </TableCell>
                                            <TableCell>
                                                <Actions
                                                    id={file._id}
                                                    title={file.title}
                                                    fileUrl={file.fileStoreId || ''}
                                                    orgId={file.orgId}
                                                    trash={file.trash || false}
                                                    isAuthor={file.authorId === userId}
                                                    side="right"
                                                    align="end"
                                                    sideOffset={5}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </Actions>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
            <Toaster 
                position="bottom-right"
                expand={true}
                richColors
            />
        </section>
    );
};

export default MainContent;
