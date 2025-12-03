
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


interface TopSpendersProps {
    members: Member[];
}

export function TopSpenders({ members }: TopSpendersProps) {

    const topSpendersData = useMemo(() => {
        // In a real app, spending data would come from a transaction collection.
        // For now, we'll simulate it by using the 'points' as a proxy for spending,
        // and sort by that. We'll add some randomness to make it look more realistic.
        return [...members]
            .sort((a, b) => b.points - a.points)
            .slice(0, 5)
            .map(member => ({
                ...member,
                // Simulate spending amount. Let's say 1 point = $0.5 spent.
                amount: (member.points || 0) * (0.5 + Math.random() * 0.5)
            }));

    }, [members]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Top Spenders</CardTitle>
                <CardDescription>Top members by total spending this month. (Simulated)</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.length === 0 && topSpendersData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No members found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            topSpendersData.map(member => (
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
                                    <TableCell className="text-right font-mono">${member.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
