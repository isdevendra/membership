
'use client';
import { PageHeader } from "@/components/page-header";
import { ReportingTool } from "./components/reporting-tool";
import { permissions } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import type { Role } from "@/lib/roles";

export default function ReportingPage() {
  const router = useRouter();
  const { claims, isUserLoading } = useUser();
  const currentUserRole = (claims?.role as Role) || 'Security';

  useEffect(() => {
    if (!isUserLoading && !permissions[currentUserRole].viewReports) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view reports.",
        variant: "destructive",
      });
      router.push('/dashboard');
    }
  }, [router, currentUserRole, isUserLoading]);

  if (isUserLoading || !permissions[currentUserRole].viewReports) {
    // Render nothing or a loading state while redirecting
    return null;
  }

  return (
    <div>
      <PageHeader title="Reporting" />
      <ReportingTool />
    </div>
  );
}
