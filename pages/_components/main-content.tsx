"use client";
import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useOrganization } from '@clerk/clerk-react';
import { FileCard } from './file-card';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

const MainContent = () => {
    const router = useRouter();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const sendFile = useMutation(api.file.create);
    const generateUploadUrl = useMutation(api.file.generateUploadUrl);
    const { organization } = useOrganization();
    const data = useQuery(api.files.getFiles, {
        orgId: organization?.id || '',
    });
    if (organization === undefined) return <h2>Loading ...</h2>;
    if (organization === null) return <h2>No Data ...</h2>;

    async function handleSendImage(event: FormEvent) {
        event.preventDefault();

        const postUrl = await generateUploadUrl();

        const result = await fetch(postUrl, {
            method: 'POST',
            headers: { 'Content-Type': selectedFile!.type },
            body: selectedFile,
        });

        const { storageId } = await result.json();

        await sendFile({
            title: selectedFileName || 'Untitled',
            orgId: organization?.id || '',
            fileStoreId: storageId,
        });
        (document.getElementById('fileInput') as HTMLFormElement).reset();
        setSelectedFile(null);
        setSelectedFileName('');
    }
    return (
        <section className="flex flex-1 px-4">
            <div className="grid gap-x-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 mt-8 pb-10">
                <form
                    onSubmit={(e) => handleSendImage(e)}
                    id="fileInput"
                    className="relative ml-4 mr-4 flex h-56 w-52 border items-center justify-center flex-col rounded-sm"
                >
                    <Upload className="size-8 mb-4 opacity-20" />
                    <input
                        type="file"
                        onChange={(event) => {
                            setSelectedFile(event.target.files![0]);
                            setSelectedFileName(event.target.files![0].name);
                        }}
                        disabled={selectedFile !== null}
                        className="w-full h-full opacity-0 absolute bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
                    />
                    <span className="filename-webkit-fill overflow-hidden text-ellipsis">
                        {selectedFileName}
                    </span>
                    <input
                        type="submit"
                        value="Upload File"
                        disabled={selectedFile === null}
                        className={cn(
                            'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer',
                            selectedFile !== null && 'z-10'
                        )}
                    />
                </form>

                {data?.map((file) => (
                    <FileCard
                        key={file._id}
                        id={file._id}
                        title={file.title}
                        authorName={file.authorName}
                        authorId={file.authorId}
                        createdAt={file._creationTime}
                        orgId={file.orgId}
                        isFavorite={file.isFavorite}
                        fileStoreId={file.fileStoreId}
                    />
                ))}
            </div>
        </section>
    );
};

export default MainContent;

{
    /* <section className="flex flex-1 px-4">
<div className="grid gap-x-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 mt-8 pb-10">
    <form
        onSubmit={(e) => handleSendImage(e)}
        id="fileInput"
        className="relative ml-4 mr-4 flex h-56 w-52 border items-center justify-center flex-col rounded-sm"
    >
        <Upload className="size-8 mb-4 opacity-20" />
        <input
            type="file"
            onChange={(event) => {
                setSelectedFile(event.target.files![0]);
                setSelectedFileName(event.target.files![0].name);
            }}
            disabled={selectedFile !== null}
            className="w-full h-full opacity-0 absolute bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
        />
        <span className="filename-webkit-fill overflow-hidden text-ellipsis">
        {selectedFileName}
        </span>
        <input
            type="submit"
            value="Upload File"
            disabled={selectedFile === null}
            className={cn("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer",
                selectedFile !== null && 'z-10'
            )}
        />
    </form>
    
    {data?.map((file) => (
        <FileCard
            key={file._id}
            id={file._id}
            title={file.title}
            authorName={file.authorName}
            authorId={file.authorId}
            createdAt={file._creationTime}
            orgId={file.orgId}
            isFavorite={file.isFavorite}
            fileStoreId={file.fileStoreId}
        />
    ))}
</div>
</section> */
}
