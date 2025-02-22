import * as React from 'react';
import { ChevronsUpDown, Plus } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { CreateOrganizationButton } from './create-organization';
import { ManageOrganizationButton } from './manage-organization';

export function TeamSwitcher({
    teams,
}: {
    teams: {
        name: string;
        logo: string;
        plan: string;
    }[];
}) {
    const { isMobile } = useSidebar();
    const [activeTeam, setActiveTeam] = React.useState(teams[0]);

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg  text-sidebar-primary-foreground">
                                <Image
                                    src={activeTeam.logo}
                                    alt={activeTeam.name}
                                    className="rounded-sm"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold capitalize">
                                    {activeTeam.name}
                                </span>
                                <span className="truncate text-xs">
                                    {activeTeam.plan}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? 'bottom' : 'right'}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="flex text-xs text-muted-foreground">
                            <div className="flex flex-1">Organizations</div>
                            <ManageOrganizationButton />
                        </DropdownMenuLabel>
                        {teams.map((team, index) => (
                            <DropdownMenuItem
                                key={team.name}
                                onClick={() => setActiveTeam(team)}
                                className="gap-2 p-2 capitalize"
                            >
                                <div className="flex size-6 items-center justify-center rounded-sm border">
                                    <Image
                                        src={team.logo}
                                        alt={team.name}
                                        className="rounded-sm"
                                        width={24}
                                        height={24}
                                    />
                                </div>
                                {team.name}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <CreateOrganizationButton />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
