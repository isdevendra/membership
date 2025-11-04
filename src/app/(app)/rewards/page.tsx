import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const rewards = [
    { name: "Free Buffet Pass", points: 500, category: "Dining" },
    { name: "$10 Free Play", points: 1000, category: "Gaming" },
    { name: "Deluxe Room Night", points: 15000, category: "Hotel" },
    { name: "Show Tickets (Standard)", points: 7500, category: "Entertainment" },
    { name: "$50 Spa Voucher", points: 10000, category: "Amenities" },
    { name: "VIP Lounge Access", points: 25000, category: "VIP" },
]

export default function RewardsPage() {
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
                        placeholder="Search for a member by ID or name..."
                        className="pl-8"
                        />
                    </div>
                    <Button>Search Member</Button>
                </div>
                
                <div className="border rounded-lg p-4 flex justify-between items-center bg-muted/20">
                    <div>
                        <p className="font-semibold text-lg">Eleanora Vance (M-1001)</p>
                        <p className="text-sm text-muted-foreground">Tier: Gold</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-primary">75,000</p>
                        <p className="text-xs text-muted-foreground">Available Points</p>
                    </div>
                </div>

                 <div>
                    <h3 className="text-lg font-semibold mb-2">Available Rewards</h3>
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
                                {rewards.map(reward => (
                                    <TableRow key={reward.name}>
                                        <TableCell className="font-medium">{reward.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{reward.category}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{reward.points.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" disabled={reward.points > 75000}>Redeem</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                 </div>

            </CardContent>
        </Card>
    </div>
  );
}
