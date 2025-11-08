
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Placeholder data - we'll connect this to live data later
const frequentVisitorsData = [
    { id: '6', name: 'Maximilian Sterling', avatar: '/avatars/06.png', visits: 28, tier: 'Platinum' },
    { id: '1', name: 'Eleanora Vance', avatar: '/avatars/01.png', visits: 25, tier: 'Platinum' },
    { id: '7', name: 'Cassandra Bell', avatar: '/avatars/07.png', visits: 22, tier: 'Gold' },
    { id: '2', name: 'Bartholomew Higgins', avatar: '/avatars/02.png', visits: 19, tier: 'Gold' },
    { id: '8', name: 'Leo Maxwell', avatar: '/avatars/08.png', visits: 18, tier: 'Silver' },
];

const tierColors: { [key: string]: string } = {
    Platinum: "bg-sky-200 text-black",
    Gold: "bg-yellow-500",
    Silver: "bg-slate-400",
};


export function FrequentVisitors() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Most Frequent Visitors</CardTitle>
                <CardDescription>Top members by number of visits this month.</CardDescription>
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
                        {frequentVisitorsData.map(member => (
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
                                <TableCell className="text-right font-mono">{member.visits}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
