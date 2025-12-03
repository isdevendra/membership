
"use client";

import { useMemo } from 'react';
import { TrendingUp } from "lucide-react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
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
import { type Member } from '@/lib/types';
import { toDate } from '@/lib/utils';


const chartConfig = {
  members: {
    label: "New Members",
    color: "hsl(var(--primary))",
  },
};

interface MembershipChartProps {
    members: Member[];
}

export function MembershipChart({ members }: MembershipChartProps) {

    const { chartData, totalNew, percentageChange } = useMemo(() => {
        const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));
        const today = startOfDay(new Date());
        const interval = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

        const membersByDate = members.reduce((acc, member) => {
            const joinDate = toDate(member.joinDate);
            if (joinDate) {
                const dateKey = format(startOfDay(joinDate), 'yyyy-MM-dd');
                acc[dateKey] = (acc[dateKey] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        let cumulativeMembers = 0;
        const chartData = interval.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            cumulativeMembers += (membersByDate[dateKey] || 0);
            return {
                date: dateKey,
                members: cumulativeMembers,
            };
        });
        
        const totalNew = chartData[chartData.length - 1]?.members - (chartData[0]?.members - (membersByDate[chartData[0]?.date] || 0));
        const previousTotal = chartData[0]?.members - (membersByDate[chartData[0]?.date] || 0);
        const percentageChange = previousTotal > 0 ? ((totalNew / previousTotal) * 100) : totalNew > 0 ? 100 : 0;


        return { chartData, totalNew, percentageChange };
    }, [members]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Membership Growth</CardTitle>
        <CardDescription>New members over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['dataMin', 'dataMax']}
                />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Line
              dataKey="members"
              type="natural"
              stroke="var(--color-members)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
           Trending up by {percentageChange.toFixed(1)}% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total new members for the last 30 days
        </div>
      </CardFooter>
    </Card>
  );
}
