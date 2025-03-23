"use client";
import { api } from '@/convex/_generated/api';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn } from '@/lib/utils';
import { useOrganization } from '@clerk/clerk-react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface FooterProps {
    isFavorite: boolean;
    title: string;
    authorLabel: string;
    createdAtLabel: string;
    deleteDateLabel: string | null;
    disabled?: boolean;
    onClick?: () => void;
    fileId?: string;
    hovering: boolean;
    deletedByLabel?: string;
}
export const Footer = ({
    isFavorite,
    title,
    authorLabel,
    createdAtLabel,
    deleteDateLabel,
    disabled,
    fileId,
    hovering,
    deletedByLabel
}: FooterProps) => {
    const { mutate: favoriteFile, loading: loadingFavorite } = useApiMutation(
        api.file.favoriteFile
    );
    const { mutate: unfavoriteFile, loading: loadingUnfavorite } =
        useApiMutation(api.file.unfavoriteFile);
    const { organization } = useOrganization();
    const handleFavorite = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        e.preventDefault();
        if (!organization) return;
        if (isFavorite) {
            unfavoriteFile({ fileId: fileId, orgId: organization.id })
                .then(() => {
                    toast.success('File unfavorited successfully');
                })
                .catch((error) => {
                    console.error(error);
                    toast.error('Failed to unfavorite File');
                });
        } else {
            favoriteFile({ fileId: fileId, orgId: organization.id })
                .then(() => {
                    toast.success('File favorited successfully');
                })
                .catch((error) => {
                    console.error(error);
                    toast.error('Failed to favorite File');
                });
        }
    };
    return (
        <div className="relative bg-white p-3">
            <p className="text-[13px] truncate max-w-[calc(100%-20px)]">
                {title}
            </p>
            {hovering && (
                <>
                    {deletedByLabel === '' && <p className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-muted-foreground truncate">
                        {authorLabel}
                        <br /> {createdAtLabel}
                    </p>}
                    {deletedByLabel && <p className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-muted-foreground truncate" title={deletedByLabel}>
                        Deleted by {deletedByLabel}
                        <br/>{deleteDateLabel} days left to restore
                    </p>}
                    {deletedByLabel === '' && <button
                        disabled={
                            disabled || loadingFavorite || loadingUnfavorite
                        }
                        onClick={handleFavorite}
                        className={cn(
                            'absolute right-3 top-3 opacity-0 group-hover:opacity-100 hover:text-blue-600 text-muted-foreground',
                            disabled || loadingFavorite || loadingUnfavorite
                                ? 'cursor-not-allowed'
                                : 'cursor-pointer'
                        )}
                    >
                        <Star
                            className={cn(
                                'w-4 h-4',
                                isFavorite
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted-foreground'
                            )}
                        />
                    </button>}
                </>
            )}
        </div>
    );
};

export default Footer;