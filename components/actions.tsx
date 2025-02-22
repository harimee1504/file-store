'uses client';

import { DropdownMenuContentProps } from '@radix-ui/react-dropdown-menu';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from './ui/dropdown-menu';
import { Download, Link2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { api } from '@/convex/_generated/api';
import ConfirmModal from './modal/confirm-modal';
import { Button } from './ui/button';
import { useInputModal } from '@/store/use-rename-modal';

interface ActionsProps {
    children: React.ReactNode;
    side?: DropdownMenuContentProps['side'];
    align?: DropdownMenuContentProps['align'];
    sideOffset?: DropdownMenuContentProps['sideOffset'];
    alignOffset?: DropdownMenuContentProps['alignOffset'];
    fileUrl: string;
    id: string;
    title: string;
    orgId: string;
}

export const Actions = ({
    children,
    side,
    align,
    sideOffset,
    alignOffset,
    id,
    title,
    fileUrl,
    orgId,
}: ActionsProps) => {
    const { onOpen } = useInputModal();
    const {
        mutate: permanentelyDeleteFile,
        loading: permanentelyDeleteFileLoading,
    } = useApiMutation(api.file.deleteFile);
    const { mutate: deleteFile, loading: deleteFileLoading } = useApiMutation(
        api.file.trashFile
    );

    const permanentDelete = () => {
        permanentelyDeleteFile({
            id,
        })
            .then(() => {
                toast.success('File deleted successfully');
            })
            .catch((error) => {
                console.error(error);
                toast.error('Failed to delete file');
            });
    };

    const moveToTrash = () => {
        deleteFile({
            fileId: id,
            orgId,
        })
            .then(() => {
                toast.success('File deleted successfully');
            })
            .catch((error) => {
                console.error(error);
                toast.error('Failed to delete file');
            });
    };
    const copyLink = () => {
        navigator.clipboard
            .writeText(`${fileUrl}`)
            .then(() => {
                toast.success('Link copied to clipboard');
            })
            .catch((error) => {
                toast.error(error);
            });
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const link = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            link.href = url;
            link.download = title;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading the file', error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
            <DropdownMenuContent
                side={side}
                align={align}
                sideOffset={sideOffset}
                alignOffset={alignOffset}
                onClick={(e) => e.stopPropagation()}
                className="w-56"
            >
                <DropdownMenuItem
                    onClick={copyLink}
                    className="p-3 cursor-pointer"
                >
                    <Link2 className="h-4 w-4 mr-2" />
                    Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleDownload}
                    className="p-3 cursor-pointer"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                </DropdownMenuItem>
                <ConfirmModal
                    title="Move to Trash"
                    description="Are you sure you want to delete this file?"
                    onConfirm={moveToTrash}
                    disabled={deleteFileLoading}
                >
                    <Button
                        variant="ghost"
                        className="p-3 cursor-pointer text-sm w-full justify-start font-normal"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Move to Trash
                    </Button>
                </ConfirmModal>
                <ConfirmModal
                    title="Delete File"
                    description="Are you sure you want to delete this file permanently?"
                    onConfirm={permanentDelete}
                    disabled={permanentelyDeleteFileLoading}
                >
                    <Button
                        variant="ghost"
                        className="p-3 cursor-pointer text-sm w-full justify-start font-normal"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </ConfirmModal>
                <DropdownMenuItem
                    onClick={() => onOpen(id, title, 'Rename File', 'update')}
                    className="p-3 cursor-pointer"
                >
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
