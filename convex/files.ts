import { v } from 'convex/values';
import { query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { getAllOrThrow } from 'convex-helpers/server/relationships';

interface FileProps {
    _id: Id<'files'>;
    _creationTime: number;
    title: string;
    orgId: string;
    authorId: string;
    authorName: string;
    trash: boolean;
    isFavorite?: boolean;
    file?: string;
}

type FileListProps = FileProps[];

export const getFiles = query({
    args: {
        orgId: v.string(),
        search: v.optional(v.string()),
        favorites: v.optional(v.string()),
        trash: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        let files: FileListProps = [];
        if (args.trash) {
            const trashFile = await ctx.db
                .query('trashFiles')
                .withIndex('by_user_org', (q) =>
                    q.eq('userId', identity.subject).eq('orgId', args.orgId)
                )
                .order('desc')
                .collect();

            const fileIds = trashFile.map((file) => file.fileId);
            files = await getAllOrThrow(ctx.db, fileIds);

            return files.map((file) => ({ ...file, trash: true }));
        }
        if (args.favorites) {
            const favoriteFile = await ctx.db
                .query('userFavorites')
                .withIndex('by_user_org', (q) =>
                    q.eq('userId', identity.subject).eq('orgId', args.orgId)
                )
                .order('desc')
                .collect();

            const fileIds = favoriteFile.map((file) => file.fileId);
            files = await getAllOrThrow(ctx.db, fileIds);

            return files.map((file) => ({ ...file, isFavorite: true }));
        }

        const title = args.search;
        if (title) {
            files = await ctx.db
                .query('files')
                .withSearchIndex('search_title', (q) =>
                    q.search('title', title)
                    .eq('orgId', args.orgId)
                    .eq('trash', false)
                )
                .collect();
        } else {
            files = await ctx.db
                .query('files')
                .withIndex('by_org_trash', (q) => q.eq('orgId', args.orgId).eq('trash', false))
                .order('desc')
                .collect();
        }

        const fileWithStorageId = await Promise.all(
            files.map(async (file) => {
                const storage = await ctx.db
                    .query('fileVersion')
                    .withIndex('by_file_org', (q) =>
                        q
                            .eq('fileId', file._id)
                            .eq('orgId', args.orgId)
                    )
                    .first();
                return { ...file, fileStoreId: storage?.fileStoreId };
            })
        );

        const fileWithFavorite = await Promise.all(
            fileWithStorageId.map(async (file) => {
                const isFavorite = await ctx.db
                    .query('userFavorites')
                    .withIndex('by_user_file_org', (q) =>
                        q
                            .eq('userId', identity.subject)
                            .eq('fileId', file._id)
                            .eq('orgId', args.orgId)
                    )
                    .first();
                return { ...file, isFavorite: !!isFavorite };
            })
        );
        return fileWithFavorite;
    },
});
