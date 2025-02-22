import * as React from 'react';
import { File, SquareTerminal } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';
import { useOrganizationList } from '@clerk/clerk-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AppName, Logo } from '@/constants/constants';

const data = {
    navMain: [
        {
            title: 'File Store',
            url: '#',
            icon: File,
            isActive: true,
            items: [
                {
                    title: 'Files',
                    url: '#',
                },
                {
                    title: 'Favorite',
                    url: '#',
                },
                {
                    title: 'Bin',
                    url: '#',
                },
            ],
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { open } = useSidebar();

    const { userMemberships } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    });
    if (userMemberships === undefined) return <h2>Loading ...</h2>;
    if (
        userMemberships === null ||
        userMemberships.data === undefined ||
        userMemberships.data.length === 0
    )
        return <h2>No Data ...</h2>;

    if (!userMemberships?.data?.length) return null;

    let teams: {
        name: string;
        logo: string;
        plan: string;
    }[] = [];

    userMemberships.data.forEach((membership) => {
        teams.push({
            name: membership.organization.name,
            logo: membership.organization.imageUrl,
            plan: '',
        });
    });

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
