'use client';

import { useState, useEffect } from 'react';

import { InputModal } from '@/components/modal/input-modal';

export const ModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }
    return <>{isMounted && <InputModal />}</>;
};
