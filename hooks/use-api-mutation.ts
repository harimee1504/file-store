import { useState } from 'react';
import { useMutation } from 'convex/react';

export const useApiMutation = (mutationFunction: any) => {
    const [loading, setLoading] = useState(false);
    const apiMutation = useMutation(mutationFunction);

    const mutate = (payload: any) => {
        setLoading(true);
        return apiMutation(payload)
            .finally(() => {
                setLoading(false);
            })
            .then((response) => {
                return response;
            })
            .catch((error) => {
                throw error;
            });
    };
    return {
        mutate,
        loading,
    };
};
