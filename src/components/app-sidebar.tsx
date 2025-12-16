

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  LayoutDashboard,
  UserPlus,
  Users,
  Award,
  Settings,
  FileText,
  KeyRound,
  LogOut,
  LogIn,
  UploadCloud,
  Building,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/roles";


const menuItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/members",
    icon: Users,
    label: "Members",
  },
  {
    href: "/enrollment",
    icon: UserPlus,
    label: "Enrollment",
  },
  {
    href: "/check-in",
    icon: LogIn,
    label: "Check-in",
  },
  {
    href: "/rewards",
    icon: Award,
    label: "Rewards",
  },
  {
    href: "/reporting",
    icon: FileText,
    label: "Reporting",
  },
  {
    href: "/import-export",
    icon: UploadCloud,
    label: "Import / Export",
  },
   {
    href: "/companies",
    icon: Building,
    label: "Companies",
    requiredRole: 'Super Admin'
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
  },
  {
    href: "/auth-roles",
    icon: KeyRound,
    label: "Auth & Roles",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { claims } = useUser();
  const userRole = (claims?.role as Role) || 'Security';

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Logo className="size-8 text-sidebar-primary" />
          <span className="text-lg font-semibold font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Membership
          </span>
        </div>
      </SidebarHeader>
     
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            if (item.requiredRole && item.requiredRole !== userRole) {
                return null;
            }
            return (
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label }}
                >
                    <Link href={item.href}>
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip={{children: 'Sign Out'}}>
              <LogOut />
              <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

    
