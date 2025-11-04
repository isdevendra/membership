import { PageHeader } from "@/components/page-header";
import { members } from "@/lib/data";
import { MemberTable } from "./components/member-table";

export default function MembersPage() {
  return (
    <div>
      <PageHeader title="Membership Management" />
      <MemberTable initialMembers={members} />
    </div>
  );
}
