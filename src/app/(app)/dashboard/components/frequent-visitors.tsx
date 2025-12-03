
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { type Member, type MemberTier } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


const tierColors: Record<MemberTier, string> = {
    Bronze: "bg-amber-700",
    Silver: "bg-slate-400",
    Gold: "bg-yellow-500",
    Platinum: "bg-sky-200 text-black",
    Regular: "bg-gray-500",
    VIP: "bg-purple-700",
    Blacklist: "bg-red-700",
};


interface FrequentVisitorsProps {
    members: Member[];
}

export function FrequentVisitors({ members }: FrequentVisitorsProps) {

    const frequentVisitorsData = useMemo(() => {
        // In a real app, visit data would come from a check-in collection.
        // For now, we'll simulate it with random data based on join date.
        return [...members]
            .sort((a, b) => (b.joinDate as any).seconds - (a.joinDate as any).seconds) // Oldest members first
            .slice(0, 5)
            .map(member => ({
                ...member,
                visits: Math.floor(Math.random() * 25) + 5 // Random visits between 5 and 30
            }))
            .sort((a,b) => b.visits - a.visits); // Sort by most visits

    }, [members]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Most Frequent Visitors</CardTitle>
                <CardDescription>Top members by number of visits this month. (Simulated)</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead className="text-right">Visits</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.length === 0 && frequentVisitorsData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No members found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            frequentVisitorsData.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={member.photo} alt={member.fullName} />
                                                <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{member.fullName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`text-white ${tierColors[member.tier]}`}>
                                            {member.tier}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{member.visits}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
