'use client';

import { Plus } from 'lucide-react';
import { CreateOrganization } from '@clerk/clerk-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export const CreateOrganizationButton = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="flex gap-2 p-2 items-center cursor-pointer">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                        <Plus className="size-4" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Create Organization
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="p-0 bg-transparent border-none max-w-[300px]">
                <CreateOrganization />
            </DialogContent>
        </Dialog>
    );
};
