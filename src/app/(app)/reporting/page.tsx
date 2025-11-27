
'use client';
import { PageHeader } from "@/components/page-header";
import { ReportingTool } from "./components/reporting-tool";
import { permissions, currentUserRole } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export default function ReportingPage() {
  const router = useRouter();

  useEffect(() => {
    if (!permissions[currentUserRole].viewReports) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view reports.",
        variant: "destructive",
      });
      router.push('/dashboard');
    }
  }, [router]);

  if (!permissions[currentUserRole].viewReports) {
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
