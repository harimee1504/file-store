import Spreedsheet from "@/assets/excel.svg"
import Powerpoint from "@/assets/powerpoint.svg"
import Word from "@/assets/word.svg"
import Pdf from "@/assets/pdf.svg"
import Zip from "@/assets/zip.png"
import Json from "@/assets/json.png"
import File from "@/assets/file.svg"

export type FileType = 'image' | 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'zip' | 'json' | 'other';

export const getFileType = (contentType: string): FileType => {

    const extension = contentType?.toLowerCase();
    
    if (!extension) return 'other';
    
    if (['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'].includes(extension)) {
        return 'image';
    }
    if (['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(extension)) {
        return 'document';
    }
    if (['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(extension)) {
        return 'spreadsheet';
    }
    if (['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(extension)) {
        return 'presentation';
    }
    if (extension === 'application/pdf') {
        return 'pdf';
    }
    if (['application/zip', 'application/x-zip-compressed', 'application/x-compressed', 'application/x-compressed-zip', 'application/x-zip'].includes(extension)) {
        return 'zip';
    }
    if (extension === 'application/json') {
        return 'json';
    }
    return 'other';
};

export const getFileColor = (type: FileType): string => {
    switch (type) {
        case 'document':
            return 'bg-blue-50';
        case 'spreadsheet':
            return 'bg-green-50';
        case 'presentation':
            return 'bg-orange-50';
        case 'pdf':
            return 'bg-red-50';
        case 'zip':
            return 'bg-purple-50';
        case 'json':
            return 'bg-yellow-50';
        default:
            return 'bg-gray-50';
    }
};

export const getFileIcon = (type: FileType) => {
    switch (type) {
        case 'document':
            return Word;
        case 'spreadsheet':
            return Spreedsheet;
        case 'presentation':
            return Powerpoint;
        case 'pdf':
            return Pdf;
        case 'zip':
            return Zip;
        case 'json':
            return Json;
        default:
            return File;
    }
}; 