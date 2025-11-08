
'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Award } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, where, query, limit } from 'firebase/firestore';
import { type Member } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

type Reward = {
    id: string;
    name: string;
    pointsCost: number;
    category: string;
};

export default function RewardsPage() {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedMember, setSearchedMember] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    const rewardsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rewards') : null, [firestore]);
    const { data: rewards, isLoading: isLoadingRewards } = useCollection<Reward>(rewardsCollection);
    
    const memberSearchQuery = useMemoFirebase(() => {
        if (!firestore || !searchTerm || !searchedMember) return null;
        
        // Simple search: assumes searchTerm is the member ID for now
        // A more complex search could query by name, but that requires exact matches or more complex indexing.
        const idQuery = query(collection(firestore, 'memberships'), where('id', '==', searchTerm), limit(1));
        const nameQuery = query(collection(firestore, 'memberships'), where('fullName', '==', searchTerm), limit(1));

        // In a real app, you might run two queries or use a search service like Algolia
        // For now, we'll just search by name.
        return nameQuery;

    }, [firestore, searchTerm, searchedMember]);

    const { data: foundMembers, isLoading: isLoadingMembers } = useCollection<Member>(memberSearchQuery);

    const handleSearch = () => {
        if (searchTerm.trim()) {
            setSearchedMember(true);
        }
    };
    
    React.useEffect(() => {
        if (searchedMember && !isLoadingMembers) {
            if (foundMembers && foundMembers.length > 0) {
                setSelectedMember(foundMembers[0]);
            } else {
                setSelectedMember(null);
                toast({
                    variant: 'destructive',
                    title: "Member not found",
                    description: "No member found with that name or ID. Please try again.",
                });
            }
            setSearchedMember(false); // Reset search trigger
        }
    }, [foundMembers, isLoadingMembers, searchedMember]);

    const handleRedeem = (reward: Reward) => {
        if (!firestore || !selectedMember || selectedMember.points < reward.pointsCost) {
            return;
        }

        const newPoints = selectedMember.points - reward.pointsCost;
        const memberDocRef = doc(firestore, 'memberships', selectedMember.id);
        const redemptionsColRef = collection(firestore, 'memberships', selectedMember.id, 'redemptions');

        // 1. Update member's points
        updateDocumentNonBlocking(memberDocRef, { points: newPoints });

        // 2. Create a redemption record
        addDocumentNonBlocking(redemptionsColRef, {
            memberId: selectedMember.id,
            rewardId: reward.id,
            rewardName: reward.name,
            pointsCost: reward.pointsCost,
            redemptionDate: new Date().toISOString(),
        });
        
        // 3. Optimistically update local state
        setSelectedMember(prev => prev ? { ...prev, points: newPoints } : null);

        toast({
            title: "Reward Redeemed!",
            description: `${selectedMember.fullName} redeemed ${reward.name}.`,
        });
    };

  return (
    <div>
      <PageHeader title="Reward Redemption" />
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Redeem Rewards</CardTitle>
                <CardDescription>
                Search for a member to view their points and redeem rewards.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search for a member by full name..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={isLoadingMembers}>
                        {isLoadingMembers ? 'Searching...' : 'Search Member'}
                    </Button>
                </div>
                
                {selectedMember && (
                    <div className="border rounded-lg p-4 flex justify-between items-center bg-muted/20">
                        <div>
                            <p className="font-semibold text-lg">{selectedMember.fullName} ({selectedMember.id})</p>
                            <p className="text-sm text-muted-foreground">Tier: {selectedMember.tier}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{selectedMember.points.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Available Points</p>
                        </div>
                    </div>
                )}

                {selectedMember && (
                 <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Award className="h-5 w-5"/>
                        Available Rewards
                    </h3>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reward</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Points Required</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingRewards && <TableRow><TableCell colSpan={4} className="text-center">Loading rewards...</TableCell></TableRow>}
                                {!isLoadingRewards && rewards && rewards.map(reward => (
                                    <TableRow key={reward.id}>
                                        <TableCell className="font-medium">{reward.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{reward.category}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{reward.pointsCost.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" disabled={reward.pointsCost > (selectedMember?.points ?? 0)} onClick={() => handleRedeem(reward)}>Redeem</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                 </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
