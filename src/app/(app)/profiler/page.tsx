import { PageHeader } from "@/components/page-header";
import { ProfilerTool } from "./components/profiler-tool";

export default function ProfilerPage() {
  return (
    <div>
      <PageHeader title="Patron Profiler" />
      <ProfilerTool />
    </div>
  );
}
