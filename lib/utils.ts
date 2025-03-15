import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import moment from 'moment';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDistanceToNowLib(date: any) {
    const now = moment();
    const inputDate = moment(date);
    const diffInSeconds = now.diff(inputDate, 'seconds');

    const units = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 }
    ];

    for (const unit of units) {
        const value = Math.floor(diffInSeconds / unit.seconds);
        if (value >= 1) {
            return `${value} ${unit.label}${value > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}

export function formatLib(date: Date, strFormat: string) {
    return moment(date).format(strFormat);
}