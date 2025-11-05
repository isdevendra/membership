"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
} from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Member, type MemberTier } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import { format } from "date-fns";

const tierColors: Record<MemberTier, string> = {
    Bronze: "bg-amber-700",
    Silver: "bg-slate-400",
    Gold: "bg-yellow-500",
    Platinum: "bg-sky-200 text-black",
    Regular: "bg-gray-500",
    VIP: "bg-purple-700",
    Staff: "bg-blue-700",
    Blacklist: "bg-red-700",
};

export function MemberTable() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const membersCollection = useMemoFirebase(() => {
    // Wait until we have a user to create the query
    if (!firestore || !user) return null;
    return collection(firestore, 'memberships');
  }, [firestore, user]);

  const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersCollection);

  const [searchTerm, setSearchTerm] = React.useState("");

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const isLoading = isUserLoading || isLoadingMembers;

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    return members.filter(
      (member) =>
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.id && member.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [members, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Members</CardTitle>
        <CardDescription>
          A list of all members in the casino.
        </CardDescription>
        <div className="flex items-center gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or ID..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Member
            </span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading members...</TableCell>
                </TableRow>
            )}
            {!isLoading && filteredMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                       <AvatarImage src={member.photo} alt={member.fullName} />
                      <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                      <span className="font-semibold">{member.fullName}</span>
                      <span className="text-sm text-muted-foreground">{member.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-white ${tierColors[member.tier]}`}>
                    {member.tier}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.points.toLocaleString()}
                </TableCell>
                <TableCell>{format(new Date(member.joinDate), "MM/dd/yyyy")}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Update Tier</DropdownMenuItem>
                      <DropdownMenuItem>Redeem Rewards</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
