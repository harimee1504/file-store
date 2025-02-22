import { Files, Folders, Star, Trash2 } from 'lucide-react';

export const Logo = {
    src: '/logo.png',
    width: '38',
    height: '',
    alt: 'File Store',
};

export const AppName = 'File Store';

export const AppIcon = Folders;

export const SideMenu = {
    items: [
        {
            name: 'Files',
            path: '/file-store',
            icon: Files,
        },
        {
            name: 'Favorites',
            path: '/file-store?favourites=true',
            icon: Star,
        },
        {
            name: 'Trash',
            path: '/file-store/trash',
            icon: Trash2,
        },
    ],
};
