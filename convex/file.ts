import { v } from 'convex/values';

import { mutation, query, internalMutation } from './_generated/server';

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const create = mutation({
    args: {
        fileStoreId: v.id('_storage'),
        title: v.string(),
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }

        const file = await ctx.db.insert('files', {
            title: args.title,
            orgId: args.orgId,
            trash: false,
            authorId: identity.subject,
            authorName: identity.name!,
        });
        await ctx.db.insert('fileVersion', {
            fileId: file,
            orgId: args.orgId,
            version: 0,
            fileStoreId: args.fileStoreId,
        });
        return file;
    },
});

export const updateFile = mutation({
    args: {
        id: v.id('files'),
        title: v.string(),
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        const file = await ctx.db.get(args.id);
        if (!file) {
            throw new Error('File not found');
        }
        await ctx.db.patch(args.id, { title: args.title });
    },
});


export const deleteFile = mutation({
    args: {
        id: v.id('files'),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        const file = await ctx.db.get(args.id);
        if (file?.fileStoreId) {
            await ctx.storage.delete(file.fileStoreId);
        }
        const deleted = await ctx.db.delete(args.id);
        const document = await ctx.db
            .query('userFavorites')
            .withIndex('by_user_file', (q) =>
                q.eq('userId', identity.subject).eq('fileId', args.id)
            )
            .first();
        if (document) {
            await ctx.db.delete(document._id);
        }
        const trashFile = await ctx.db
            .query('trashFiles')
            .withIndex('by_user_file', (q) =>
                q.eq('userId', identity.subject).eq('fileId', args.id)
            )
            .first();
        if (trashFile) {
            await ctx.db.delete(trashFile._id);
        }
        return;
    },
});

export const favoriteFile = mutation({
    args: {
        fileId: v.id('files'),
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        const document = await ctx.db
            .query('userFavorites')
            .withIndex('by_user_file_org', (q) =>
                q
                    .eq('userId', identity.subject)
                    .eq('fileId', args.fileId)
                    .eq('orgId', args.orgId)
            )
            .first();
        if (document) {
            throw new Error('Already favorited');
        }
        const file = await ctx.db.insert('userFavorites', {
            fileId: args.fileId,
            orgId: args.orgId,
            userId: identity.subject,
        });
        return file;
    },
});

export const unfavoriteFile = mutation({
    args: {
        fileId: v.id('files'),
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        const document = await ctx.db
            .query('userFavorites')
            .withIndex('by_user_file_org', (q) =>
                q
                    .eq('userId', identity.subject)
                    .eq('fileId', args.fileId)
                    .eq('orgId', args.orgId)
            )
            .first();
        if (!document) {
            throw new Error('Not found');
        }
        const file = await ctx.db.delete(document._id);
        return file;
    },
});

export const provideAccessToFile = mutation({
    args: {
        fileId: v.id('files'),
        orgId: v.string(),
        userIds: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }

        for (const userId of args.userIds) {
            const document = await ctx.db
                .query('userHasAccess')
                .withIndex('by_user_file_org', (q) =>
                    q
                    .eq('userId', userId)
                    .eq('fileId', args.fileId)
                    .eq('orgId', args.orgId)
                )
                .first();
            if (!document) {
                const file = await ctx.db.insert('userHasAccess', {
                    fileId: args.fileId,
                    orgId: args.orgId,
                    userId: userId,
                });
            }
        }
    },
});

export const revokeAccessToFile = mutation({
    args: {
        fileId: v.id('files'),
        orgId: v.string(),
        userIds: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        for (const userId of args.userIds) {
            const document = await ctx.db
                .query('userHasAccess')
                .withIndex('by_user_file_org', (q) =>
                    q
                        .eq('userId', userId)
                        .eq('fileId', args.fileId)
                        .eq('orgId', args.orgId)
                )
                .first();
            if (!document) {
                throw new Error('Not found');
            }
            await ctx.db.delete(document._id);
        }
    },
});

export const trashFile = mutation({
    args: {
        fileId: v.id('files'),
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        const document = await ctx.db
            .query('trashFiles')
            .withIndex('by_user_file_org', (q) =>
                q
                    .eq('userId', identity.subject)
                    .eq('fileId', args.fileId)
                    .eq('orgId', args.orgId)
            )
            .first();
        if (document) {
            throw new Error('Already in trash');
        }
        
        await ctx.db.patch(args.fileId, { trash: true });

        const file = await ctx.db.insert('trashFiles', {
            fileId: args.fileId,
            orgId: args.orgId,
            userId: identity.subject,
        });
        
        return file;
    },
});

export const recoverTrashFile = mutation({
    args: {
        fileId: v.id('files'),
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        const document = await ctx.db
            .query('trashFiles')
            .withIndex('by_user_file_org', (q) =>
                q
                    .eq('userId', identity.subject)
                    .eq('fileId', args.fileId)
                    .eq('orgId', args.orgId)
            )
            .first();
        if (!document) {
            throw new Error('Not found');
        }
        await ctx.db.patch(args.fileId, { trash: false });
        const file = await ctx.db.delete(document._id);
        return file;
    },
});

export const getFile = query({
    args: {
        id: v.id('files'),
    },
    handler: async (ctx, args) => {
        const file = await ctx.db.get(args.id);
        return file;
    },
});

function isFifteenDaysAgo(timestampMs: number): boolean {
    const dateFromTimestamp = new Date(timestampMs);

    const currentDate = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(currentDate.getDate() - 15);

    return dateFromTimestamp <= fifteenDaysAgo;
}

export const clearTrash = internalMutation({
    handler: async (ctx) => {
        const files = await ctx.db.query('trashFiles').collect();
        files.map(async (f) => {
            const doDelete = isFifteenDaysAgo(f._creationTime);
            if (doDelete) {
                const file = await ctx.db.get(f.fileId);
                if (file?.fileStoreId) {
                    const fileDeleted = await ctx.storage.delete(
                        file.fileStoreId
                    );
                }
                const deleted = await ctx.db.delete(f.fileId);
                const sharedFile = await ctx.db
                    .query('userHasAccess')
                    .withIndex('by_file', (q) => q.eq('fileId', f.fileId))
                    .collect();
                if (sharedFile) {
                    for (const sf of sharedFile) {
                        await ctx.db.delete(sf._id);
                    }
                }
                const document = await ctx.db
                    .query('userFavorites')
                    .withIndex('by_file', (q) => q.eq('fileId', f.fileId))
                    .collect();
                if (document) {
                    for (const d of document) {
                        await ctx.db.delete(d._id);
                    }
                }
                const trashFile = await ctx.db
                    .query('trashFiles')
                    .withIndex('by_file', (q) => q.eq('fileId', f.fileId))
                    .first();
                if (trashFile) {
                    await ctx.db.delete(trashFile._id);
                }
                return;
            }
        });
        return;
    },
});
