import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { Id } from './_generated/dataModel';
const http = httpRouter();

http.route({
    path: '/getImage',
    method: 'OPTIONS',
    handler: httpAction(async (ctx, request) => {
        const response = new Response(null, { status: 204 });

        // Set the CORS headers for preflight
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization'
        );

        return response;
    }),
});

http.route({
    path: '/getImage',
    method: 'GET',
    handler: httpAction(async (ctx, request) => {
        try {

            // Verify the JWT and get user identity
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                return new Response('Unauthorized', { status: 401 });
            }

            const { searchParams } = new URL(request.url);
            const storageId = searchParams.get('storageId')! as Id<'_storage'>;
            const blob = await ctx.storage.get(storageId);
            if (blob === null) {
                return new Response('Image not found', {
                    status: 404,
                });
            }
            const response = new Response(blob);

            response.headers.set('Access-Control-Allow-Origin', '*'); // Allow all origins
            response.headers.set('Access-Control-Allow-Methods', 'GET');
            response.headers.set(
                'Access-Control-Allow-Headers',
                'Content-Type, Authorization'
            );

            return response;
        } catch (error) {
            console.error('Error fetching image:', error);
            return new Response(
                'Error fetching image: ' + JSON.stringify(error),
                {
                    status: 500,
                }
            );
        }
    }),
});

export default http;
