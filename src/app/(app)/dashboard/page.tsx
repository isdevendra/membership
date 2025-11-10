
'use client';

import { Award, CalendarPlus, Users, Gem, LogIn, LogOut, Ban } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MembershipChart } from './components/membership-chart';
import { TierDistributionChart } from './components/tier-distribution-chart';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import type { Member } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TopSpenders } from './components/top-spenders';
import { FrequentVisitors } from './components/frequent-visitors';
import { toDate } from '@/lib/utils';
import { startOfToday } from 'date-fns';

export default function DashboardPage() {
  const firestore = useFirestore();

  const membersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'memberships') : null),
    [firestore]
  );

  const { data: members, isLoading } = useCollection<Member>(membersCollection);

  const stats = useMemo(() => {
    if (!members) {
      return {
        totalMembers: 0,
        newMembersToday: 0,
        rewardsRedeemed: 42, // Static for now
        totalPoints: 0,
        checkedIn: 0,
        checkedOut: 0,
        banned: 0,
      };
    }

    const todayStart = startOfToday();

    const newMembersToday = members.filter(member => {
        if (!member.joinDate) return false;
        const joinDate = toDate(member.joinDate);
        return joinDate ? joinDate >= todayStart : false;
    }).length;
    
    const totalPoints = members.reduce((sum, member) => sum + (member.points || 0), 0);
    const checkedIn = members.filter(m => m.status === 'Checked In').length;
    const banned = members.filter(m => m.tier === 'Blacklist').length;
    const checkedOut = members.length - checkedIn;

    return {
      totalMembers: members.length,
      newMembersToday,
      rewardsRedeemed: 42, // This would need redemptions data
      totalPoints,
      checkedIn,
      checkedOut,
      banned
    };
  }, [members]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
             <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </CardContent>
            </Card>
          ))}
        </div>
         <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
            </Card>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[480px] w-full" />
          <Skeleton className="h-[480px] w-full" />
        </div>
      </div>
    );
  }


  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Live membership count
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Members (Today)
            </CardTitle>
            <CalendarPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.newMembersToday}</div>
            <p className="text-xs text-muted-foreground">
              {`Enrolled today`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.rewardsRedeemed}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
      </div>

       <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                <LogIn className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.checkedIn}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
                <LogOut className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.checkedOut}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Banned Members</CardTitle>
                <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.banned}</div>
            </CardContent>
        </Card>
      </div>


      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MembershipChart />
        <TierDistributionChart members={members ?? []} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TopSpenders />
        <FrequentVisitors />
      </div>
    </div>
  );
}
