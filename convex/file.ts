import { v } from 'convex/values';

import { mutation, query, internalMutation } from './_generated/server';
import { Id } from './_generated/dataModel';
import { ConvexError } from 'convex/values';

const deleteFile = async (ctx: any, fileId: Id<'files'>) => {
    const fileVersion = await ctx.db
        .query('fileVersion')
        .withIndex('by_file', (q) => q.eq('fileId', fileId))
        .collect();
    for (const v of fileVersion) {
        if (v.fileStoreId) {
            await ctx.storage.delete(v.fileStoreId);
        }
        await ctx.db.delete(v._id);
    }
    const sharedFile = await ctx.db
        .query('userHasAccess')
        .withIndex('by_file', (q) => q.eq('fileId', fileId))
        .collect();
    if (sharedFile) {
        for (const sf of sharedFile) {
            await ctx.db.delete(sf._id);
        }
    }
    const document = await ctx.db
        .query('userFavorites')
        .withIndex('by_file', (q) => q.eq('fileId', fileId))
        .collect();
    if (document) {
        for (const d of document) {
            await ctx.db.delete(d._id);
        }
    }
    const trashFile = await ctx.db
        .query('trashFiles')
        .withIndex('by_file', (q) => q.eq('fileId', fileId))
        .first();
    if (trashFile) {
        await ctx.db.delete(trashFile._id);
    }

    const accessRequests = await ctx.db
        .query('accessRequests')
        .withIndex('by_file', (q) => q.eq('fileId', fileId))
        .collect();
    if (accessRequests) {
        for (const ar of accessRequests) {
            await ctx.db.delete(ar._id);
        }
    }
    await ctx.db.delete(fileId);
    return;
};

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

export const updateFileName = mutation({
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

export const deleteFilePermanentely = mutation({
    args: {
        id: v.id('files'),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authorized');
        }
        await deleteFile(ctx, args.id);
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
        const document = await ctx.db
            .query('userHasAccess')
            .withIndex('by_file_org', (q) =>
                q
                    .eq('fileId', args.fileId)
                    .eq('orgId', args.orgId)
            )
            .collect();
        Promise.all(
            document.map(async (item)=>{
                await ctx.db.delete(item._id);
            })
        )
        for (const userId of args.userIds) {
            const file = await ctx.db.insert('userHasAccess', {
                fileId: args.fileId,
                orgId: args.orgId,
                userId: userId,
            });
            return file !== null;
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
        orgId: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError('Unauthenticated');
        }

        const file = await ctx.db.get(args.id);
        if (!file) {
            throw new ConvexError('File does not exist');
        }

        // Check if user is author
        const isAuthor = file.authorId === identity.subject;

        // Check if user has been granted access
        const accessGrants = await ctx.db
            .query('userHasAccess')
            .withIndex('by_user_file_org', (q) =>
                q
                    .eq('userId', identity.subject)
                    .eq('fileId', args.id)
                    .eq('orgId', args.orgId)
            )
            .unique();

        if (!isAuthor && !accessGrants) {
            throw new ConvexError('Access denied');
        }

        const storage = await ctx.db
            .query('fileVersion')
            .withIndex('by_file_org', (q) =>
                q.eq('fileId', file?._id).eq('orgId', args.orgId)
            )
            .first();
        const metaData = storage?.fileStoreId
            ? await ctx.db.system.get(storage?.fileStoreId)
            : null;
        const isFavorite = await ctx.db
            .query('userFavorites')
            .withIndex('by_user_file_org', (q) =>
                q
                    .eq('userId', identity.subject)
                    .eq('fileId', file._id)
                    .eq('orgId', args.orgId)
            )
            .first();
        return {
            ...file,
            fileStoreId: storage?.fileStoreId,
            metaData,
            isFavorite: !!isFavorite,
        };
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
                await deleteFile(ctx, f.fileId);
            }
        });
        return;
    },
});

export const getById = query({
    args: { fileId: v.id('files') },
    handler: async (ctx, args) => {
        const file = await ctx.db.get(args.fileId);

        if (!file || file.trash) {
            throw new Error('File not found');
        }

        return {
            _id: file._id,
            title: file.title,
            orgId: file.orgId,
            authorId: file.authorId,
            authorName: file.authorName,
            trash: file.trash,
        };
    },
});

export const requestAccess = mutation({
    args: {
        fileId: v.id('files'),
        orgId: v.string(),
        userId: v.string(),
        userEmail: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError('Unauthenticated');
        }

        const file = await ctx.db.get(args.fileId);
        if (!file) {
            throw new ConvexError('File does not exist');
        }

        const existingRequest = await ctx.db
            .query('accessRequests')
            .withIndex('by_user_file_status', (q) => 
                q.eq('requesterId', args.userId)
                .eq('fileId', args.fileId)
                .eq('status', 'pending')
            )
            .unique();

        if (existingRequest) {
            throw new ConvexError('Access request already exists');
        }

        await ctx.db.insert('accessRequests', {
            fileId: args.fileId,
            orgId: args.orgId,
            requesterId: args.userId,
            requesterEmail: args.userEmail,
            status: 'pending',
            createdAt: Date.now(),
        });
    },
});

