"use client";
import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useOrganization } from '@clerk/clerk-react';
import { FileCard } from './file-card';
import { Upload, Grid, List, User, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster, toast } from 'sonner';
import { Actions } from "@/components/actions";
import Loader from './Loader';
import { getFileType } from '@/lib/file-types';
const MainContent = () => {
    const router = useRouter();
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
    if (organization === undefined) return <Loader />;
    if (organization === null) return <h2>No Data ...</h2>;

    console.log(data);

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
        const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedFileType === 'All' || getFileType(file.metaData?.contentType || '') === selectedFileType;
        const matchesAuthor = !selectedAuthor || file.authorName === selectedAuthor;
        return matchesSearch && matchesType && matchesAuthor;
    });

    return (
        <section className="flex-1 px-4">
            <div className="flex items-center justify-between py-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">File Store</h2>
                    <p className="text-sm text-muted-foreground">
                        {query.favourite ? "Manage and organize your favorite files" : query.trash ? "Manage and organize your deleted files" : "Manage and organize your files"}
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
                                        metaData={file.metaData || ''}
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
                                                {format(new Date(file._creationTime), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="flex items-center gap-2">
                                                <User className="h-4 w-4 opacity-70" />
                                                {file.authorName}
                                            </TableCell>
                                            <TableCell>
                                                <Actions
                                                    id={file._id}
                                                    title={file.title}
                                                    fileUrl={file.fileStoreId || ''}
                                                    orgId={file.orgId}
                                                    side="right"
                                                    align="end"
                                                    sideOffset={12}
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
