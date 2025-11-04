"use client";

import { TrendingUp } from "lucide-react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
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

const chartData = [
  { date: "2024-06-01", members: 232 },
  { date: "2024-06-02", members: 245 },
  { date: "2024-06-03", members: 255 },
  { date: "2024-06-04", members: 260 },
  { date: "2024-06-05", members: 278 },
  { date: "2024-06-06", members: 290 },
  { date: "2024-06-07", members: 301 },
  { date: "2024-06-08", members: 305 },
  { date: "2024-06-09", members: 320 },
  { date: "2024-06-10", members: 329 },
  { date: "2024-06-11", members: 340 },
  { date: "2024-06-12", members: 345 },
  { date: "2024-06-13", members: 351 },
  { date: "2024-06-14", members: 360 },
  { date: "2024-06-15", members: 375 },
  { date: "2024-06-16", members: 380 },
  { date: "2024-06-17", members: 392 },
  { date: "2024-06-18", members: 405 },
  { date: "2024-06-19", members: 410 },
  { date: "2024-06-20", members: 422 },
  { date: "2024-06-21", members: 425 },
  { date: "2024-06-22", members: 430 },
  { date: "2024-06-23", members: 441 },
  { date: "2024-06-24", members: 450 },
  { date: "2024-06-25", members: 455 },
  { date: "2024-06-26", members: 461 },
  { date: "2024-06-27", members: 470 },
  { date: "2024-06-28", members: 483 },
  { date: "2024-06-29", members: 490 },
  { date: "2024-06-30", members: 502 },
];

const chartConfig = {
  members: {
    label: "New Members",
    color: "hsl(var(--primary))",
  },
};

export function MembershipChart() {
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
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total new members for the last 30 days
        </div>
      </CardFooter>
    </Card>
  );
}
