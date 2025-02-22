import { create } from 'zustand';

const defaultState = {
    id: '',
    title: '',
    menuName: '',
    action: '',
};

interface InputModalStore {
    isOpen: boolean;
    initialState: typeof defaultState;
    onOpen: (
        id: string,
        title: string,
        menuName: string,
        action: string
    ) => void;
    onClose: () => void;
    onConfirm: () => void;
}

export const useInputModal = create<InputModalStore>((set) => ({
    isOpen: false,
    initialState: defaultState,
    onOpen: (id: string, title: string, menuName: string, action: string) =>
        set({ isOpen: true, initialState: { id, title, menuName, action } }),
    onClose: () => set({ isOpen: false, initialState: defaultState }),
    onConfirm: () => set({ isOpen: false, initialState: defaultState }),
}));
