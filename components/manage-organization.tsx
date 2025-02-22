'use client';

import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Hint } from '@/components/hint';
import { OrganizationProfile } from '@clerk/clerk-react';

export const ManageOrganizationButton = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div>
                    <Hint
                        label="Organization settings"
                        side="right"
                        align="start"
                        sideOffset={14}
                    >
                        <button className="h-full w-full rounded-md flex items-center justify-between opacity-100 transition">
                            <Settings className="w-4 h-4" />
                        </button>
                    </Hint>
                </div>
            </DialogTrigger>
            <DialogContent className="p-0 bg-transparent border-none max-w-[300px]">
                <OrganizationProfile />
            </DialogContent>
        </Dialog>
    );
};
