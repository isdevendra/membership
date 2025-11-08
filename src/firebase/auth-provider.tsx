"use client";

import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
     if (!isUserLoading && user && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [isUserLoading, user, router, pathname]);

  if (isUserLoading || (!user && pathname !== '/login')) {
    return (
        <div className="flex items-center justify-center h-screen">
          <div className="space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
    );
  }

  // Allow access to login page even if not authenticated
  if (!user && pathname === '/login') {
    return <>{children}</>;
  }
  
  // If user is logged in, show the content
  if(user) {
    return <>{children}</>;
  }

  return null;
}
