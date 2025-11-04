import {
  Award,
  CalendarPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MembershipChart } from "./components/membership-chart";
import { members } from "@/lib/data";

export default function DashboardPage() {
  const totalMembers = members.length;
  const newMembersThisMonth = 12; 
  const rewardsRedeemed = 42;

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">+2.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Members (Month)
            </CardTitle>
            <CalendarPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newMembersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {`+${((newMembersThisMonth / (totalMembers-newMembersThisMonth)) * 100).toFixed(1)}% this month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{rewardsRedeemed}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <MembershipChart />
      </div>
    </div>
  );
}