export const getAccessRequest = query({
    args: {
        fileId: v.id('files'),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError('Unauthenticated');
        }

        if (identity.subject !== args.userId) {
            throw new ConvexError('Unauthorized');
        }

        const rejectedRequest = await ctx.db
            .query('accessRequests')
            .withIndex('by_user_file_status', (q) =>
                q
                .eq('requesterId', args.userId)
                .eq('fileId', args.fileId)
                .eq('status', 'rejected')
            )
            .unique();


        const pendingRequest = await ctx.db
            .query('accessRequests')
            .withIndex('by_user_file_status', (q) =>
                q
                .eq('requesterId', args.userId)
                .eq('fileId', args.fileId)
                .eq('status', 'pending')
            )
            .unique();

        if (pendingRequest) {
            return pendingRequest;
        }
       else if (rejectedRequest) {
            return rejectedRequest
        }
        return null;
        
    },
});

export const getAccessRequestsForAuthor = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const requests = await ctx.db
            .query("accessRequests")
            .collect();

        // Get all unique file IDs from the requests
        const fileIds = [...new Set(requests.map((r) => r.fileId))];

        // Fetch all files in one query
        const files = await Promise.all(
            fileIds.map((id) => ctx.db.get(id))
        );

        // Create a map of file ID to file data
        const fileMap = new Map(files.map((f) => [f._id, f]));

        // Filter requests where the user is the author of the file
        const authorRequests = requests.filter((request) => {
            const file = fileMap.get(request.fileId);
            return file?.authorId === args.userId;
        });

        // Map the requests to include file information
        return authorRequests.map((request) => {
            const file = fileMap.get(request.fileId);
            return {
                _id: request._id,
                _creationTime: request.createdAt,
                fileId: request.fileId,
                fileName: file?.title || "Unknown File",
                requesterId: request.requesterId,
                requesterEmail: request.requesterEmail,
                status: request.status,
                comments: request.comments,
                updatedAt: request.updatedAt
            };
        });
    }
});

export const approveAccess = mutation({
    args: {
        requestId: v.id("accessRequests"),
        fileId: v.id("files"),
        userId: v.string(),
        comments: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError('Unauthenticated');
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) {
            throw new ConvexError("Access request not found");
        }

        const file = await ctx.db.get(args.fileId);
        if (!file) {
            throw new ConvexError("File not found");
        }

        // Check if the current user is the author of the file
        if (file.authorId !== identity.subject) {
            throw new ConvexError("Unauthorized: Only the file author can approve access requests");
        }

        // Update request status
        await ctx.db.patch(args.requestId, {
            status: "approved",
            comments: args.comments,
            updatedAt: Date.now()
        });

        // Grant access in userHasAccess table
        await ctx.db.insert("userHasAccess", {
            userId: args.userId,
            fileId: args.fileId,
            orgId: file.orgId,
            grantedAt: Date.now()
        });

        return { success: true };
    }
});

export const rejectAccess = mutation({
    args: {
        requestId: v.id("accessRequests"),
        fileId: v.id("files"),
        userId: v.string(),
        comments: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError('Unauthenticated');
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) {
            throw new ConvexError("Access request not found");
        }

        const file = await ctx.db.get(args.fileId);
        if (!file) {
            throw new ConvexError("File not found");
        }

        // Check if the current user is the author of the file
        if (file.authorId !== identity.subject) {
            throw new ConvexError("Unauthorized: Only the file author can reject access requests");
        }

        // Update request status
        await ctx.db.patch(args.requestId, {
            status: "rejected",
            comments: args.comments,
            updatedAt: Date.now()
        });

        return { success: true };
    }
});

export const getAccessRequestsForUser = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const requests = await ctx.db
            .query("accessRequests")
            .withIndex("by_user", (q) => q.eq("requesterId", args.userId))
            .collect();

        // Get all unique file IDs from the requests
        const fileIds = [...new Set(requests.map((r) => r.fileId))];

        // Fetch all files in one query
        const files = await Promise.all(
            fileIds.map((id) => ctx.db.get(id))
        );

        // Create a map of file ID to file data
        const fileMap = new Map(files.map((f) => [f._id, f]));

        // Map the requests to include file information
        return requests.map((request) => {
            const file = fileMap.get(request.fileId);
            return {
                _id: request._id,
                _creationTime: request.createdAt,
                fileId: request.fileId,
                fileName: file?.title || "Unknown File",
                requesterId: request.requesterId,
                requesterEmail: request.requesterEmail,
                status: request.status,
                comments: request.comments,
                updatedAt: request.updatedAt
            };
        });
    }
});
