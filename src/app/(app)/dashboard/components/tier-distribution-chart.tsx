
"use client";

import { useMemo } from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Member, MemberTier } from "@/lib/types";

const tierColors: Record<MemberTier, string> = {
    Bronze: "hsl(var(--chart-5))",
    Silver: "hsl(var(--chart-3))",
    Gold: "hsl(var(--chart-2))",
    Platinum: "hsl(var(--chart-1))",
    Regular: "hsl(var(--muted))",
    VIP: "hsl(var(--primary))",
    Blacklist: "hsl(var(--destructive))",
};


interface TierDistributionChartProps {
    members: Member[];
}

export function TierDistributionChart({ members }: TierDistributionChartProps) {
  const chartData = useMemo(() => {
    const tierCounts = members.reduce((acc, member) => {
      acc[member.tier] = (acc[member.tier] || 0) + 1;
      return acc;
    }, {} as Record<MemberTier, number>);

    return Object.entries(tierCounts).map(([tier, count]) => ({
      tier: tier as MemberTier,
      members: count,
      fill: tierColors[tier as MemberTier] || tierColors.Regular,
    }));
  }, [members]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Tier Distribution</CardTitle>
        <CardDescription>Distribution of members by tier.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px] w-full">
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                    data={chartData}
                    dataKey="members"
                    nameKey="tier"
                    innerRadius={60}
                    strokeWidth={5}
                >
                    {chartData.map((entry) => (
                    <Cell key={`cell-${entry.tier}`} fill={entry.fill} />
                    ))}
                </Pie>
            </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex w-full flex-wrap gap-2">
            {chartData.map((entry) => (
                <div key={entry.tier} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <span className="text-muted-foreground">{entry.tier} ({entry.members})</span>
                </div>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
}
