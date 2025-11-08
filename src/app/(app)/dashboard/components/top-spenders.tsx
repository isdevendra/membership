
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Placeholder data - we'll connect this to live data later
const topSpendersData = [
    { id: '1', name: 'Eleanora Vance', avatar: '/avatars/01.png', amount: 12540.50, tier: 'Platinum' },
    { id: '2', name: 'Bartholomew Higgins', avatar: '/avatars/02.png', amount: 9820.00, tier: 'Gold' },
    { id: '3', name: 'Seraphina Monroe', avatar: '/avatars/03.png', amount: 8500.75, tier: 'Gold' },
    { id: '4', name: 'Jasper Knight', avatar: '/avatars/04.png', amount: 7200.00, tier: 'Silver' },
    { id: '5', name: 'Isabella Dubois', avatar: '/avatars/05.png', amount: 6100.25, tier: 'Silver' },
];


const tierColors: { [key: string]: string } = {
    Platinum: "bg-sky-200 text-black",
    Gold: "bg-yellow-500",
    Silver: "bg-slate-400",
};


export function TopSpenders() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Top Spenders</CardTitle>
                <CardDescription>Top members by total spending this month.</CardDescription>
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
                        {topSpendersData.map(member => (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={member.avatar} alt={member.name} />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{member.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={`text-white ${tierColors[member.tier]}`}>
                                        {member.tier}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">${member.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
