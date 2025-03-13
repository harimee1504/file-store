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
    metaData?: any;
}

type FileListProps = FileProps[];

export const getFiles = query({
    args: {
        orgId: v.string(),
        search: v.optional(v.string()),
        favourite: v.optional(v.boolean()),
        trash: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        let files: FileListProps = [];
        let allFiles: FileListProps = [];
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

            files.map((file) => ({ ...file, trash: true }));

            allFiles = files;
        }
        else if (args.favourite) {
            const favoriteFile = await ctx.db
                .query('userFavorites')
                .withIndex('by_user_org', (q) =>
                    q.eq('userId', identity.subject).eq('orgId', args.orgId)
                )
                .order('desc')
                .collect();

            const fileIds = favoriteFile.map((file) => file.fileId);
            files = await getAllOrThrow(ctx.db, fileIds);
            allFiles = [...files];
        }

        else {
            files = await ctx.db
                .query('files')
                .withIndex('by_org_author_trash', (q) => q.eq('orgId', args.orgId).eq('authorId', identity.subject).eq('trash',false))
                .order('desc')
                .collect();
            const userAccessFiles = await ctx.db.query("userHasAccess").withIndex("by_user",
                (q) => q.eq("userId", identity.subject)
            ).order('desc').collect();

            const otherFiles = await Promise.all(
                userAccessFiles.map(async(file)=> {
                    const fileData = await ctx.db.get(file.fileId);
                    return {...fileData};
                })
            )
            allFiles = [...files,...otherFiles.filter((file)=>file.trash === false)]
        }


        const fileWithStorageId = await Promise.all(
            allFiles.map(async (file) => {
                const storage = await ctx.db
                    .query('fileVersion')
                    .withIndex('by_file_org', (q) =>
                        q
                            .eq('fileId', file._id)
                            .eq('orgId', args.orgId)
                    )
                    .first();
                const metaData = storage?.fileStoreId ? await ctx.db.system.get(storage?.fileStoreId) : null;
                return { ...file, fileStoreId: storage?.fileStoreId, metaData };
            })
        );

        if (args.favourite === true) {
            const fileWithFavorite = fileWithStorageId.map((file) => {
                const isFavorite = true;
                return { ...file, isFavorite: !!isFavorite }
            });
            return fileWithFavorite;
        }
        else {
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
        }
    },
});

export const getFileMembers = query({
    args: {
        orgId: v.string(),
        fileId: v.id('files'),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        let access = await ctx.db
                .query("userHasAccess")
                .withIndex('by_file_org', (q) =>
                    q.eq('fileId', args.fileId).eq('orgId', args.orgId)
                )
                .order('desc')
                .collect();
        const users = access.map((file)=>file.userId)
        return users;
    }
});