import { v } from 'convex/values';

import { defineSchema, defineTable } from 'convex/server';

export default defineSchema({
    files: defineTable({
        title: v.string(),
        orgId: v.string(),
        authorId: v.string(),
        authorName: v.string(),
        trash: v.boolean(),
    })
        .index('by_org', ['orgId'])
        .index('by_org_trash', ['orgId','trash'])
        .index('by_trash', ['trash'])
        .searchIndex('search_title', {
            searchField: 'title',
            filterFields: ['orgId', 'trash'],
        })
        .searchIndex('search_trash', {
            searchField: 'trash',
            filterFields: ['orgId'],
        }),
    userFavorites: defineTable({
        fileId: v.id('files'),
        orgId: v.string(),
        userId: v.string(),
    })
        .index('by_file', ['fileId'])
        .index('by_user', ['userId'])
        .index('by_org', ['orgId'])
        .index('by_user_org', ['userId', 'orgId'])
        .index('by_user_file', ['userId', 'fileId'])
        .index('by_user_file_org', ['userId', 'fileId', 'orgId'])
        .searchIndex('search_file', {
            searchField: 'fileId',
            filterFields: ['orgId'],
    }),
    fileVersion: defineTable({
        fileId: v.id("files"),
        orgId: v.string(),
        version: v.number(),
        fileStoreId: v.id('_storage'),
    })
    .index('by_file', ['fileId'])
    .index('by_org', ['orgId'])
    .index('by_file_org', ['fileId', 'orgId'])
    .searchIndex('search_file', {
        searchField: 'fileId',
        filterFields: ['orgId'],
}),
    accessRequests: defineTable({
        fileId: v.id("files"),
        orgId: v.string(),
        requesterId: v.string(),
        status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied")),
    })
    .index('by_file', ['fileId'])
    .index('by_user', ['requesterId'])
    .index('by_org', ['orgId'])
    .index('by_user_org', ['requesterId', 'orgId'])
    .index('by_user_file', ['requesterId', 'fileId'])
    .index('by_user_file_org', ['requesterId', 'fileId', 'orgId'])
    .searchIndex('search_file', {
        searchField: 'fileId',
        filterFields: ['orgId'],
}),
    userHasAccess: defineTable({
        fileId: v.id('files'),
        orgId: v.string(),
        userId: v.string(),
    })
        .index('by_file', ['fileId'])
        .index('by_user', ['userId'])
        .index('by_org', ['orgId'])
        .index('by_user_org', ['userId', 'orgId'])
        .index('by_user_file', ['userId', 'fileId'])
        .index('by_user_file_org', ['userId', 'fileId', 'orgId'])
        .searchIndex('search_file', {
            searchField: 'fileId',
            filterFields: ['orgId'],
    }),
    trashFiles: defineTable({
        fileId: v.id('files'),
        orgId: v.string(),
        userId: v.string(),
    })
        .index('by_file', ['fileId'])
        .index('by_user', ['userId'])
        .index('by_org', ['orgId'])
        .index('by_user_org', ['userId', 'orgId'])
        .index('by_user_file', ['userId', 'fileId'])
        .index('by_user_file_org', ['userId', 'fileId', 'orgId'])
        .searchIndex('search_file', {
            searchField: 'fileId',
            filterFields: ['orgId'],
        }),
});
